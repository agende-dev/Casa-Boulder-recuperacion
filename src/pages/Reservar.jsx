import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store'
import { nt } from '../lib/seed'
import { diffDias, endHora, fmtCorto, fmtDM, fmtLargo, toISO } from '../lib/dates'
import { estadoCredito, reservarRecuperacion, sesionesDisponibles } from '../lib/logic'
import { Badge, Boton, Card, Icono, NivelChip, Presas, Seccion, Titulo, Vacio } from '../components/ui'

export default function Reservar({ query }) {
  const { state, now, act, rol, miAlumno } = useApp()
  const esAlumno = rol === 'alumno'
  const hoy = toISO(now)

  const tieneVigentes = (a) => state.creditos.some((c) => c.alumno_id === a.id && estadoCredito(c, now) === 'activo')
  const pre = query.clase && query.fecha ? { claseId: query.clase, fecha: query.fecha } : null
  const claseNivel = pre ? state.clases.find((c) => c.id === pre.claseId)?.nivel : null

  const [alumnoSel, setAlumnoId] = useState(query.alumno || '')
  const alumnoId = esAlumno ? miAlumno.id : alumnoSel
  const [creditoId, setCreditoId] = useState(query.credito || '')
  const [sel, setSel] = useState(pre) // {claseId, fecha}
  const [hecho, setHecho] = useState(null)

  const alumno = state.alumnos.find((a) => a.id === alumnoId)
  const creditos = useMemo(
    () =>
      state.creditos
        .filter((c) => c.alumno_id === alumnoId && c.estado !== 'consumido')
        .map((c) => ({ ...c, est: estadoCredito(c, now) }))
        .sort((a, b) => (a.est === b.est ? a.fecha_vencimiento.localeCompare(b.fecha_vencimiento) : a.est === 'activo' ? -1 : 1)),
    [state.creditos, alumnoId, now]
  )
  const vigentes = creditos.filter((c) => c.est === 'activo')

  // crédito por defecto: el que vence antes
  useEffect(() => {
    if (!alumno) return setCreditoId('')
    if (!vigentes.some((c) => c.id === creditoId)) setCreditoId(vigentes[0]?.id || '')
  }, [alumnoId, vigentes.length]) // eslint-disable-line

  const credito = vigentes.find((c) => c.id === creditoId)
  const opciones = useMemo(() => (alumno && credito ? sesionesDisponibles(state, now, alumno, credito) : []), [state, now, alumno, credito])
  const elegida = sel && opciones.find((o) => o.clase.id === sel.claseId && o.fecha === sel.fecha)

  const porDia = opciones.reduce((m, o) => ((m[o.fecha] ||= []).push(o), m), {})

  const confirmar = () => {
    const r = act(reservarRecuperacion, { creditoId: credito.id, claseId: elegida.clase.id, fecha: elegida.fecha })
    if (!r.error) setHecho({ alumno, clase: elegida.clase, fecha: elegida.fecha, credito })
  }

  if (hecho) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="overflow-hidden text-center">
          <div className="h-1.5 bg-hold" />
          <div className="p-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-hold text-ink"><Icono n="check" className="h-7 w-7" /></span>
            <Titulo className="mt-3">¡Recuperación confirmada!</Titulo>
            <p className="mt-2 text-graphite">
              <strong className="text-ink">{hecho.alumno.nombre}</strong> tiene lugar en una clase de {nt(hecho.clase.nivel)} el <strong className="text-ink">{fmtLargo(hecho.fecha)}</strong> a las <strong className="text-ink">{hecho.clase.hora}</strong>.
            </p>
            <p className="mt-2 text-xs text-graphite/80">Se envió un aviso simulado por WhatsApp (no se conecta ningún servicio en esta demo). Puedes cancelar hasta 6 h antes para recuperar el crédito.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Boton as="a" href={`#/clase/${hecho.clase.id}/${hecho.fecha}`} variante="oscuro">Ver la clase</Boton>
              <Boton as="a" href={`#/creditos/${hecho.alumno.id}`} variante="suave">Ver sus créditos</Boton>
            </div>
            <button onClick={() => { setHecho(null); setSel(null) }} className="mt-4 min-h-11 text-sm font-semibold text-hold-dark underline">Reservar otra recuperación</button>
          </div>
        </Card>
      </div>
    )
  }

  const candidatos = state.alumnos.filter((a) => !claseNivel || a.nivel_actual === claseNivel)

  return (
    <div>
      <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-hold-dark">Recuperaciones</p>
      <Titulo>Reservar recuperación</Titulo>
      {pre && claseNivel && (
        <p className="mt-2 rounded-xl bg-white p-3 text-sm ring-1 ring-black/5">
          Eligiendo lugar en la clase de <strong>{nt(claseNivel)}</strong> del {fmtCorto(pre.fecha)}. {esAlumno ? (miAlumno.nivel_actual === claseNivel ? 'Elige tu crédito y confirma.' : `Tu nivel es ${miAlumno.nivel_actual.toLowerCase()}: solo puedes recuperar en clases de tu nivel.`) : <>Solo aparecen alumnos de ese nivel. <a href="#/reservar" className="font-semibold text-hold-dark underline">Ver todos</a></>}
        </p>
      )}

      {esAlumno && <p className="mt-2 text-sm text-graphite">Reservando como <strong className="text-ink">{miAlumno.nombre}</strong> · nivel {miAlumno.nivel_actual}.</p>}
      {!esAlumno && <Seccion titulo="1 · ¿Quién recupera?">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {candidatos.map((a) => {
            const ok = tieneVigentes(a)
            const on = a.id === alumnoId
            return (
              <button
                key={a.id}
                disabled={!ok}
                aria-pressed={on}
                onClick={() => { setAlumnoId(a.id); setSel(pre && a.nivel_actual === claseNivel ? pre : null) }}
                className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border-2 bg-white p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'border-hold' : 'border-transparent ring-1 ring-black/10'}`}
              >
                <span>
                  <span className="block font-semibold text-ink">{a.nombre}</span>
                  <span className="text-xs text-graphite/80">{ok ? (() => { const n = state.creditos.filter((c) => c.alumno_id === a.id && estadoCredito(c, now) === 'activo').length; return `${n} crédito${n > 1 ? 's' : ''} vigente${n > 1 ? 's' : ''}` })() : 'Sin créditos vigentes'}</span>
                </span>
                <NivelChip nivel={a.nivel_actual} />
              </button>
            )
          })}
        </div>
      </Seccion>}

      {esAlumno && vigentes.length === 0 && (
        <div className="mt-6"><Vacio titulo="No tienes créditos vigentes" texto="Se genera un crédito cuando avisas que no vas a poder asistir a tu clase con 6 horas o más de anticipación.">
          <Boton as="a" href="#/" variante="oscuro">Ver mis clases</Boton>
        </Vacio></div>
      )}

      {alumno && (
        <Seccion titulo="2 · Crédito a usar">
          <div className="grid gap-2 sm:grid-cols-2">
            {creditos.map((c) => {
              const vencido = c.est === 'vencido'
              const on = c.id === creditoId
              const d = diffDias(c.fecha_vencimiento, hoy)
              return (
                <button
                  key={c.id}
                  disabled={vencido}
                  role="radio"
                  aria-checked={on}
                  onClick={() => { setCreditoId(c.id); setSel(pre) }}
                  className={`min-h-16 rounded-xl border-2 bg-white p-3 text-left disabled:cursor-not-allowed disabled:opacity-55 ${on ? 'border-hold' : 'border-transparent ring-1 ring-black/10'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">Crédito de {c.nivel_origen}</span>
                    {vencido ? <Badge tono="rojo">Vencido</Badge> : <Badge tono={d <= 7 ? 'naranja' : 'verde'}>{d === 0 ? 'vence hoy' : `vence en ${d} días`}</Badge>}
                  </span>
                  <span className="text-xs text-graphite/80">Generado {fmtDM(c.fecha_generacion)} · vence el {fmtDM(c.fecha_vencimiento)}</span>
                </button>
              )
            })}
          </div>
        </Seccion>
      )}

      {alumno && credito && (
        <Seccion titulo={`3 · Elige la clase de ${nt(alumno.nivel_actual)}`} extra={<span className="text-xs text-graphite/80">Hasta el {fmtDM(credito.fecha_vencimiento)}</span>}>
          {opciones.length === 0 ? (
            <Vacio titulo="No hay clases con cupo" texto={`No quedan clases futuras de ${nt(alumno.nivel_actual)} con lugar libre antes del vencimiento del crédito (${fmtDM(credito.fecha_vencimiento)}).`} />
          ) : (
            <div className="space-y-4">
              {Object.entries(porDia).map(([fecha, lista]) => (
                <div key={fecha}>
                  <h3 className="mb-1.5 font-display text-base font-semibold uppercase text-graphite">{fmtLargo(fecha)}</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {lista.map((o) => {
                      const on = elegida && elegida.clase.id === o.clase.id && elegida.fecha === o.fecha
                      return (
                        <button
                          key={o.clase.id + o.fecha}
                          role="radio"
                          aria-checked={on}
                          onClick={() => setSel({ claseId: o.clase.id, fecha: o.fecha })}
                          className={`rounded-xl border-2 bg-white p-3 text-left ${on ? 'border-hold' : 'border-transparent ring-1 ring-black/10'}`}
                        >
                          <span className="flex items-center justify-between">
                            <span className="font-display text-2xl font-semibold text-ink">{o.clase.hora}</span>
                            <span className="text-xs font-semibold text-hold-dark">{o.libres} {o.libres === 1 ? 'libre' : 'libres'}</span>
                          </span>
                          <span className="text-xs text-graphite/80">a {endHora(o.clase.hora, o.clase.duracion)} · {o.clase.nivel}</span>
                          <span className="mt-2 block"><Presas ocupados={o.ocupados} cupo={o.clase.cupo} size="h-2 w-2" /></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Seccion>
      )}

      {!alumno && !esAlumno && <p className="mt-6 text-sm text-graphite/80">Elige un alumno con crédito vigente para ver las clases disponibles.</p>}

      <div className="h-28" aria-hidden="true" />
      {/* Barra de confirmación (por encima de la navegación móvil) */}
      <div className="pb-safe fixed inset-x-0 bottom-16 z-30 border-t border-cement-dark bg-white/95 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <p className="min-w-0 flex-1 truncate text-sm text-graphite">
            {elegida ? <><strong className="text-ink">{alumno.nombre.split(' ')[0]}</strong> · {fmtCorto(elegida.fecha)} {elegida.clase.hora}</> : 'Aún no elegiste clase'}
          </p>
          <Boton variante="primario" tam="lg" disabled={!elegida} onClick={confirmar} className="w-full shrink-0 sm:w-auto">
            Confirmar recuperación
          </Boton>
        </div>
      </div>
    </div>
  )
}
