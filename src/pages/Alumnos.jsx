import { useState } from 'react'
import { useApp } from '../store'
import { NIVELES, PLANES, nt } from '../lib/seed'
import { DIAS_CORTO, diffDias, fmtCLP, fmtDM, toISO } from '../lib/dates'
import { estadoCredito, pasarDeNivel } from '../lib/logic'
import { Badge, Boton, Card, Modal, NivelChip, Titulo, Vacio } from '../components/ui'

export function etiquetaClase(c) {
  return `${DIAS_CORTO[c.dia_semana - 1]} ${c.hora}`
}

function PaseNivel({ alumno, onCerrar }) {
  const { state, now, act } = useApp()
  const cant = PLANES[alumno.plan].clases
  const otros = NIVELES.filter((n) => n !== alumno.nivel_actual)
  const [nivel, setNivel] = useState(otros[0])
  const [sel, setSel] = useState([])
  const clases = state.clases.filter((c) => c.nivel === nivel).sort((a, b) => a.dia_semana - b.dia_semana || a.hora.localeCompare(b.hora))
  const pendientes = state.creditos.filter((c) => c.alumno_id === alumno.id && estadoCredito(c, now) === 'activo').length

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < cant ? [...s, id] : [...s.slice(1), id]))

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Registrar pase de nivel"
      pie={
        <>
          <Boton variante="suave" onClick={onCerrar}>Cancelar</Boton>
          <Boton
            variante="primario"
            disabled={sel.length !== cant}
            onClick={() => {
              const r = act(pasarDeNivel, { alumnoId: alumno.id, nivel, clasesFijas: sel }, `${alumno.nombre.split(' ')[0]} ahora está en ${nt(nivel)}.`)
              if (!r.error) onCerrar()
            }}
          >
            Confirmar pase a {nt(nivel)}
          </Boton>
        </>
      }
    >
      <p><strong className="text-ink">{alumno.nombre}</strong> está en <strong>{nt(alumno.nivel_actual)}</strong>. Elige el nivel nuevo y {cant === 1 ? 'su clase fija' : `sus ${cant} clases fijas`} (plan {alumno.plan}).</p>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-graphite" htmlFor="nivel-nuevo">Nivel nuevo</label>
      <select
        id="nivel-nuevo"
        value={nivel}
        onChange={(e) => {
          setNivel(e.target.value)
          setSel([])
        }}
        className="mt-1 min-h-12 w-full rounded-xl border border-cement-dark bg-white px-3 text-base"
      >
        {otros.map((n) => <option key={n}>{n}</option>)}
      </select>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-graphite">Clase{cant > 1 ? 's' : ''} fija{cant > 1 ? 's' : ''} ({sel.length}/{cant})</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {clases.map((c) => {
            const on = sel.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(c.id)}
                className={`min-h-12 rounded-xl border-2 px-3 text-left text-sm font-semibold ${on ? 'border-hold bg-[#fdeadd]' : 'border-cement-dark bg-white'}`}
              >
                {etiquetaClase(c)}
              </button>
            )
          })}
        </div>
      </fieldset>

      <p className="mt-4 rounded-xl bg-cement p-3">
        {pendientes > 0
          ? `Sus ${pendientes} crédito${pendientes > 1 ? 's' : ''} vigente${pendientes > 1 ? 's' : ''} podrán usarse en clases de ${nt(nivel)}, con la misma fecha de vencimiento.`
          : `No tiene créditos vigentes ahora; los que genere en adelante serán de ${nt(nivel)}.`}
      </p>
    </Modal>
  )
}

export default function Alumnos() {
  const { state, now, rol } = useApp()
  const [pase, setPase] = useState(null)
  const [nivel, setNivel] = useState('Todos')
  const hoy = toISO(now)
  const lista = state.alumnos.filter((a) => nivel === 'Todos' || a.nivel_actual === nivel)

  if (rol !== 'recepcion')
    return (
      <Vacio titulo="Solo recepción" texto="La lista de alumnos es una herramienta de recepción. Cambia a la vista Recepción para verla.">
        <Boton as="a" href="#/" variante="oscuro">Volver a mis clases</Boton>
      </Vacio>
    )

  return (
    <div>
      <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-hold-dark">Cursos fijos</p>
      <Titulo>Alumnos</Titulo>

      <div className="-mx-4 mt-4 overflow-x-auto px-4" role="group" aria-label="Filtrar por nivel">
        <div className="flex w-max gap-2 pb-1">
          {['Todos', ...NIVELES].map((n) => (
            <button key={n} onClick={() => setNivel(n)} aria-pressed={nivel === n} className={`min-h-10 rounded-full px-4 text-sm font-semibold ${nivel === n ? 'bg-hold text-ink' : 'bg-white text-graphite ring-1 ring-black/10'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {lista.map((a) => {
          const creds = state.creditos.filter((c) => c.alumno_id === a.id)
          const vigentes = creds.filter((c) => estadoCredito(c, now) === 'activo').sort((x, y) => x.fecha_vencimiento.localeCompare(y.fecha_vencimiento))
          const fijas = a.clases_fijas.map((id) => state.clases.find((c) => c.id === id)).filter(Boolean)
          const pase0 = a.pases?.[a.pases.length - 1]
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold uppercase leading-tight text-ink">{a.nombre}</h2>
                  <p className="mt-0.5 text-xs text-graphite/80">{a.telefono}</p>
                </div>
                <NivelChip nivel={a.nivel_actual} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-graphite/70">Plan</dt>
                  <dd className="font-semibold text-ink">{PLANES[a.plan].corto} · {fmtCLP(PLANES[a.plan].precio)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-graphite/70">Clases fijas</dt>
                  <dd className="font-semibold text-ink">{fijas.map(etiquetaClase).join(' · ')}</dd>
                </div>
              </dl>
              {pase0 && <p className="mt-2 text-xs text-graphite/80">Pasó de {pase0.de} a {pase0.a} el {fmtDM(pase0.fecha)}.</p>}

              <div className="mt-3 rounded-xl bg-cement/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-graphite/70">
                  Créditos vigentes: <span className="text-base text-ink">{vigentes.length}</span>
                </p>
                {vigentes.length === 0 ? (
                  <p className="mt-1 text-sm text-graphite/80">Sin créditos por usar.</p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {vigentes.map((c) => {
                      const d = diffDias(c.fecha_vencimiento, hoy)
                      return (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-1 text-sm">
                          <span>Vence el <strong>{fmtDM(c.fecha_vencimiento)}</strong> <span className="text-graphite/70">({c.nivel_origen})</span></span>
                          <Badge tono={d <= 7 ? 'naranja' : 'gris'}>{d === 0 ? 'vence hoy' : `en ${d} días`}</Badge>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {vigentes.length === 0 ? (
                  <Boton variante="primario" tam="sm" disabled>Recuperar</Boton>
                ) : (
                  <Boton as="a" href={`#/reservar?alumno=${a.id}`} variante="primario" tam="sm">Recuperar</Boton>
                )}
                <Boton as="a" href={`#/creditos/${a.id}`} variante="suave" tam="sm">Ver créditos</Boton>
                <Boton variante="oscuro" tam="sm" onClick={() => setPase(a)}>Registrar pase de nivel</Boton>
              </div>
            </Card>
          )
        })}
      </div>
      {lista.length === 0 && <p className="mt-6 text-sm text-graphite">Ningún alumno de {nt(nivel)}.</p>}

      {pase && <PaseNivel alumno={pase} onCerrar={() => setPase(null)} />}
    </div>
  )
}
