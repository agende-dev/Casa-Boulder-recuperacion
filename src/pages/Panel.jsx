import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { NIVELES } from '../lib/seed'
import { addDays, DIAS, DIAS_CORTO, endHora, fmtDM, mondayOf, parseISO, startOf, toISO } from '../lib/dates'
import { ocupacion } from '../lib/logic'
import { Icono, NivelChip, Presas, Titulo } from '../components/ui'

function TarjetaClase({ clase, fecha }) {
  const { state, now, rol, miAlumno } = useApp()
  const oc = ocupacion(state, clase, fecha)
  const inicio = startOf(fecha, clase.hora)
  const terminada = startOf(fecha, endHora(clase.hora, clase.duracion)) <= now
  const empezada = inicio <= now
  const llena = oc.libres === 0
  const estado = terminada ? 'Finalizada' : empezada ? 'En curso' : llena ? 'Completa' : `${oc.libres} ${oc.libres === 1 ? 'lugar libre' : 'lugares libres'}`
  const tono = terminada || empezada ? 'text-graphite/70' : llena ? 'text-graphite' : oc.libres <= 2 ? 'text-hold-dark' : 'text-[#2c6a1f]'

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
        <span className="font-display text-lg font-semibold leading-none text-ink" aria-label={`${oc.ocupados} de ${clase.cupo} ocupados`}>
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
      <p className={`mt-2 text-xs font-semibold ${tono}`}>{estado}</p>
    </a>
  )
}

export default function Panel() {
  const { state, now } = useApp()
  const hoy = toISO(now)
  const [semana, setSemana] = useState(() => mondayOf(hoy))
  const [nivel, setNivel] = useState('Todos')
  const [dia, setDia] = useState(hoy)

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
                  Sin clases {nivel !== 'Todos' ? `de ${nivel} ` : ''}este día
                </p>
              )}
            </section>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-graphite/70">
        Cada círculo es un lugar: <span className="font-semibold">oscuro</span> = ocupado, <span className="font-semibold text-hold-dark">naranja</span> = libre. Lugares libres = 10 − fijos sin aviso − recuperaciones reservadas.
      </p>
    </div>
  )
}
