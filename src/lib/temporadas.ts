export const TEMPORADA_EJEMPLO_NUEZ = {
  cultivo: "Nuez pecana",
  anio: 2025,
  cosechaKg: 5000,
  riegoM3: 50000,
  lluviaMm: 310,
  productividadLporKg: 5000,
} as const

export type FilaTemporada = {
  cultivo: string
  anio: number
}

export function agruparTemporadas<T extends FilaTemporada>(filas: readonly T[]): { cultivo: string; filas: T[] }[] {
  const ordenadas = [...filas].sort(
    (a, b) => a.cultivo.localeCompare(b.cultivo, "es") || b.anio - a.anio,
  )
  const grupos: { cultivo: string; filas: T[] }[] = []
  for (const fila of ordenadas) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.cultivo === fila.cultivo) ultimo.filas.push(fila)
    else grupos.push({ cultivo: fila.cultivo, filas: [fila] })
  }
  return grupos
}
