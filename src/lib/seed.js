import { addDays, isoWeekday, toISO } from './dates'

export const NIVELES = ['Iniciación', 'Básico', 'Intermedio', 'Avanzado', 'Niños']

export const PLANES = {
  '1x': { id: '1x', nombre: '1 clase por semana', corto: '1x', precio: 48000, clases: 1 },
  '2x': { id: '2x', nombre: '2 clases por semana', corto: '2x', precio: 78000, clases: 2 },
}

// dia_semana: 1 = lunes … 7 = domingo. `externos` = alumnos fijos sin ficha en esta demo.
const c = (id, nivel, dia_semana, hora, externos) => ({ id, nivel, dia_semana, hora, duracion: 90, cupo: 10, externos })

export const CLASES = [
  c('ini-L-1900', 'Iniciación', 1, '19:00', 4),
  c('ini-X-1900', 'Iniciación', 3, '19:00', 5),
  c('ini-S-1000', 'Iniciación', 6, '10:00', 6),
  c('bas-M-1900', 'Básico', 2, '19:00', 5),
  c('bas-J-1900', 'Básico', 4, '19:00', 6),
  c('bas-S-1130', 'Básico', 6, '11:30', 4),
  c('int-L-2030', 'Intermedio', 1, '20:30', 6),
  c('int-X-1900', 'Intermedio', 3, '19:00', 8),
  c('int-V-1900', 'Intermedio', 5, '19:00', 7),
  c('ava-M-2030', 'Avanzado', 2, '20:30', 7),
  c('ava-J-2030', 'Avanzado', 4, '20:30', 7),
  c('ava-S-1300', 'Avanzado', 6, '13:00', 5),
  c('nin-S-1000', 'Niños', 6, '10:00', 7),
  c('nin-D-1100', 'Niños', 7, '11:00', 6),
]

const lastDate = (dow, hoy) => {
  let d = addDays(hoy, -1)
  while (isoWeekday(d) !== dow) d = addDays(d, -1)
  return d
}
const nextDate = (dow, hoy) => {
  let d = addDays(hoy, 1)
  while (isoWeekday(d) !== dow) d = addDays(d, 1)
  return d
}

export function crearDatosEjemplo(now = new Date()) {
  const hoy = toISO(now)

  const alumnos = [
    { id: 'al-camila', nombre: 'Camila Reyes', nivel_actual: 'Iniciación', plan: '2x', clases_fijas: ['ini-L-1900', 'ini-S-1000'], telefono: '+56 9 5550 1201', pases: [] },
    { id: 'al-tomas', nombre: 'Tomás Figueroa', nivel_actual: 'Básico', plan: '1x', clases_fijas: ['bas-M-1900'], telefono: '+56 9 5550 1202', pases: [] },
    { id: 'al-valentina', nombre: 'Valentina Soto', nivel_actual: 'Intermedio', plan: '2x', clases_fijas: ['int-L-2030', 'int-X-1900'], telefono: '+56 9 5550 1203', pases: [] },
    { id: 'al-matias', nombre: 'Matías Contreras', nivel_actual: 'Avanzado', plan: '2x', clases_fijas: ['ava-M-2030', 'ava-J-2030'], telefono: '+56 9 5550 1204', pases: [] },
    { id: 'al-josefa', nombre: 'Josefa Araya', nivel_actual: 'Intermedio', plan: '1x', clases_fijas: ['int-X-1900'], telefono: '+56 9 5550 1205', pases: [{ fecha: addDays(hoy, -3), de: 'Básico', a: 'Intermedio' }] },
    { id: 'al-benjamin', nombre: 'Benjamín Muñoz (9 años)', nivel_actual: 'Niños', plan: '1x', clases_fijas: ['nin-S-1000'], telefono: '+56 9 5550 1206', pases: [] },
  ]

  const sesiones = []
  const creditos = []
  const reservas = []

  const ausencia = (alumno_id, claseId, fecha, nivelOrigen, estadoCredito, diasAntes = 3) => {
    const sid = `${claseId}@${fecha}`
    let s = sesiones.find((x) => x.clase_id === claseId && x.fecha === fecha)
    if (!s) sesiones.push((s = { clase_id: claseId, fecha, asistencias: [] }))
    s.asistencias.push({ alumno_id, estado: 'ausente_avisada', nota_progreso: '' })
    const cr = {
      id: `cr-${alumno_id.slice(3)}-${fecha}`,
      alumno_id,
      nivel_origen: nivelOrigen,
      fecha_generacion: addDays(fecha, -diasAntes),
      fecha_vencimiento: addDays(fecha, 30),
      estado: estadoCredito,
      sesion_origen_id: sid,
      clase_origen_id: claseId,
      fecha_clase: fecha,
    }
    creditos.push(cr)
    return cr
  }
  const presente = (alumno_id, claseId, fecha, nota) => {
    let s = sesiones.find((x) => x.clase_id === claseId && x.fecha === fecha)
    if (!s) sesiones.push((s = { clase_id: claseId, fecha, asistencias: [] }))
    s.asistencias.push({ alumno_id, estado: 'presente', nota_progreso: nota || '' })
  }

  // Camila: crédito activo por ausencia avisada del lunes pasado
  ausencia('al-camila', 'ini-L-1900', lastDate(1, hoy), 'Iniciación', 'activo')
  presente('al-camila', 'ini-S-1000', lastDate(6, hoy), 'Ya sube el mantel del sector verde sin ayuda de pies.')

  // Tomás: un crédito vencido y otro activo
  ausencia('al-tomas', 'bas-M-1900', addDays(lastDate(2, hoy), -35), 'Básico', 'activo', 4)
  ausencia('al-tomas', 'bas-M-1900', addDays(lastDate(2, hoy), -7), 'Básico', 'activo', 2)
  presente('al-tomas', 'bas-M-1900', lastDate(2, hoy), 'Mejorando la lectura de secuencias en placa.')

  // Valentina: un crédito consumido (reserva próxima) y uno activo
  const credConsumido = ausencia('al-valentina', 'int-L-2030', addDays(lastDate(1, hoy), -7), 'Intermedio', 'consumido', 5)
  const viernes = nextDate(5, hoy)
  reservas.push({
    id: 'rs-valentina-1',
    credito_id: credConsumido.id,
    sesion_id: `int-V-1900@${viernes}`,
    clase_id: 'int-V-1900',
    fecha: viernes,
    alumno_id: 'al-valentina',
    estado: 'reservada',
    creada: addDays(hoy, -1),
  })
  credConsumido.reserva_id = 'rs-valentina-1'
  ausencia('al-valentina', 'int-X-1900', lastDate(3, hoy), 'Intermedio', 'activo', 2)

  // Matías: crédito activo
  ausencia('al-matias', 'ava-J-2030', addDays(lastDate(4, hoy), -7), 'Avanzado', 'activo', 3)

  // Josefa: crédito generado cuando aún estaba en Básico (pasó a Intermedio)
  ausencia('al-josefa', 'bas-J-1900', lastDate(4, hoy), 'Básico', 'activo', 2)

  // Benjamín: crédito que vence pronto
  ausencia('al-benjamin', 'nin-S-1000', addDays(lastDate(6, hoy), -21), 'Niños', 'activo', 3)

  return {
    v: 1,
    creado: toISO(now),
    clases: CLASES.map((x) => ({ ...x })),
    alumnos,
    sesiones,
    creditos,
    reservas,
    ajustes: { offsetMin: 0 },
  }
}
