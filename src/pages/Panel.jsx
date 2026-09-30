import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { NIVELES, nt } from '../lib/seed'
import { addDays, DIAS, DIAS_CORTO, endHora, fmtCorto, fmtDM, fmtDuracion, fmtLargo, mondayOf, parseISO, startOf, toISO } from '../lib/dates'
import { avisarAusencia, getSesion, HORAS_MIN, ocupacion } from '../lib/logic'
import { Badge, Boton, Icono, Modal, NivelChip, Presas, Titulo } from '../components/ui'

const GUIA_KEY = 'casaboulder.guia.v1'
const leerGuia = () => {
  try { return window.localStorage.getItem(GUIA_KEY) === 'oculta' } catch { return false }
}
const guardarGuia = (v) => {
  try { v ? window.localStorage.setItem(GUIA_KEY, 'oculta') : window.localStorage.removeItem(GUIA_KEY) } catch { /* sin almacenamiento */ }
}

/** Primera clase futura con alumnos fijos y más de 6 h de anticipación: sirve para probar el aviso de ausencia. */
function claseDePrueba(state, now, rol, miAlumno) {
  for (let i = 0; i < 14; i++) {
    const fecha = addDays(toISO(now), i)
    for (const c of state.clases) {
      if (c.dia_semana !== (parseISO(fecha).getDay() || 7)) continue
      const tiene = rol === 'alumno' ? miAlumno.clases_fijas.includes(c.id) : state.alumnos.some((a) => a.clases_fijas.includes(c.id))
      if (tiene && (startOf(fecha, c.hora) - now) / 36e5 >= 6) return { c, fecha }
    }
  }
  return null
}

