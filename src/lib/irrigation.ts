import { addDays, diffDays, eachDate } from "@/lib/dates"

export const CULTIVO_TIPOS = ["aji", "nogal", "maiz", "manzana"] as const
export type CultivoTipo = (typeof CULTIVO_TIPOS)[number]

export const SISTEMA_TIPOS = ["aspersion", "microaspersion", "goteo"] as const
export type SistemaTipo = (typeof SISTEMA_TIPOS)[number]

export const TEXTURAS = [
  "arena",
  "franco_arenoso",
  "franco",
  "franco_limoso",
  "franco_arcilloso",
  "arcilla",
] as const
export type Textura = (typeof TEXTURAS)[number]

/** Agua disponible de referencia, mm por metro de profundidad (capacidad de campo menos punto de marchitez). */
export const AGUA_MM_POR_M: Record<Textura, number> = {
  arena: 80,
  franco_arenoso: 120,
  franco: 170,
  franco_limoso: 200,
  franco_arcilloso: 180,
  arcilla: 150,
}

type Curve = readonly (readonly [number, number])[]

/**
 * Curvas de Kc base (cobertura plena de referencia).
 * Ají y maíz: FAO-56 (pimiento y maíz grano), ciclo de 140 días desde siembra.
 * Manzana: FAO-56 manzano con cobertura, desde inicio de temporada.
 * Nogal: curva de referencia de nogal de hoja caduca, desde brotación.
 */
const CURVAS: Record<CultivoTipo, Curve> = {
  aji: [
    [0, 0.6],
    [30, 0.6],
    [60, 1.05],
    [110, 1.05],
    [140, 0.9],
  ],
  maiz: [
    [0, 0.3],
    [25, 0.3],
    [65, 1.2],
    [110, 1.2],
    [140, 0.4],
  ],
  manzana: [
    [0, 0.5],
    [30, 0.7],
    [70, 1.2],
    [160, 1.2],
    [210, 0.85],
    [240, 0.6],
  ],
  nogal: [
    [0, 0.4],
    [30, 0.55],
    [60, 0.85],
    [90, 1.1],
    [150, 1.15],
    [210, 0.95],
    [240, 0.65],
    [270, 0.45],
  ],
}

export function interpolarKc(curva: Curve, dia: number): number {
  const primero = curva[0]
  if (dia <= primero[0]) return primero[1]
  const ultimo = curva[curva.length - 1]
  if (dia >= ultimo[0]) return ultimo[1]
  for (let index = 1; index < curva.length; index += 1) {
    const [diaFin, kcFin] = curva[index]
    const [diaInicio, kcInicio] = curva[index - 1]
    if (dia <= diaFin) {
      const avance = (dia - diaInicio) / (diaFin - diaInicio)
      return kcInicio + (kcFin - kcInicio) * avance
    }
  }
  return ultimo[1]
}

export function kcBase(tipo: CultivoTipo, diasDesdeInicio: number): number {
  return interpolarKc(CURVAS[tipo], diasDesdeInicio)
}

/**
 * Ajusta el Kc con la cobertura estimada.
 * En anuales, la evaporación inicial se conserva y la subida del Kc se escala con la cobertura.
 * En frutales, queda un piso de evaporación del suelo y el resto crece con la cobertura.
 */
export function kcEfectivo(
  tipo: CultivoTipo,
  diasDesdeInicio: number,
  coberturaPct: number,
): number {
  const kc = kcBase(tipo, diasDesdeInicio)
  const cobertura = clamp(coberturaPct, 0, 100) / 100
  if (tipo === "aji" || tipo === "maiz") {
    const inicial = kcBase(tipo, 0)
    return inicial + (kc - inicial) * cobertura
  }
  const piso = 0.35
  return piso + (kc - piso) * cobertura
}

export function aguaDisponibleMm(textura: Textura, profundidadCm: number): number {
  return redondear((AGUA_MM_POR_M[textura] * profundidadCm) / 100, 2)
}

export function litrosDisponiblesPorPlanta(
  aguaMm: number,
  superficieHa: number,
  plantas: number,
  superficieMojadaPct: number,
): number {
  if (plantas <= 0 || superficieHa <= 0) return 0
  const metrosPorPlanta = (superficieHa * 10_000) / plantas
  const metrosMojados = metrosPorPlanta * (clamp(superficieMojadaPct, 0, 100) / 100)
  return aguaMm * metrosMojados
}

export function anclaParaFecha(fechasRiego: readonly string[], fecha: string): string | null {
  let ancla: string | null = null
  for (const fechaRiego of fechasRiego) {
    if (fechaRiego <= fecha && (ancla === null || fechaRiego > ancla)) {
      ancla = fechaRiego
    }
  }
  return ancla
}

/** Días de consumo entre el ancla (exclusivo) o el inicio (inclusivo) y `hasta` (inclusivo). */
export function fechasDeConsumo(
  fechaInicio: string,
  ancla: string | null,
  hasta: string,
): string[] {
  const desde = ancla ? addDays(ancla, 1) : fechaInicio
  const start = desde < fechaInicio ? fechaInicio : desde
  if (hasta < start) return []
  return eachDate(start, hasta)
}

