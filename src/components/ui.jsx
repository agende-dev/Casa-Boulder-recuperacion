import { useEffect, useRef } from 'react'

export const NIVEL_ESTILO = {
  'Iniciación': 'bg-[#d9e6d1] text-[#26401d]',
  'Básico': 'bg-[#f0e2bf] text-[#54400f]',
  'Intermedio': 'bg-[#f8d2b8] text-[#7a2d06]',
  'Avanzado': 'bg-graphite text-white',
  'Niños': 'bg-[#cfe3ee] text-[#1b3f55]',
}

export function NivelChip({ nivel, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${NIVEL_ESTILO[nivel] || 'bg-cement-dark'} ${className}`}>
      {nivel}
    </span>
  )
}

export function Badge({ tono = 'gris', children, className = '' }) {
  const t = {
    gris: 'bg-cement text-graphite',
    naranja: 'bg-hold text-ink',
    verde: 'bg-[#d5ead0] text-[#1f4a17]',
    rojo: 'bg-[#f6d3cc] text-[#7a1d0e]',
    oscuro: 'bg-graphite text-white',
  }[tono]
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${t} ${className}`}>{children}</span>
}

const BTN = {
  primario: 'bg-hold text-ink hover:bg-[#f27a38] active:bg-hold-dark active:text-white',
  oscuro: 'bg-graphite text-white hover:bg-ink',
  suave: 'bg-white text-ink border border-cement-dark hover:bg-cement',
  peligro: 'bg-white text-[#9b2a14] border border-[#e2b3a9] hover:bg-[#fbeae6]',
  fantasma: 'text-graphite hover:bg-cement-dark/60',
}

export function Boton({ variante = 'suave', tam = 'md', className = '', as: As = 'button', children, ...rest }) {
  const size = tam === 'sm' ? 'min-h-10 px-3 text-sm' : tam === 'lg' ? 'min-h-14 px-6 text-base' : 'min-h-11 px-4 text-sm'
  return (
    <As
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${size} ${BTN[variante]} ${className}`}
    >
      {children}
    </As>
  )
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div {...rest} className={`rounded-2xl bg-white shadow-[0_1px_0_rgba(0,0,0,.06)] ring-1 ring-black/5 ${className}`}>
      {children}
    </div>
  )
}

export function Titulo({ children, className = '' }) {
  return <h1 className={`font-display text-3xl font-semibold uppercase leading-tight text-ink sm:text-4xl ${className}`}>{children}</h1>
}

export function Seccion({ titulo, extra, children }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold uppercase text-graphite">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

/** Diez presas: rellenas = ocupadas, huecas naranja = libres. */
export function Presas({ ocupados, cupo = 10, size = 'h-2.5 w-2.5' }) {
  return (
    <div className="flex flex-nowrap gap-[3px]" aria-hidden="true">
      {Array.from({ length: cupo }, (_, i) => (
        <span key={i} className={`${size} rounded-full ${i < ocupados ? 'bg-graphite' : 'border-2 border-hold bg-white'}`} />
      ))}
    </div>
  )
}

export function Vacio({ titulo, texto, children }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-cement-dark bg-white/60 px-5 py-8 text-center">
      <p className="font-display text-lg font-semibold uppercase text-graphite">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-md text-sm text-graphite/80">{texto}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  )
}

export function Modal({ abierto, onCerrar, titulo, children, pie }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!abierto) return
    const onKey = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])
  if (!abierto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <h2 className="font-display text-2xl font-semibold uppercase text-ink">{titulo}</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full text-graphite hover:bg-cement">
            <Icono n="x" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3 text-sm text-graphite">{children}</div>
        {pie && <div className="flex flex-col-reverse gap-2 border-t border-cement px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end">{pie}</div>}
      </div>
    </div>
  )
}

const P = {
  chevL: 'M15 5l-7 7 7 7',
  chevR: 'M9 5l7 7-7 7',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  reloj: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  pin: 'M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  panel: 'M4 5h16v14H4zM4 10h16M10 10v9',
  gente: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 010 6.5M18 14.3c2 .7 3.5 2.5 3.5 5.2',
  reservar: 'M12 5v14M5 12h14',
  credito: 'M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z',
  info: 'M12 11v5M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z',
  alerta: 'M12 9v4M12 17h.01M10.3 4.2L2.7 17.5A2 2 0 004.4 20.5h15.2a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z',
  flecha: 'M5 12h14M13 6l6 6-6 6',
}

export function Icono({ n, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={P[n]} />
    </svg>
  )
}

export function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#E8641E" />
      <path d="M13 41c-2-10 6-20 16-20 9 0 16 6 15 15-1 9-9 13-17 12-7-1-12-3-14-7z" fill="#1B1B1B" />
      <circle cx="47" cy="17" r="6" fill="#fff" />
      <circle cx="24" cy="34" r="3" fill="#E8641E" />
    </svg>
  )
}
