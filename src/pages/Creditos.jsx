import { useState } from 'react'
import { useApp } from '../store'
import { diffDias, fmtCorto, fmtDM, toISO } from '../lib/dates'
import { cancelarReserva, estadoCredito, HORAS_MIN, horasHasta } from '../lib/logic'
import { Badge, Boton, Card, Modal, NivelChip, Seccion, Titulo, Vacio } from '../components/ui'

function FilaCredito({ c, est, onCancelar }) {
  const { state, now } = useApp()
  const hoy = toISO(now)
  const clase = state.clases.find((x) => x.id === c.clase_origen_id)
  const reserva = c.reserva_id && state.reservas.find((r) => r.id === c.reserva_id)
  const claseUso = reserva && state.clases.find((x) => x.id === reserva.clase_id)
  const d = diffDias(c.fecha_vencimiento, hoy)

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">Crédito de <NivelChip nivel={c.nivel_origen} /></p>
          <p className="mt-1 text-sm text-graphite">
            Origen: ausencia avisada a la clase {clase?.hora} del {fmtCorto(c.fecha_clase)}
          </p>
        </div>
        {est === 'activo' && <Badge tono={d <= 7 ? 'naranja' : 'verde'}>{d === 0 ? 'Vence hoy' : `Vence en ${d} días`}</Badge>}
        {est === 'vencido' && <Badge tono="rojo">Vencido</Badge>}
        {est === 'consumido' && <Badge tono="oscuro">Consumido</Badge>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-graphite/70">Generado</dt><dd className="font-semibold text-ink">{fmtDM(c.fecha_generacion)}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-graphite/70">{est === 'vencido' ? 'Venció' : 'Vencimiento'}</dt><dd className="font-semibold text-ink">{fmtDM(c.fecha_vencimiento)}</dd></div>
      </dl>
      {est === 'consumido' && reserva && (
        <div className="mt-3 rounded-xl bg-cement/70 p-3 text-sm">
          Usado en <strong>{claseUso?.nivel}</strong>, {fmtCorto(reserva.fecha)} a las {claseUso?.hora}.
          <div className="mt-2 flex flex-wrap gap-2">
            <Boton as="a" href={`#/clase/${reserva.clase_id}/${reserva.fecha}`} variante="suave" tam="sm">Ver clase</Boton>
            {horasHasta(reserva.fecha, claseUso.hora, now) > 0 && (
              <Boton variante="peligro" tam="sm" onClick={() => onCancelar(reserva)}>Cancelar recuperación</Boton>
            )}
          </div>
        </div>
      )}
      {est === 'consumido' && !reserva && <p className="mt-3 rounded-xl bg-cement/70 p-3 text-sm">Consumido en una recuperación ya realizada o cancelada con menos de {HORAS_MIN} h de anticipación.</p>}
      {est === 'activo' && (
        <Boton as="a" href={`#/reservar?alumno=${c.alumno_id}&credito=${c.id}`} variante="primario" tam="sm" className="mt-3 w-full sm:w-auto">Usar en una recuperación</Boton>
      )}
      {est === 'vencido' && <p className="mt-3 text-xs text-graphite/80">Este crédito ya no se puede seleccionar.</p>}
    </Card>
  )
}

export default function Creditos({ alumnoId }) {
  const { state, now, act, rol, miAlumno } = useApp()
  const [cancelando, setCancelando] = useState(null)
  const alumno = rol === 'alumno' ? miAlumno : state.alumnos.find((a) => a.id === alumnoId) || state.alumnos[0]
  const todos = state.creditos
    .filter((c) => c.alumno_id === alumno.id)
    .map((c) => ({ c, est: estadoCredito(c, now) }))
    .sort((a, b) => a.c.fecha_vencimiento.localeCompare(b.c.fecha_vencimiento))
  const grupo = (e) => todos.filter((x) => x.est === e)
  const activos = grupo('activo')
  const vencidos = grupo('vencido')
  const consumidos = grupo('consumido')

  const cancelar = cancelando && state.clases.find((x) => x.id === cancelando.clase_id)
  const h = cancelando ? horasHasta(cancelando.fecha, cancelar.hora, now) : 0

  return (
    <div>
      <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-hold-dark">Mis créditos</p>
      <Titulo>{alumno.nombre}</Titulo>

      {rol === 'recepcion' && <><label htmlFor="sel-alumno" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-graphite">Alumno</label>
      <select
        id="sel-alumno"
        value={alumno.id}
        onChange={(e) => (window.location.hash = `/creditos/${e.target.value}`)}
        className="mt-1 min-h-12 w-full max-w-md rounded-xl border border-cement-dark bg-white px-3 text-base"
      >
        {state.alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre} · {a.nivel_actual}</option>)}
      </select></>}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[['Activos', activos.length, 'bg-hold text-ink'], ['Vencidos', vencidos.length, 'bg-white text-ink'], ['Consumidos', consumidos.length, 'bg-graphite text-white']].map(([t, n, cl]) => (
          <div key={t} className={`rounded-2xl px-2 py-3 ${cl}`}>
            <p className="font-display text-3xl font-semibold leading-none">{n}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{t}</p>
          </div>
        ))}
      </div>

      {[['Activos', activos, 'No tiene créditos activos.', 'Un crédito se genera al avisar una ausencia con 6 h o más de anticipación.'], ['Vencidos', vencidos, 'Sin créditos vencidos.'], ['Consumidos', consumidos, 'Sin créditos consumidos.']].map(([t, lista, vacio, ayuda]) => (
        <Seccion key={t} titulo={t}>
          {lista.length === 0 ? (
            <Vacio titulo={vacio} texto={ayuda} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {lista.map(({ c, est }) => <FilaCredito key={c.id} c={c} est={est} onCancelar={setCancelando} />)}
            </div>
          )}
        </Seccion>
      ))}

      <Modal
        abierto={!!cancelando}
        onCerrar={() => setCancelando(null)}
        titulo="Cancelar recuperación"
        pie={
          <>
            <Boton variante="suave" onClick={() => setCancelando(null)}>Mantener reserva</Boton>
            <Boton variante="peligro" onClick={() => { act(cancelarReserva, { reservaId: cancelando.id }, (r) => (r.devuelve ? 'Recuperación cancelada. El crédito volvió a estar activo.' : 'Recuperación cancelada. El crédito no se devuelve (menos de 6 h).')); setCancelando(null) }}>
              Sí, cancelar
            </Boton>
          </>
        }
      >
        {cancelando && (
          h >= HORAS_MIN
            ? <p>Faltan más de {HORAS_MIN} h para la clase: el crédito <strong>vuelve a estar activo</strong> con su vencimiento original.</p>
            : <p>Faltan menos de {HORAS_MIN} h para la clase: el crédito <strong>no se devuelve</strong>.</p>
        )}
      </Modal>
    </div>
  )
}
