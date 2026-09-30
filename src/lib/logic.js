import { addDays, startOf, toISO, isoWeekday } from './dates'
import { PLANES, NIVELES } from './seed'

export const CUPO = 10
export const HORAS_MIN = 6
export const DIAS_VENCIMIENTO = 30

export const sesionId = (claseId, fecha) => `${claseId}@${fecha}`
export const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
export const horasHasta = (fecha, hora, now) => (startOf(fecha, hora) - now) / 36e5

export const claseDe = (state, id) => state.clases.find((c) => c.id === id)
export const alumnoDe = (state, id) => state.alumnos.find((a) => a.id === id)

/** Un crédito activo con vencimiento pasado se considera vencido. */
export const estadoCredito = (cr, now) => (cr.estado === 'activo' && toISO(now) > cr.fecha_vencimiento ? 'vencido' : cr.estado)

export function getSesion(state, claseId, fecha) {
  return state.sesiones.find((s) => s.clase_id === claseId && s.fecha === fecha) || { clase_id: claseId, fecha, asistencias: [] }
}

/** Ocupación de una clase en una fecha. libres = cupo − fijos sin aviso − recuperaciones reservadas. */
export function ocupacion(state, clase, fecha) {
  const ses = getSesion(state, clase.id, fecha)
  const asis = (id) => ses.asistencias.find((a) => a.alumno_id === id)
  const fijos = state.alumnos
    .filter((a) => a.clases_fijas.includes(clase.id))
    .map((alumno) => ({ alumno, asistencia: asis(alumno.id) }))
  const sid = sesionId(clase.id, fecha)
  const recups = state.reservas
    .filter((r) => r.sesion_id === sid && r.estado === 'reservada')
    .map((reserva) => ({
      reserva,
      alumno: alumnoDe(state, reserva.alumno_id),
      credito: state.creditos.find((c) => c.id === reserva.credito_id),
      asistencia: asis(reserva.alumno_id),
    }))
  const externos = clase.externos || 0
  const fijosOcupan = fijos.filter((f) => f.asistencia?.estado !== 'ausente_avisada').length
  const ocupados = externos + fijosOcupan + recups.length
  return { fijos, recups, externos, ocupados, libres: Math.max(0, clase.cupo - ocupados), cupo: clase.cupo }
}

const upsertAsistencia = (state, claseId, fecha, alumnoId, asistencia) => {
  const sesiones = state.sesiones.map((s) => ({ ...s, asistencias: [...s.asistencias] }))
  let s = sesiones.find((x) => x.clase_id === claseId && x.fecha === fecha)
  if (!s) sesiones.push((s = { clase_id: claseId, fecha, asistencias: [] }))
  s.asistencias = s.asistencias.filter((a) => a.alumno_id !== alumnoId)
  if (asistencia) s.asistencias.push(asistencia)
  return sesiones.filter((x) => x.asistencias.length > 0)
}

const fail = (error) => ({ error })

/* ---------------- acciones: (state, now, args) → { state, ... } | { error } ---------------- */

export function marcarPresente(state, now, { claseId, fecha, alumnoId }) {
  const prev = getSesion(state, claseId, fecha).asistencias.find((a) => a.alumno_id === alumnoId)
  if (prev?.estado === 'ausente_avisada') return fail('Ese aviso ya generó un crédito. Deshaz el aviso antes de marcar presente.')
  const asistencia = { alumno_id: alumnoId, estado: 'presente', nota_progreso: prev?.nota_progreso || '' }
  return { state: { ...state, sesiones: upsertAsistencia(state, claseId, fecha, alumnoId, asistencia) } }
}

export function marcarAusenteSinAviso(state, now, { claseId, fecha, alumnoId }) {
  const prev = getSesion(state, claseId, fecha).asistencias.find((a) => a.alumno_id === alumnoId)
  if (prev?.estado === 'ausente_avisada') return fail('Ese aviso ya generó un crédito. Deshaz el aviso primero.')
  const asistencia = { alumno_id: alumnoId, estado: 'ausente_sin_aviso', nota_progreso: prev?.nota_progreso || '' }
  return { state: { ...state, sesiones: upsertAsistencia(state, claseId, fecha, alumnoId, asistencia) } }
}

