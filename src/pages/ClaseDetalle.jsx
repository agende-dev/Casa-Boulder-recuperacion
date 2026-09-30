import { useState } from 'react'
import { useApp } from '../store'
import { addDays, isoWeekday, endHora, fmtCorto, fmtDM, fmtDuracion, fmtLargo, startOf } from '../lib/dates'
import { avisarAusencia, cancelarReserva, deshacerAsistencia, guardarNota, HORAS_MIN, horasHasta, marcarAusenteSinAviso, marcarPresente, ocupacion } from '../lib/logic'
import { Badge, Boton, Card, Icono, Modal, NivelChip, Presas, Seccion, Titulo, Vacio } from '../components/ui'

function EstadoBadge({ asistencia }) {
  if (!asistencia) return <Badge>Sin marcar</Badge>
  if (asistencia.estado === 'presente') return <Badge tono="verde">Presente</Badge>
  if (asistencia.estado === 'ausente_avisada') return <Badge tono="naranja">Avisó · lugar liberado</Badge>
  return <Badge tono="rojo">{asistencia.aviso_tardio ? 'Aviso tardío · sin crédito' : 'Ausente sin aviso'}</Badge>
}

function Nota({ asistencia, onGuardar }) {
  const [abierta, setAbierta] = useState(false)
  const [txt, setTxt] = useState(asistencia.nota_progreso || '')
  if (!abierta)
    return (
      <button onClick={() => setAbierta(true)} className="mt-2 min-h-9 text-left text-xs font-semibold text-hold-dark underline">
        {asistencia.nota_progreso ? `Nota: ${asistencia.nota_progreso}` : '+ Agregar nota de progreso'}
      </button>
    )
  return (
    <div className="mt-2 flex gap-2">
      <input
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        placeholder="Ej: ya resuelve el techo suave"
        aria-label="Nota de progreso"
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-cement-dark px-3 text-sm"
      />
      <Boton
        variante="oscuro"
        tam="sm"
        onClick={() => {
          onGuardar(txt.trim())
          setAbierta(false)
        }}
      >
        Guardar
      </Boton>
    </div>
  )
}

