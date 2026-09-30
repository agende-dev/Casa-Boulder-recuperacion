import { useState } from 'react'
import { useApp } from '../store'
import { PLANES } from '../lib/seed'
import { fmtCLP } from '../lib/dates'
import { ajustarReloj } from '../lib/logic'
import { Boton, Card, Icono, Modal, Seccion, Titulo } from '../components/ui'

// Datos de ejemplo del negocio: reemplazar por los reales al integrar.
const NEGOCIO = {
  direccion: 'Av. Providencia 2450, Providencia, Santiago (dirección de ejemplo)',
  telefono: '+56 2 2555 0142',
  correo: 'hola@casaboulder.example',
  instagram: '@casaboulder.cl',
  whatsapp: '+56 9 5550 0100',
  lat: -33.4262,
  lon: -70.6104,
}

const HORARIO = [
  ['Lunes a viernes', '10:00 – 22:30'],
  ['Sábado', '10:00 – 19:00'],
  ['Domingo', '10:00 – 15:00'],
]

export default function Info() {
  const { state, now, act, reiniciar, avisar } = useApp()
  const [confirmar, setConfirmar] = useState(false)
  const bbox = `${NEGOCIO.lon - 0.006},${NEGOCIO.lat - 0.0035},${NEGOCIO.lon + 0.006},${NEGOCIO.lat + 0.0035}`
  const simulado = (donde) => avisar(`Simulado: en producción esto abre ${donde}.`)

  return (
    <div>
      <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-hold-dark">Sobre Nosotros</p>
      <Titulo>Casa Boulder</Titulo>

      <Card className="mt-4 overflow-hidden">
        <div className="h-1.5 bg-hold" />
        <div className="p-5 sm:p-6">
          <p className="max-w-2xl text-base leading-relaxed text-graphite">
            Casa Boulder es un gimnasio de escalada boulder en Santiago con cursos fijos para todas las edades: Iniciación, Básico, Intermedio, Avanzado y Niños. Cada curso tiene un cupo de 10 personas en clases de 90 minutos, con rutas que se cambian cada semana para que siempre haya un problema nuevo que resolver.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite">
            Esta app ordena las recuperaciones: si avisas con 6 horas o más de anticipación que no vas a poder venir, tu clase se convierte en un crédito válido por 30 días para asistir a otra clase de tu mismo nivel donde haya cupo.
          </p>
        </div>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold uppercase text-graphite">Cómo funcionan las recuperaciones</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-graphite">
            <li className="flex gap-2"><Icono n="check" className="mt-0.5 h-4 w-4 shrink-0 text-hold-dark" /> Avisar con <strong>6 h o más</strong>: genera un crédito y libera tu lugar.</li>
            <li className="flex gap-2"><Icono n="check" className="mt-0.5 h-4 w-4 shrink-0 text-hold-dark" /> Avisar con <strong>menos de 6 h</strong> o no venir: no genera crédito.</li>
            <li className="flex gap-2"><Icono n="check" className="mt-0.5 h-4 w-4 shrink-0 text-hold-dark" /> El crédito vence <strong>30 días</strong> después de la clase a la que faltaste.</li>
            <li className="flex gap-2"><Icono n="check" className="mt-0.5 h-4 w-4 shrink-0 text-hold-dark" /> Solo se recupera en clases de <strong>tu nivel actual</strong> con cupo disponible.</li>
            <li className="flex gap-2"><Icono n="check" className="mt-0.5 h-4 w-4 shrink-0 text-hold-dark" /> Cancelar una recuperación con 6 h o más devuelve el crédito.</li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl font-semibold uppercase text-graphite">Planes y horario</h2>
          <ul className="mt-3 divide-y divide-cement text-sm">
            {Object.values(PLANES).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span>{p.nombre}</span>
                <strong className="font-display text-lg text-ink">{fmtCLP(p.precio)}<span className="text-xs font-normal text-graphite/70"> /mes</span></strong>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-graphite/70">Horario de sala</h3>
          <ul className="mt-1 text-sm">
            {HORARIO.map(([d, h]) => (
              <li key={d} className="flex justify-between py-1"><span>{d}</span><strong>{h}</strong></li>
            ))}
          </ul>
        </Card>
      </div>

      <Seccion titulo="Cómo llegar">
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] w-full bg-cement-dark sm:aspect-[16/7]">
            <iframe
              title="Mapa de ubicación de Casa Boulder"
              className="h-full w-full border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${NEGOCIO.lat},${NEGOCIO.lon}`}
            />
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-graphite"><Icono n="pin" className="mt-0.5 h-5 w-5 shrink-0 text-hold-dark" />{NEGOCIO.direccion}</p>
            <Boton as="a" variante="oscuro" tam="sm" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${NEGOCIO.lat}&mlon=${NEGOCIO.lon}#map=16/${NEGOCIO.lat}/${NEGOCIO.lon}`}>
              Abrir mapa completo
            </Boton>
          </div>
        </Card>
      </Seccion>

      <Seccion titulo="Redes y contacto">
        <div className="grid gap-2 sm:grid-cols-3">
          <button onClick={() => simulado('Instagram')} className="min-h-14 rounded-xl bg-white p-3 text-left ring-1 ring-black/10 hover:bg-cement/60"><span className="block text-xs font-semibold uppercase tracking-wide text-graphite/70">Instagram</span><strong>{NEGOCIO.instagram}</strong></button>
          <button onClick={() => simulado('WhatsApp')} className="min-h-14 rounded-xl bg-white p-3 text-left ring-1 ring-black/10 hover:bg-cement/60"><span className="block text-xs font-semibold uppercase tracking-wide text-graphite/70">WhatsApp</span><strong>{NEGOCIO.whatsapp}</strong></button>
          <button onClick={() => simulado('tu correo')} className="min-h-14 rounded-xl bg-white p-3 text-left ring-1 ring-black/10 hover:bg-cement/60"><span className="block text-xs font-semibold uppercase tracking-wide text-graphite/70">Correo</span><strong className="break-all">{NEGOCIO.correo}</strong></button>
        </div>
      </Seccion>

      <Seccion titulo="Modo demostración">
        <Card className="p-5">
          <p className="text-sm text-graphite">Todo se guarda solo en este navegador. Para probar las reglas de las 6 horas puedes mover el reloj de la app.</p>
          <p className="mt-3 text-sm">
            Hora que usa la app: <strong>{now.toLocaleString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Boton tam="sm" onClick={() => act(ajustarReloj, { deltaMin: 60 })}>+1 hora</Boton>
            <Boton tam="sm" onClick={() => act(ajustarReloj, { deltaMin: 360 })}>+6 horas</Boton>
            <Boton tam="sm" onClick={() => act(ajustarReloj, { deltaMin: 1440 })}>+1 día</Boton>
            <Boton tam="sm" onClick={() => act(ajustarReloj, { deltaMin: -60 })}>−1 hora</Boton>
            <Boton tam="sm" variante="fantasma" disabled={!state.ajustes.offsetMin} onClick={() => act(ajustarReloj, { reset: true }, 'Reloj real restablecido.')}>Volver a la hora real</Boton>
          </div>
          <div className="mt-5 border-t border-cement pt-4">
            <Boton variante="peligro" onClick={() => setConfirmar(true)}>Reiniciar datos de ejemplo</Boton>
          </div>
        </Card>
      </Seccion>

      <Modal
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        titulo="Reiniciar datos"
        pie={
          <>
            <Boton variante="suave" onClick={() => setConfirmar(false)}>Cancelar</Boton>
            <Boton variante="primario" onClick={() => { reiniciar(); setConfirmar(false) }}>Sí, reiniciar</Boton>
          </>
        }
      >
        Se borrarán los cambios hechos en este navegador y se volverán a cargar las clases, los 6 alumnos y los créditos de ejemplo.
      </Modal>
    </div>
  )
}
