import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { crearDatosEjemplo } from './lib/seed'
import { leer, guardar, borrar, storageDisponible, STORAGE_KEY } from './lib/storage'
import { normalizar } from './lib/logic'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const ahora = (state) => new Date(Date.now() + (state.ajustes?.offsetMin || 0) * 60000)

function cargar() {
  let s = leer()
  if (!s || s.v !== 1 || !Array.isArray(s.clases) || !Array.isArray(s.alumnos)) {
    s = crearDatosEjemplo()
  }
  s = normalizar(s, ahora(s))
  guardar(s)
  return s
}

export function AppProvider({ children }) {
  const [storageOk] = useState(() => storageDisponible())
  const [state, setState] = useState(cargar)
  const ref = useRef(state)
  const [tick, setTick] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // sincroniza entre pestañas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return
      const s = leer()
      if (s) {
        ref.current = s
        setState(s)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const now = useMemo(() => ahora(state), [state.ajustes?.offsetMin, tick]) // eslint-disable-line

  const avisar = useCallback((msg, tipo = 'ok') => {
    setToast({ msg, tipo, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(t)
  }, [toast])

  /** Ejecuta una acción de logic.js sobre el estado actual y lo persiste. */
  const act = useCallback(
    (fn, args, okMsg) => {
      const res = fn(ref.current, ahora(ref.current), args)
      if (res.error) {
        avisar(res.error, 'error')
        return res
      }
      const next = normalizar(res.state, ahora(res.state))
      ref.current = next
      setState(next)
      guardar(next)
      if (okMsg) avisar(typeof okMsg === 'function' ? okMsg(res) : okMsg)
      return res
    },
    [avisar]
  )

  const reiniciar = useCallback(() => {
    borrar()
    const s = crearDatosEjemplo()
    ref.current = s
    setState(s)
    guardar(s)
    avisar('Datos de ejemplo restablecidos.')
  }, [avisar])

  const rol = state.ajustes.rol || 'recepcion'
  const miAlumno = state.alumnos.find((a) => a.id === state.ajustes.alumnoId) || state.alumnos[0]
  const value = { state, now, act, avisar, toast, reiniciar, storageOk, rol, miAlumno }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