export default function ClaseDetalle({ claseId, fecha }) {
  const { state, now, act, rol, miAlumno } = useApp()
  const esRecep = rol === 'recepcion'
  const [modal, setModal] = useState(null) // {tipo, alumno, reserva?}
  const clase = state.clases.find((c) => c.id === claseId)

  if (!clase || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || isoWeekday(fecha) !== clase.dia_semana) {
    return (
      <Vacio titulo="Clase no encontrada" texto="El enlace no corresponde a una clase del catálogo.">
        <Boton as="a" href="#/" variante="oscuro">Volver al panel</Boton>
      </Vacio>
    )
  }

  const oc = ocupacion(state, clase, fecha)
  const horas = horasHasta(fecha, clase.hora, now)
  const empezada = horas <= 0
  const terminada = startOf(fecha, endHora(clase.hora, clase.duracion)) <= now
  const args = (alumnoId) => ({ claseId, fecha, alumnoId })
  const cerrar = () => setModal(null)

  const puedeReservar = !empezada && oc.libres > 0
  // En la vista Alumno: ¿ya tiene lugar en esta clase?
  const miFija = !esRecep && oc.fijos.find((f) => f.alumno.id === miAlumno.id)
  const miRecup = !esRecep && oc.recups.find((r) => r.alumno.id === miAlumno.id)
  const yaTieneLugar = (miFija && miFija.asistencia?.estado !== 'ausente_avisada') || !!miRecup

  return (
    <div>
      <a href="#/" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-graphite hover:text-ink">
        <Icono n="chevL" className="h-4 w-4" /> Panel semanal
      </a>

      <Card className="mt-1 overflow-hidden">
        <div className="h-1.5 bg-hold" />
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <NivelChip nivel={clase.nivel} />
            {terminada ? <Badge>Finalizada</Badge> : empezada ? <Badge tono="oscuro">En curso</Badge> : <Badge tono="verde">Empieza en {fmtDuracion(horas)}</Badge>}
          </div>
          <Titulo className="mt-2">{fmtLargo(fecha)}</Titulo>
          <p className="mt-1 text-graphite">
            {clase.hora} a {endHora(clase.hora, clase.duracion)} · {clase.duracion} min · Casa Boulder
          </p>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold leading-none text-ink" aria-label="Lugares libres">{oc.libres}</span>
                <span className="text-sm font-semibold text-graphite">{oc.libres === 1 ? 'lugar libre' : 'lugares libres'} · {oc.ocupados}/{clase.cupo} ocupados</span>
              </div>
              <div className="mt-3"><Presas ocupados={oc.ocupados} cupo={clase.cupo} size="h-3.5 w-3.5" /></div>
            </div>
            <div className="sm:w-64">
              {yaTieneLugar ? (
                <div className="rounded-xl bg-[#d5ead0] p-3 text-sm font-semibold text-[#1f4a17]">
                  <Icono n="check" className="mr-1 inline h-4 w-4" />
                  {miRecup ? 'Tienes una recuperación reservada en esta clase.' : 'Esta es tu clase fija: ya tienes tu lugar.'}
                </div>
              ) : puedeReservar ? (
                <Boton as="a" href={`#/reservar?clase=${clase.id}&fecha=${fecha}`} variante="primario" tam="lg" className="w-full">
                  Reservar recuperación
                </Boton>
              ) : (
                <Boton variante="primario" tam="lg" className="w-full" disabled>
                  Reservar recuperación
                </Boton>
              )}
              {!puedeReservar && (
                <p className="mt-1.5 text-xs text-graphite/80">{empezada ? 'La clase ya comenzó.' : 'Clase completa: no se aceptan más recuperaciones.'}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Seccion titulo={`Alumnos fijos (${oc.fijos.length + oc.externos})`}>
        <Card className="divide-y divide-cement">
          {esRecep && oc.fijos.length === 0 && <p className="p-4 text-sm text-graphite/80">Ningún alumno con ficha tiene esta clase como fija.</p>}
          {oc.fijos.filter((f) => esRecep || f.alumno.id === miAlumno.id).map(({ alumno, asistencia }) => (
            <div key={alumno.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <a href={`#/creditos/${alumno.id}`} className="font-semibold text-ink hover:underline">{alumno.nombre}</a>
                  <span className="ml-2 text-xs text-graphite/70">Plan {alumno.plan}</span>
                </div>
                <EstadoBadge asistencia={asistencia} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!asistencia ? (
                  <>
                    {esRecep && (
                      <Boton variante="oscuro" tam="sm" onClick={() => act(marcarPresente, args(alumno.id), `${alumno.nombre.split(' ')[0]} marcada/o como presente.`)}>
                        <Icono n="check" className="h-4 w-4" /> Marcar presente
                      </Boton>
                    )}
                    {empezada ? (
                      esRecep && (
                        <Boton variante="peligro" tam="sm" onClick={() => act(marcarAusenteSinAviso, args(alumno.id), 'Ausencia sin aviso registrada.')}>
                          Ausente sin aviso
                        </Boton>
                      )
                    ) : (
                      <Boton variante={esRecep ? 'suave' : 'primario'} tam="sm" onClick={() => setModal({ tipo: 'ausencia', alumno })}>
                        Avisar ausencia
                      </Boton>
                    )}
                  </>
                ) : esRecep ? (
                  <Boton variante="fantasma" tam="sm" onClick={() => act(deshacerAsistencia, args(alumno.id), 'Registro deshecho.')}>
                    Deshacer
                  </Boton>
                ) : null}
              </div>
              {esRecep && asistencia?.estado === 'presente' && <Nota asistencia={asistencia} onGuardar={(nota) => act(guardarNota, { ...args(alumno.id), nota }, 'Nota guardada.')} />}
            </div>
          ))}
          {oc.externos > 0 && (
            <div className="flex items-center justify-between gap-3 bg-cement/50 p-4 text-sm text-graphite">
              <span>{esRecep ? `+ ${oc.externos} alumnos fijos más (sin ficha en esta demo)` : `Tus compañeros de curso (${oc.fijos.filter((f) => f.alumno.id !== miAlumno.id).length + oc.externos})`}</span>
              <Badge>Ocupan lugar</Badge>
            </div>
          )}
        </Card>
      </Seccion>

      <Seccion titulo={`Recuperaciones reservadas (${oc.recups.length})`}>
        {oc.recups.length === 0 ? (
          <Vacio titulo="Sin recuperaciones" texto="Nadie ha reservado un lugar de recuperación para esta clase todavía." />
        ) : (
          <Card className="divide-y divide-cement">
            {!esRecep && oc.recups.some((r) => r.alumno.id !== miAlumno.id) && (
              <p className="bg-cement/50 p-4 text-sm text-graphite">{oc.recups.filter((r) => r.alumno.id !== miAlumno.id).length} recuperación(es) de otros alumnos.</p>
            )}
            {oc.recups.filter((r) => esRecep || r.alumno.id === miAlumno.id).map(({ reserva, alumno, credito, asistencia }) => (
              <div key={reserva.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{alumno.nombre}</p>
                    <p className="text-xs text-graphite/80">
                      Recuperación · viene de {credito?.nivel_origen} · crédito vence el {fmtDM(credito?.fecha_vencimiento || fecha)}
                    </p>
                  </div>
                  <EstadoBadge asistencia={asistencia} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {esRecep && !asistencia && (
                    <Boton variante="oscuro" tam="sm" onClick={() => act(marcarPresente, args(alumno.id), 'Recuperación marcada como asistida.')}>
                      <Icono n="check" className="h-4 w-4" /> Marcar presente
                    </Boton>
                  )}
                  {asistencia ? (
                    esRecep && (
                      <Boton variante="fantasma" tam="sm" onClick={() => act(deshacerAsistencia, args(alumno.id), 'Registro deshecho.')}>
                        Deshacer
                      </Boton>
                    )
                  ) : (
                    !empezada && (
                      <Boton variante="peligro" tam="sm" onClick={() => setModal({ tipo: 'cancelar', alumno, reserva })}>
                        Cancelar recuperación
                      </Boton>
                    )
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}
      </Seccion>

      <div className="mt-6 flex flex-wrap gap-2">
        <Boton as="a" href={`#/clase/${clase.id}/${addDays(fecha, -7)}`} variante="suave" tam="sm"><Icono n="chevL" className="h-4 w-4" /> {fmtCorto(addDays(fecha, -7))}</Boton>
        <Boton as="a" href={`#/clase/${clase.id}/${addDays(fecha, 7)}`} variante="suave" tam="sm">{fmtCorto(addDays(fecha, 7))} <Icono n="chevR" className="h-4 w-4" /></Boton>
      </div>

      {/* Avisar ausencia */}
      <Modal
        abierto={modal?.tipo === 'ausencia'}
        onCerrar={cerrar}
        titulo="Avisar ausencia"
        pie={
          <>
            <Boton variante="suave" onClick={cerrar}>Volver</Boton>
            <Boton
              variante="primario"
              onClick={() => {
                act(avisarAusencia, args(modal.alumno.id), (r) =>
                  r.conCredito ? `Crédito generado para ${modal.alumno.nombre.split(' ')[0]}. El lugar quedó libre.` : 'Aviso registrado sin crédito (menos de 6 h).'
                )
                cerrar()
              }}
            >
              Confirmar aviso
            </Boton>
          </>
        }
      >
        {modal?.tipo === 'ausencia' && (
          <>
            <p><strong className="text-ink">{modal.alumno.nombre}</strong> avisa que no asistirá a la clase {clase.nivel} del {fmtCorto(fecha)} a las {clase.hora}.</p>
            {horas >= HORAS_MIN ? (
              <p className="mt-3 rounded-xl bg-[#d5ead0] p-3 text-[#1f4a17]">
                Faltan <strong>{fmtDuracion(horas)}</strong> (≥ {HORAS_MIN} h): se genera <strong>1 crédito</strong> que vence el <strong>{fmtCorto(addDays(fecha, 30))}</strong> y el lugar queda libre para otra recuperación.
              </p>
            ) : (
              <p className="mt-3 rounded-xl bg-[#f6d3cc] p-3 text-[#7a1d0e]">
                Faltan <strong>{fmtDuracion(horas)}</strong> (&lt; {HORAS_MIN} h): el aviso es tardío, <strong>no genera crédito</strong> y el lugar sigue ocupado.
              </p>
            )}
          </>
        )}
      </Modal>

      {/* Cancelar recuperación */}
      <Modal
        abierto={modal?.tipo === 'cancelar'}
        onCerrar={cerrar}
        titulo="Cancelar recuperación"
        pie={
          <>
            <Boton variante="suave" onClick={cerrar}>Mantener reserva</Boton>
            <Boton
              variante="peligro"
              onClick={() => {
                act(cancelarReserva, { reservaId: modal.reserva.id }, (r) => (r.devuelve ? 'Recuperación cancelada. El crédito volvió a estar activo.' : 'Recuperación cancelada. El crédito no se devuelve (menos de 6 h).'))
                cerrar()
              }}
            >
              Sí, cancelar
            </Boton>
          </>
        }
      >
        {modal?.tipo === 'cancelar' && (
          <>
            <p>Vas a cancelar la recuperación de <strong className="text-ink">{modal.alumno.nombre}</strong> del {fmtCorto(fecha)} a las {clase.hora}.</p>
            {horas >= HORAS_MIN ? (
              <p className="mt-3 rounded-xl bg-[#d5ead0] p-3 text-[#1f4a17]">Faltan {fmtDuracion(horas)}: el crédito <strong>vuelve a quedar activo</strong> con su vencimiento original.</p>
            ) : (
              <p className="mt-3 rounded-xl bg-[#f6d3cc] p-3 text-[#7a1d0e]">Faltan {fmtDuracion(horas)} (&lt; {HORAS_MIN} h): el crédito <strong>no se devuelve</strong>.</p>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