function GuiaDemo({ onCerrar }) {
  const { state, now, rol, miAlumno } = useApp()
  const p = claseDePrueba(state, now, rol, miAlumno)
  const alumno = rol === 'alumno'
  const pasos = alumno
    ? [
        ['Abre tu clase', 'Toca una tarjeta marcada "Tu clase".'],
        ['Avisa que no vas', 'Con 6 h o más de anticipación recibes un crédito y tu lugar queda libre.'],
        ['Recupera', 'En "Recuperar" elige otra clase de tu nivel con lugar y confirma.'],
      ]
    : [
        ['Abre una clase', 'Toca cualquier tarjeta para ver fijos, recuperaciones y lugares libres.'],
        ['Avisa una ausencia', 'Con 6 h o más genera un crédito; con menos, no. Usa el reloj de prueba en "Sobre Nosotros" para comparar.'],
        ['Reserva la recuperación', 'En "Recuperar" elige alumno, crédito y una clase de su nivel con cupo.'],
      ]
  return (
    <section className="mt-5 rounded-2xl bg-graphite p-4 text-white sm:p-5" aria-label="Guía de la demo">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-hold">Demo · 1 minuto</p>
          <h2 className="font-display text-2xl font-semibold uppercase leading-tight">{alumno ? `Hola, ${miAlumno.nombre.split(' ')[0]}. Prueba una recuperación` : 'Prueba el flujo completo'}</h2>
        </div>
        <button onClick={onCerrar} aria-label="Cerrar guía" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
          <Icono n="x" />
        </button>
      </div>
      <ol className="mt-3 grid gap-3 md:grid-cols-3">
        {pasos.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hold font-display text-base font-semibold text-ink">{i + 1}</span>
            <span className="text-sm leading-snug"><strong className="block text-white">{t}</strong><span className="text-white/80">{d}</span></span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {p && (
          <a href={`#/clase/${p.c.id}/${p.fecha}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-hold px-4 text-sm font-semibold text-ink hover:bg-[#f27a38]">
            Probar con la clase del {fmtCorto(p.fecha)} {p.c.hora} <Icono n="flecha" className="h-4 w-4" />
          </a>
        )}
        <button onClick={onCerrar} className="min-h-11 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10">Entendido</button>
      </div>
    </section>
  )
}

/** Próxima clase del alumno: fijas (salvo las que avisó que no irá) y recuperaciones reservadas. */
function proximaClase(state, now, alumno) {
  const hoy = toISO(now)
  let mejor = null
  for (let i = 0; i < 42 && !mejor; i++) {
    const fecha = addDays(hoy, i)
    const dow = parseISO(fecha).getDay() || 7
    for (const c of state.clases) {
      if (c.dia_semana !== dow || startOf(fecha, c.hora) <= now) continue
      const asis = getSesion(state, c.id, fecha).asistencias.find((a) => a.alumno_id === alumno.id)
      const fija = alumno.clases_fijas.includes(c.id) && !asis?.estado?.startsWith('ausente')
      const reserva = state.reservas.find((r) => r.alumno_id === alumno.id && r.estado === 'reservada' && r.clase_id === c.id && r.fecha === fecha)
      if (!fija && !reserva) continue
      const cand = { clase: c, fecha, tipo: reserva ? 'recuperacion' : 'fija', inicio: startOf(fecha, c.hora) }
      if (!mejor || cand.inicio < mejor.inicio) mejor = cand
    }
  }
  return mejor
}

function ProximaClase() {
  const { state, now, act, miAlumno } = useApp()
  const [confirmar, setConfirmar] = useState(false)
  const p = proximaClase(state, now, miAlumno)
  const tieneCredito = state.creditos.some((c) => c.alumno_id === miAlumno.id && c.estado === 'activo')

  if (!p) {
    return (
      <section className="mt-5 flex flex-col gap-3 rounded-2xl border-l-8 border-hold bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-graphite/70">Tu próxima clase</p>
          <p className="font-display text-xl font-semibold uppercase text-ink">No tienes clases próximas</p>
        </div>
        {tieneCredito && <Boton as="a" href="#/reservar" variante="primario" tam="sm">Usar un crédito</Boton>}
      </section>
    )
  }

  const { clase, fecha, tipo } = p
  const horas = (p.inicio - now) / 36e5
  const oc = ocupacion(state, clase, fecha)
  const puedeAvisar = tipo === 'fija' && horas >= HORAS_MIN

  return (
    <section className="mt-5 rounded-2xl border-l-8 border-hold bg-white p-4 shadow-sm ring-1 ring-black/5" aria-label="Tu próxima clase">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-graphite/70">Tu próxima clase</p>
          <p className="font-display text-2xl font-semibold uppercase leading-tight text-ink">
            {fmtCorto(fecha)} · {clase.hora}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <NivelChip nivel={clase.nivel} />
            {tipo === 'recuperacion' && <Badge tono="naranja">Recuperación</Badge>}
            <Badge tono="verde">Empieza en {fmtDuracion(horas)}</Badge>
            <span className="text-xs text-graphite/80">{oc.libres === 0 ? 'Clase completa' : `${oc.libres} ${oc.libres === 1 ? 'lugar libre' : 'lugares libres'}`}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <Boton as="a" href={`#/clase/${clase.id}/${fecha}`} variante="suave" tam="sm" className="flex-1 sm:flex-none">Ver clase</Boton>
            {puedeAvisar && <Boton variante="primario" tam="sm" className="flex-1 sm:flex-none" onClick={() => setConfirmar(true)}>Avisar ausencia</Boton>}
          </div>
          {tipo === 'fija' && !puedeAvisar && <p className="text-xs text-graphite/80 sm:text-right">Faltan menos de {HORAS_MIN} h: un aviso ya no genera crédito.</p>}
          {tipo === 'recuperacion' && horas < HORAS_MIN && <p className="text-xs text-graphite/80 sm:text-right">Faltan menos de {HORAS_MIN} h: si cancelas, el crédito no se devuelve.</p>}
        </div>
      </div>

      <Modal
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        titulo="Avisar ausencia"
        pie={
          <>
            <Boton variante="suave" onClick={() => setConfirmar(false)}>Volver</Boton>
            <Boton
              variante="primario"
              onClick={() => {
                act(avisarAusencia, { claseId: clase.id, fecha, alumnoId: miAlumno.id }, (r) => (r.conCredito ? 'Listo: recibiste un crédito y tu lugar quedó libre.' : 'Aviso registrado sin crédito (menos de 6 h).'))
                setConfirmar(false)
              }}
            >
              Confirmar aviso
            </Boton>
          </>
        }
      >
        <p>No asistirás a la clase de {nt(clase.nivel)} del <strong className="text-ink">{fmtLargo(fecha)}</strong> a las {clase.hora}.</p>
        <p className="mt-3 rounded-xl bg-[#d5ead0] p-3 text-[#1f4a17]">
          Faltan <strong>{fmtDuracion(horas)}</strong>: recibes <strong>1 crédito</strong> válido por 30 días (hasta el {fmtCorto(addDays(fecha, 30))}) para recuperar en otra clase de tu nivel.
        </p>
      </Modal>
    </section>
  )
}

function TarjetaClase({ clase, fecha }) {
  const { state, now, rol, miAlumno } = useApp()
  const oc = ocupacion(state, clase, fecha)
  const inicio = startOf(fecha, clase.hora)
  const terminada = startOf(fecha, endHora(clase.hora, clase.duracion)) <= now
  const empezada = inicio <= now
  const llena = oc.libres === 0
  const estado = terminada ? 'Finalizada' : empezada ? 'En curso' : llena ? 'Completa' : oc.libres <= 3 ? (oc.libres === 1 ? '¡Último lugar!' : `¡Últimos ${oc.libres} lugares!`) : null
  const tono = terminada || empezada ? 'text-graphite/70' : llena ? 'text-graphite' : 'text-hold-dark'

  return (
    <a
      href={`#/clase/${clase.id}/${fecha}`}
      className={`block rounded-xl border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md ${terminada ? 'border-transparent opacity-70' : 'border-cement-dark'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-semibold leading-none text-ink">{clase.hora}</p>
          <p className="mt-0.5 text-xs text-graphite/70">a {endHora(clase.hora, clase.duracion)}</p>
        </div>
        <span className="font-display text-lg font-semibold leading-none text-ink" aria-label={`${oc.ocupados} de ${clase.cupo} ocupados, ${oc.libres} libres`}>
          {oc.ocupados}/{clase.cupo}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <NivelChip nivel={clase.nivel} />
        {rol === 'alumno' && miAlumno.clases_fijas.includes(clase.id) && <span className="rounded-md bg-hold px-1.5 py-0.5 text-[11px] font-bold text-ink">Tu clase</span>}
      </div>
      <div className="mt-2.5">
        <Presas ocupados={oc.ocupados} cupo={clase.cupo} size="h-1.5 w-1.5 lg:h-2 lg:w-2" />
      </div>
      {estado && <p className={`mt-2 text-xs font-semibold ${tono}`}>{estado}</p>}
    </a>
  )
}

export default function Panel() {
  const { state, now, rol } = useApp()
  const hoy = toISO(now)
  const [semana, setSemana] = useState(() => mondayOf(hoy))
  const [nivel, setNivel] = useState('Todos')
  const [dia, setDia] = useState(hoy)
  const [guiaOculta, setGuiaOculta] = useState(leerGuia)
  const cerrarGuia = () => { guardarGuia(true); setGuiaOculta(true) }

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(semana, i)), [semana])
  const diaActivo = dias.includes(dia) ? dia : dias[0]

  const cambiarSemana = (n) => {
    const s = addDays(semana, n * 7)
    setSemana(s)
    setDia(s === mondayOf(hoy) ? hoy : s)
  }
  const irHoy = () => {
    setSemana(mondayOf(hoy))
    setDia(hoy)
  }

  const clasesDe = (fecha) =>
    state.clases
      .filter((c) => c.dia_semana === (parseISO(fecha).getDay() || 7) && (nivel === 'Todos' || c.nivel === nivel))
      .sort((a, b) => a.hora.localeCompare(b.hora))

  const rango = `${fmtDM(dias[0])} – ${fmtDM(dias[6])}`

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-hold-dark">Panel semanal</p>
          <Titulo>Clases de la semana</Titulo>
        </div>
        <div className="mt-3 flex items-center gap-2 sm:mt-0">
          <button onClick={() => cambiarSemana(-1)} aria-label="Semana anterior" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-black/10 hover:bg-cement-dark/40">
            <Icono n="chevL" />
          </button>
          <div className="min-w-32 flex-1 text-center text-sm font-semibold text-ink sm:flex-none">{rango}</div>
          <button onClick={() => cambiarSemana(1)} aria-label="Semana siguiente" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-black/10 hover:bg-cement-dark/40">
            <Icono n="chevR" />
          </button>
          <button onClick={irHoy} className="min-h-11 rounded-xl bg-graphite px-4 text-sm font-semibold text-white hover:bg-ink">
            Hoy
          </button>
        </div>
      </div>

      {!guiaOculta && <GuiaDemo onCerrar={cerrarGuia} />}
      {rol === 'alumno' && <ProximaClase />}

      <div className="-mx-4 mt-5 overflow-x-auto px-4" role="group" aria-label="Filtrar por nivel">
        <div className="flex w-max gap-2 pb-1">
          {['Todos', ...NIVELES].map((n) => (
            <button
              key={n}
              onClick={() => setNivel(n)}
              aria-pressed={nivel === n}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${nivel === n ? 'bg-hold text-ink' : 'bg-white text-graphite ring-1 ring-black/10 hover:bg-cement-dark/40'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de día (móvil) */}
      <div className="mt-4 grid grid-cols-7 gap-1 md:hidden" role="tablist" aria-label="Día de la semana">
        {dias.map((d, i) => {
          const on = d === diaActivo
          const n = clasesDe(d).length
          return (
            <button
              key={d}
              role="tab"
              aria-selected={on}
              onClick={() => setDia(d)}
              className={`flex min-h-16 flex-col items-center justify-center rounded-xl text-xs font-semibold ${on ? 'bg-graphite text-white' : 'bg-white text-graphite ring-1 ring-black/10'}`}
            >
              <span className="uppercase">{DIAS_CORTO[i]}</span>
              <span className={`font-display text-xl leading-none ${d === hoy && !on ? 'text-hold-dark' : ''}`}>{parseISO(d).getDate()}</span>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${n ? 'bg-hold' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      <div className="mt-4 md:grid md:grid-cols-7 md:gap-2">
        {dias.map((d, i) => {
          const lista = clasesDe(d)
          return (
            <section key={d} className={`${d === diaActivo ? 'block' : 'hidden'} md:block`} aria-label={`${DIAS[i]} ${parseISO(d).getDate()}`}>
              <h2 className={`mb-2 hidden rounded-lg px-2 py-1.5 text-center md:block ${d === hoy ? 'bg-hold text-ink' : 'bg-graphite text-white'}`}>
                <span className="font-display text-sm font-medium uppercase tracking-wider">{DIAS_CORTO[i]}</span>{' '}
                <span className="font-display text-lg font-semibold">{parseISO(d).getDate()}</span>
              </h2>
              <h2 className="mb-2 font-display text-lg font-semibold uppercase text-graphite md:hidden">
                {DIAS[i]} {parseISO(d).getDate()} {d === hoy && <span className="ml-1 rounded bg-hold px-1.5 py-0.5 text-xs text-ink">Hoy</span>}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 md:block md:space-y-2">
                {lista.map((c) => (
                  <TarjetaClase key={c.id} clase={c} fecha={d} />
                ))}
              </div>
              {lista.length === 0 && (
                <p className="rounded-xl border-2 border-dashed border-cement-dark px-3 py-6 text-center text-sm text-graphite/70 md:py-4 md:text-xs">
                  Sin clases {nivel !== 'Todos' ? `de ${nt(nivel)} ` : ''}este día
                </p>
              )}
            </section>
          )
        })}
      </div>

      {guiaOculta && (
        <button onClick={() => { guardarGuia(false); setGuiaOculta(false); window.scrollTo(0, 0) }} className="mt-6 min-h-11 text-sm font-semibold text-hold-dark underline">
          Ver la guía de la demo
        </button>
      )}
      <p className="mt-2 text-xs text-graphite/70">
        Cada círculo es un lugar: <span className="font-semibold">oscuro</span> = ocupado, <span className="font-semibold text-hold-dark">naranja</span> = libre. Avisamos cuando quedan 3 o menos. Lugares libres = 10 − fijos sin aviso − recuperaciones reservadas.
      </p>
    </div>
  )
}