export type DiaEtc = {
  fecha: string
  et0: number
  kc: number
  etc: number
}

export function sumarEtc(
  fechas: readonly string[],
  et0: ReadonlyMap<string, number>,
  tipo: CultivoTipo,
  coberturaPct: number,
  fechaInicio: string,
): { etcMm: number; faltantes: string[]; detalle: DiaEtc[] } {
  const detalle: DiaEtc[] = []
  const faltantes: string[] = []
  let etcMm = 0
  for (const fecha of fechas) {
    const valor = et0.get(fecha)
    if (valor === undefined || Number.isNaN(valor)) {
      faltantes.push(fecha)
      continue
    }
    const kc = kcEfectivo(tipo, diffDays(fechaInicio, fecha), coberturaPct)
    const etc = valor * kc
    etcMm += etc
    detalle.push({ fecha, et0: valor, kc, etc })
  }
  return { etcMm, faltantes, detalle }
}

export function milimetrosNecesarios(depletionMm: number, capacidadMm: number): number {
  return Math.min(Math.max(depletionMm, 0), Math.max(capacidadMm, 0))
}

export function remanenteSuelo(capacidadMm: number, depletionMm: number): {
  remanenteMm: number
  fraccion: number
} {
  const remanenteMm = Math.max(0, capacidadMm - Math.max(0, depletionMm))
  const fraccion = capacidadMm <= 0 ? 0 : remanenteMm / capacidadMm
  return { remanenteMm, fraccion }
}

/**
 * Milímetros que quedan en el suelo mojado.
 * La precipitación real es el caudal repartido en la superficie mojada (1 L/m² = 1 mm).
 * Se ajusta con la eficiencia de referencia del sistema.
 * El presurizado es inmediato: toda la duración cuenta desde el inicio.
 */
export function estimarMilimetros(input: {
  duracionMin: number
  caudalPlantaLph: number
  plantas: number
  superficieHa: number
  superficieMojadaPct: number
  eficienciaPct: number
}): { precipitacionMmH: number; mmAplicar: number } {
  const horas = Math.max(0, input.duracionMin) / 60
  const areaTotal = Math.max(0, input.superficieHa) * 10_000
  const fraccionMojada = clamp(input.superficieMojadaPct, 0, 100) / 100
  const areaMojada = areaTotal * fraccionMojada
  const litrosPorHora = Math.max(0, input.caudalPlantaLph) * Math.max(0, input.plantas)
  const precipitacionMmH = areaMojada > 0 ? litrosPorHora / areaMojada : 0
  const mmAplicar = precipitacionMmH * horas * (clamp(input.eficienciaPct, 0, 100) / 100)
  return { precipitacionMmH, mmAplicar }
}

export function aguaAplicada(input: {
  duracionMin: number
  caudalPlantaLph: number
  plantas: number
  eficienciaPct: number
  superficieHa: number
}): {
  metrosCubicos: number
  mmNetos: number
  mmBrutos: number
  litrosNetosPorPlanta: number
} {
  const horas = input.duracionMin / 60
  const litrosBrutos = horas * input.caudalPlantaLph * input.plantas
  const metrosCubicos = litrosBrutos / 1000
  const litrosNetos = litrosBrutos * (input.eficienciaPct / 100)
  const area = input.superficieHa * 10_000
  const mmNetos = area > 0 ? litrosNetos / area : 0
  const mmBrutos = area > 0 ? litrosBrutos / area : 0
  const litrosNetosPorPlanta = input.plantas > 0 ? litrosNetos / input.plantas : 0
  return { metrosCubicos, mmNetos, mmBrutos, litrosNetosPorPlanta }
}

export type ColorBarraEfectividad = "amarillo" | "verde" | "rojo"

/**
 * La barra de efectividad usa los mismos milímetros que califican el riego.
 * Amarillo mientras la lámina va llenando el suelo, verde dentro del 10%
 * y rojo a lo ancho cuando el riego es excesivo. El gris es el fondo.
 */
export function barraEfectividad(
  necesariosMm: number,
  aplicadosMm: number,
): { color: ColorBarraEfectividad; fraccion: number } {
  const nota = puntuarRiego(necesariosMm, aplicadosMm)
  if (nota.resultado === "adecuado") {
    const fraccion = necesariosMm <= 0.05 ? 1 : Math.min(1, Math.max(0, aplicadosMm / necesariosMm))
    return { color: "verde", fraccion }
  }
  if (nota.motivo === "exceso") return { color: "rojo", fraccion: 1 }
  const fraccion = necesariosMm <= 0 ? 0 : Math.min(1, Math.max(0, aplicadosMm / necesariosMm))
  return { color: "amarillo", fraccion }
}

export type MotivoRiego = "equilibrio" | "exceso" | "deficit"
export type ResultadoRiego = "adecuado" | "ineficiente"

