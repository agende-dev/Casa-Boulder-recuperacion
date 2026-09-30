const KEY = 'casaboulder.recuperaciones.v1'
let memoria = null // respaldo si localStorage está bloqueado

export function storageDisponible() {
  try {
    const t = '__cb_test__'
    window.localStorage.setItem(t, '1')
    window.localStorage.removeItem(t)
    return true
  } catch {
    return false
  }
}

export function leer() {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return memoria
  }
}

export function guardar(state) {
  memoria = state
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function borrar() {
  memoria = null
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* sin almacenamiento */
  }
}

export const STORAGE_KEY = KEY