export function guardarNota(state, now, { claseId, fecha, alumnoId, nota }) {
  const prev = getSesion(state, claseId, fecha).asistencias.find((a) => a.alumno_id === alumnoId)
  if (!prev) return fail('Primero marca la asistencia.')
  return { state: { ...state, sesiones: upsertAsistencia(state, claseId, fecha, alumnoId, { ...prev, nota_progreso: nota }) } }
}

/** Avisar ausencia: ≥6 h genera crédito y libera el lugar; <6 h no genera crédito. */
export function avisarAusencia(state, now, { claseId, fecha, alumnoId }) {
  const clase = claseDe(state, claseId)
  const horas = horasHasta(fecha, clase.hora, now)
  if (horas <= 0) return fail('La clase ya comenzó: no se puede avisar ausencia.')
  const prev = getSesion(state, claseId, fecha).asistencias.find((a) => a.alumno_id === alumnoId)
  if (prev?.estado === 'ausente_avisada') return fail('Ya hay un aviso registrado para esta clase.')
  const conCredito = horas >= HORAS_MIN
  const asistencia = {
    alumno_id: alumnoId,
    estado: conCredito ? 'ausente_avisada' : 'ausente_sin_aviso',
    aviso_tardio: !conCredito,
    nota_progreso: prev?.nota_progreso || '',
  }
  let creditos = state.creditos
  let credito = null
  if (conCredito) {
    credito = {
      id: uid('cr'),
      alumno_id: alumnoId,
      nivel_origen: clase.nivel,
      fecha_generacion: toISO(now),
      fecha_vencimiento: addDays(fecha, DIAS_VENCIMIENTO),
      estado: 'activo',
      sesion_origen_id: sesionId(claseId, fecha),
      clase_origen_id: claseId,
      fecha_clase: fecha,
    }
    creditos = [...creditos, credito]
  }
  return {
    state: { ...state, creditos, sesiones: upsertAsistencia(state, claseId, fecha, alumnoId, asistencia) },
    credito,
    conCredito,
  }
}

export function deshacerAsistencia(state, now, { claseId, fecha, alumnoId }) {
  const prev = getSesion(state, claseId, fecha).asistencias.find((a) => a.alumno_id === alumnoId)
  if (!prev) return { state }
  let creditos = state.creditos
  if (prev.estado === 'ausente_avisada') {
    const sid = sesionId(claseId, fecha)
    const cr = creditos.find((c) => c.sesion_origen_id === sid && c.alumno_id === alumnoId)
    if (cr && cr.estado === 'consumido') return fail('El crédito de este aviso ya fue usado en una recuperación. Cancela esa recuperación primero.')
    if (ocupacion(state, claseDe(state, claseId), fecha).libres <= 0) return fail('El lugar liberado ya fue tomado por una recuperación: no se puede deshacer el aviso.')
    creditos = creditos.filter((c) => c !== cr)
  }
  return { state: { ...state, creditos, sesiones: upsertAsistencia(state, claseId, fecha, alumnoId, null) } }
}

/** Clases futuras del nivel actual del alumno con cupo, hasta el vencimiento del crédito. */
export function sesionesDisponibles(state, now, alumno, credito) {
  const out = []
  const hoy = toISO(now)
  const hasta = credito ? credito.fecha_vencimiento : addDays(hoy, DIAS_VENCIMIENTO)
  for (let d = hoy; d <= hasta; d = addDays(d, 1)) {
    for (const clase of state.clases) {
      if (clase.nivel !== alumno.nivel_actual || clase.dia_semana !== isoWeekday(d)) continue
      if (startOf(d, clase.hora) <= now) continue
      if (alumno.clases_fijas.includes(clase.id)) continue
      const sid = sesionId(clase.id, d)
      if (state.reservas.some((r) => r.sesion_id === sid && r.alumno_id === alumno.id && r.estado === 'reservada')) continue
      const oc = ocupacion(state, clase, d)
      if (oc.libres <= 0) continue
      out.push({ clase, fecha: d, libres: oc.libres, ocupados: oc.ocupados })
    }
  }
  return out.sort((a, b) => (a.fecha + a.clase.hora).localeCompare(b.fecha + b.clase.hora))
}

