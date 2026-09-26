export const APP_TIMEZONE = "America/Mexico_City"

export function todayISO(now = new Date(), timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function diffDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000)
}

export function eachDate(from: string, to: string, limit = 800): string[] {
  if (to < from) return []
  const dates: string[] = []
  let cursor = from
  while (cursor <= to && dates.length < limit) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return dates
}

export function formatoFecha(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatoNumero(value: number, digits = 1): string {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function formatoCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S"
  const ew = lng >= 0 ? "E" : "O"
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

export function formatoDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const minutosResto = minutos % 60
  if (horas <= 0) return `${minutosResto} min`
  if (minutosResto === 0) return `${horas} h`
  return `${horas} h ${minutosResto} min`
}

export function formatoM3(value: number): string {
  const digits = value >= 100 ? 0 : 1
  return `${formatoNumero(value, digits)} m³`
}
