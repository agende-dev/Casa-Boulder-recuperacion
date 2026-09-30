import { useRoute } from './router'
import { useApp } from './store'
import { cambiarVista } from './lib/logic'
import { Icono, Logo } from './components/ui'
import Panel from './pages/Panel'
import ClaseDetalle from './pages/ClaseDetalle'
import Alumnos from './pages/Alumnos'
import Reservar from './pages/Reservar'
import Creditos from './pages/Creditos'
import Info from './pages/Info'

const NAV = [
  { to: '/', etiqueta: 'Panel', etiquetaAlumno: 'Mis clases', icono: 'panel', activo: (p) => p === '/' || p.startsWith('/clase') },
  { to: '/alumnos', etiqueta: 'Alumnos', icono: 'gente', soloRecepcion: true, activo: (p) => p.startsWith('/alumnos') },
  { to: '/reservar', etiqueta: 'Recuperar', icono: 'reservar', activo: (p) => p.startsWith('/reservar') },
  { to: '/creditos', etiqueta: 'Créditos', icono: 'credito', activo: (p) => p.startsWith('/creditos') },
  { to: '/info', etiqueta: 'El gimnasio', icono: 'info', activo: (p) => p.startsWith('/info') },
]

function Pagina({ route }) {
  const { path, query } = route
  if (path.startsWith('/clase/')) {
    const [, , claseId, fecha] = path.split('/')
    return <ClaseDetalle claseId={claseId} fecha={fecha} />
  }
  if (path.startsWith('/creditos')) return <Creditos alumnoId={path.split('/')[2] || query.alumno} />
  if (path === '/alumnos') return <Alumnos />
  if (path === '/reservar') return <Reservar query={query} />
  if (path === '/info') return <Info />
  return <Panel />
}

export default function App() {
  const route = useRoute()
  const { toast, storageOk, state, now, rol, miAlumno, act } = useApp()
  const NAV_ACTIVO = NAV.filter((n) => rol === 'recepcion' || !n.soloRecepcion).map((n) => ({ ...n, etiqueta: rol === 'alumno' && n.etiquetaAlumno ? n.etiquetaAlumno : n.etiqueta }))
  const desfase = state.ajustes.offsetMin

  return (
    <div className="cemento min-h-dvh">
      <header className="sticky top-0 z-30 bg-graphite text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <a href="#/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-xl font-semibold uppercase leading-none tracking-wide">
              Casa Boulder
              <span className="block text-[10px] font-medium tracking-[0.2em] text-hold">Recuperaciones</span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV_ACTIVO.map((n) => (
              <a
                key={n.to}
                href={`#${n.to}`}
                aria-current={n.activo(route.path) ? 'page' : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${n.activo(route.path) ? 'bg-hold text-ink' : 'text-white/85 hover:bg-white/10'}`}
              >
                {n.etiqueta}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div role="group" aria-label="Vista de la app" className="flex rounded-xl bg-cement p-1">
            {[['recepcion', 'Recepción'], ['alumno', 'Alumno']].map(([r, t]) => (
              <button
                key={r}
                aria-pressed={rol === r}
                onClick={() => rol !== r && act(cambiarVista, { rol: r }, r === 'alumno' ? `Vista alumno: ${miAlumno.nombre}` : 'Vista recepción')}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${rol === r ? 'bg-graphite text-white' : 'text-graphite hover:bg-white/70'}`}
              >
                {t}
              </button>
            ))}
          </div>
          {rol === 'alumno' ? (
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-graphite">
              <span className="shrink-0">Soy</span>
              <select
                value={miAlumno.id}
                onChange={(e) => act(cambiarVista, { rol: 'alumno', alumnoId: e.target.value })}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-cement-dark bg-white px-2 text-sm font-normal normal-case tracking-normal text-ink sm:max-w-xs"
              >
                {state.alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </label>
          ) : (
            <p className="text-xs text-graphite/80">Vista completa de gestión</p>
          )}
        </div>
      </div>

      {!storageOk && (
        <div role="alert" className="border-b border-[#e2b3a9] bg-[#fbeae6] px-4 py-3 text-sm text-[#7a1d0e]">
          <div className="mx-auto flex max-w-6xl items-start gap-2">
            <Icono n="alerta" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>Tu navegador está bloqueando el almacenamiento local</strong> (modo privado o cookies desactivadas). Puedes usar la app, pero los cambios se perderán al recargar o cerrar la pestaña.
            </p>
          </div>
        </div>
      )}

      {desfase !== 0 && (
        <div className="bg-ink px-4 py-2 text-center text-xs text-white">
          Reloj de demostración activo: la app cree que son las{' '}
          <strong>{now.toLocaleString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>.{' '}
          <a href="#/info" className="font-semibold text-hold underline">Ajustar</a>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 md:pb-16">
        <Pagina route={route} />
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-graphite md:hidden" aria-label="Principal">
        <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${NAV_ACTIVO.length}, minmax(0, 1fr))` }}>
          {NAV_ACTIVO.map((n) => {
            const on = n.activo(route.path)
            return (
              <li key={n.to}>
                <a
                  href={`#${n.to}`}
                  aria-current={on ? 'page' : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${on ? 'text-hold' : 'text-white/75'}`}
                >
                  <Icono n={n.icono} className="h-5 w-5" />
                  <span className="max-w-full truncate">{n.etiqueta}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-44 z-[60] flex justify-center px-4 md:bottom-8" role="status" aria-live="polite">
          <div className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.tipo === 'error' ? 'bg-[#9b2a14] text-white' : 'bg-ink text-white'}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
