import { useEffect, useState } from 'react'

function parse() {
  const h = window.location.hash.slice(1) || '/'
  const [path, q] = h.split('?')
  return { path, query: Object.fromEntries(new URLSearchParams(q || '')) }
}

export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (to) => {
  window.location.hash = to
}