export type PuntuacionRiego = {
  puntuacion: number
  resultado: ResultadoRiego
  motivo: MotivoRiego
  desviacion: number
}

/**
 * Un margen de ±10% respecto de los milímetros que el suelo podía recibir
 * es riego adecuado. Fuera de ese margen, el riego es ineficiente.
 * Si el suelo ya estaba lleno, cualquier lámina aplicada es exceso.
 */
export function puntuarRiego(necesariosMm: number, aplicadosMm: number): PuntuacionRiego {
  if (necesariosMm <= 0.05) {
    if (aplicadosMm <= 0.05) {
      return { puntuacion: 100, resultado: "adecuado", motivo: "equilibrio", desviacion: 0 }
    }
    return { puntuacion: 0, resultado: "ineficiente", motivo: "exceso", desviacion: 1 }
  }
  const desviacion = (aplicadosMm - necesariosMm) / necesariosMm
  const absoluta = Math.abs(desviacion)
  const puntuacion = Math.max(0, Math.min(100, Math.round(100 - absoluta * 100)))
  const resultado: ResultadoRiego = absoluta <= 0.1 + 1e-9 ? "adecuado" : "ineficiente"
  const motivo: MotivoRiego =
    absoluta <= 0.02 ? "equilibrio" : desviacion > 0 ? "exceso" : "deficit"
  return { puntuacion, resultado, motivo, desviacion }
}

export function duracionSugeridaMin(input: {
  necesariosMm: number
  superficieHa: number
  caudalPlantaLph: number
  plantas: number
  eficienciaPct: number
}): number | null {
  if (input.necesariosMm <= 0) return 0
  const eficiencia = input.eficienciaPct / 100
  const litrosPorHora = input.caudalPlantaLph * input.plantas
  if (eficiencia <= 0 || litrosPorHora <= 0 || input.superficieHa <= 0) return null
  const litrosNetos = input.necesariosMm * input.superficieHa * 10_000
  const litrosBrutos = litrosNetos / eficiencia
  return Math.max(1, Math.round((litrosBrutos / litrosPorHora) * 60))
}

export type Et0Dia = { fecha: string; et0Mm: number }

export function mapaEt0(dias: readonly Et0Dia[]): Map<string, number> {
  return new Map(dias.map((dia) => [dia.fecha, dia.et0Mm]))
}

export type BalanceAgua = {
  fechas: string[]
  depletionMm: number
  necesariosMm: number
  remanenteMm: number
  fraccion: number
  faltantes: string[]
  litrosRemanentesPorPlanta: number
}

export function balanceEnFecha(input: {
  fecha: string
  fechaInicio: string
  fechasRiego: readonly string[]
  et0: readonly Et0Dia[]
  tipo: CultivoTipo
  coberturaPct: number
  aguaDisponibleMm: number
  litrosDisponiblesPorPlanta: number
}): BalanceAgua {
  const ancla = anclaParaFecha(input.fechasRiego, input.fecha)
  const fechas = fechasDeConsumo(input.fechaInicio, ancla, input.fecha)
  const suma = sumarEtc(
    fechas,
    mapaEt0(input.et0),
    input.tipo,
    input.coberturaPct,
    input.fechaInicio,
  )
  const necesariosMm = milimetrosNecesarios(suma.etcMm, input.aguaDisponibleMm)
  const remanente = remanenteSuelo(input.aguaDisponibleMm, suma.etcMm)
  return {
    fechas,
    depletionMm: suma.etcMm,
    necesariosMm,
    remanenteMm: remanente.remanenteMm,
    fraccion: remanente.fraccion,
    faltantes: suma.faltantes,
    litrosRemanentesPorPlanta: input.litrosDisponiblesPorPlanta * remanente.fraccion,
  }
}

export const RACHA_MINIMA = 2

export function rachaActiva(dias: number): boolean {
  return dias >= RACHA_MINIMA
}

export type RachaEstado = { actual: number; ultimaFecha: string | null }
export type CambioRacha = "suma" | "mantiene" | "rompe" | "inicia"

export function aplicarRacha(
  estado: RachaEstado,
  fechaRiego: string,
  hoy: string,
): {
  actual: number
  ultimaFecha: string | null
  rota: boolean
  cambio: CambioRacha
} {
  if (fechaRiego < hoy) {
    return { actual: 0, ultimaFecha: null, rota: true, cambio: "rompe" }
  }
  if (fechaRiego > hoy) {
    throw new Error("La fecha del riego no puede ser futura.")
  }
  if (estado.ultimaFecha === hoy && estado.actual > 0) {
    return { actual: estado.actual, ultimaFecha: hoy, rota: false, cambio: "mantiene" }
  }
  if (estado.ultimaFecha === addDays(hoy, -1) && estado.actual > 0) {
    return { actual: estado.actual + 1, ultimaFecha: hoy, rota: false, cambio: "suma" }
  }
  return { actual: 1, ultimaFecha: hoy, rota: false, cambio: "inicia" }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function redondear(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
