export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const p2 = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s, n) => {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const isoWeekday = (s) => {
  const g = parseISO(s).getDay()
  return g === 0 ? 7 : g
}
export const mondayOf = (s) => addDays(s, -(isoWeekday(s) - 1))
export const startOf = (fecha, hora) => {
  const [h, m] = hora.split(':').map(Number)
  const d = parseISO(fecha)
  d.setHours(h, m, 0, 0)
  return d
}
export const endHora = (hora, min = 90) => {
  const [h, m] = hora.split(':').map(Number)
  const t = h * 60 + m + min
  return `${p2(Math.floor(t / 60) % 24)}:${p2(t % 60)}`
}
export const diffDias = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 864e5)

/** "Lun 5 oct" */
export const fmtCorto = (s) => {
  const d = parseISO(s)
  return `${DIAS_CORTO[isoWeekday(s) - 1]} ${d.getDate()} ${MESES[d.getMonth()]}`
}
/** "Lunes 5 de octubre" */
export const fmtLargo = (s) => {
  const d = parseISO(s)
  const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()]
  return `${DIAS[isoWeekday(s) - 1]} ${d.getDate()} de ${mes}`
}
/** "5 oct" */
export const fmtDM = (s) => {
  const d = parseISO(s)
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}
export const fmtDuracion = (horas) => {
  const total = Math.max(0, Math.round(Math.abs(horas) * 60))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h >= 48) return `${Math.floor(h / 24)} días`
  if (h === 0) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}
export const fmtCLP = (n) => '$' + n.toLocaleString('es-CL')