export function reservarRecuperacion(state, now, { creditoId, claseId, fecha }) {
  const cr = state.creditos.find((c) => c.id === creditoId)
  if (!cr) return fail('No se encontró el crédito.')
  if (estadoCredito(cr, now) !== 'activo') return fail('Ese crédito no está vigente.')
  const alumno = alumnoDe(state, cr.alumno_id)
  const clase = claseDe(state, claseId)
  if (clase.nivel !== alumno.nivel_actual) return fail(`Solo se puede recuperar en clases de ${alumno.nivel_actual}.`)
  if (startOf(fecha, clase.hora) <= now) return fail('Esa clase ya comenzó o pasó.')
  if (fecha > cr.fecha_vencimiento) return fail('La clase es posterior al vencimiento del crédito.')
  if (ocupacion(state, clase, fecha).libres <= 0) return fail('La clase se llenó: no quedan lugares libres.')
  if (alumno.clases_fijas.includes(clase.id)) return fail('Esa es una de sus clases fijas.')
  const sid = sesionId(claseId, fecha)
  if (state.reservas.some((r) => r.sesion_id === sid && r.alumno_id === alumno.id && r.estado === 'reservada')) return fail('Ya tiene una recuperación reservada en esa clase.')
  const reserva = { id: uid('rs'), credito_id: cr.id, sesion_id: sid, clase_id: claseId, fecha, alumno_id: alumno.id, estado: 'reservada', creada: toISO(now) }
  return {
    state: {
      ...state,
      reservas: [...state.reservas, reserva],
      creditos: state.creditos.map((c) => (c.id === cr.id ? { ...c, estado: 'consumido', reserva_id: reserva.id } : c)),
    },
    reserva,
  }
}

/** Cancelar recuperación: ≥6 h devuelve el crédito a activo; <6 h lo pierde. */
export function cancelarReserva(state, now, { reservaId }) {
  const r = state.reservas.find((x) => x.id === reservaId)
  if (!r || r.estado !== 'reservada') return fail('La recuperación ya no está reservada.')
  const clase = claseDe(state, r.clase_id)
  const horas = horasHasta(r.fecha, clase.hora, now)
  if (horas <= 0) return fail('La clase ya comenzó: no se puede cancelar.')
  const devuelve = horas >= HORAS_MIN
  return {
    state: {
      ...state,
      reservas: state.reservas.map((x) => (x.id === r.id ? { ...x, estado: 'cancelada', cancelada_en: toISO(now), sin_devolucion: !devuelve } : x)),
      creditos: state.creditos.map((c) => (c.id === r.credito_id && devuelve ? { ...c, estado: 'activo', reserva_id: null } : c)),
      sesiones: upsertAsistencia(state, r.clase_id, r.fecha, r.alumno_id, null),
    },
    devuelve,
  }
}

export function pasarDeNivel(state, now, { alumnoId, nivel, clasesFijas }) {
  const alumno = alumnoDe(state, alumnoId)
  if (!NIVELES.includes(nivel)) return fail('Nivel inválido.')
  if (nivel === alumno.nivel_actual) return fail('El alumno ya está en ese nivel.')
  const cant = PLANES[alumno.plan].clases
  if (clasesFijas.length !== cant) return fail(`Su plan ${alumno.plan} requiere elegir ${cant} clase${cant > 1 ? 's' : ''} fija${cant > 1 ? 's' : ''}.`)
  if (clasesFijas.some((id) => claseDe(state, id)?.nivel !== nivel)) return fail('Las clases fijas deben ser del nivel nuevo.')
  const actualizado = {
    ...alumno,
    nivel_actual: nivel,
    clases_fijas: clasesFijas,
    pases: [...(alumno.pases || []), { fecha: toISO(now), de: alumno.nivel_actual, a: nivel }],
  }
  return { state: { ...state, alumnos: state.alumnos.map((a) => (a.id === alumnoId ? actualizado : a)) } }
}

export function cambiarVista(state, now, { rol, alumnoId }) {
  return { state: { ...state, ajustes: { ...state.ajustes, rol, alumnoId: alumnoId || state.ajustes.alumnoId || state.alumnos[0].id } } }
}

export function ajustarReloj(state, now, { deltaMin, reset }) {
  const offsetMin = reset ? 0 : (state.ajustes.offsetMin || 0) + deltaMin
  return { state: { ...state, ajustes: { ...state.ajustes, offsetMin } } }
}

/** Persiste como vencidos los créditos activos cuya fecha ya pasó. */
export function normalizar(state, now) {
  let cambio = false
  const creditos = state.creditos.map((c) => {
    if (estadoCredito(c, now) === 'vencido' && c.estado !== 'vencido') {
      cambio = true
      return { ...c, estado: 'vencido' }
    }
    return c
  })
  return cambio ? { ...state, creditos } : state
}
