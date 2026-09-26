import type { CultivoTipo, SistemaTipo, Textura } from "@/lib/irrigation"

export const PIN_INICIAL = {
  lat: 20.6767,
  lng: -101.3542,
  lugar: "el Bajío, cerca de Irapuato",
}

export type FichaCultivo = {
  tipo: CultivoTipo
  nombre: string
  fechaEtiqueta: string
  fechaAyuda: string
  variedades: string[]
  coberturaPct: number
  profundidadCm: number
  plantasPorHa: number
  sistemaInicial: SistemaTipo
  resumen: string
}

export const CULTIVOS: Record<CultivoTipo, FichaCultivo> = {
  aji: {
    tipo: "aji",
    nombre: "Ají",
    fechaEtiqueta: "Fecha de siembra",
    fechaAyuda: "El coeficiente del ají se cuenta desde la siembra.",
    variedades: ["Jalapeño", "Serrano", "Poblano", "Habanero", "Güero", "Anaheim"],
    coberturaPct: 85,
    profundidadCm: 40,
    plantasPorHa: 25_000,
    sistemaInicial: "goteo",
    resumen: "Chile de ciclo anual. El Kc parte en 0.60 y llega a 1.05.",
  },
  nogal: {
    tipo: "nogal",
    nombre: "Nogal",
    fechaEtiqueta: "Inicio de temporada",
    fechaAyuda: "El coeficiente del nogal se cuenta desde la brotación.",
    variedades: ["Western", "Wichita", "Barton", "Cheyenne", "Criollo"],
    coberturaPct: 70,
    profundidadCm: 120,
    plantasPorHa: 156,
    sistemaInicial: "microaspersion",
    resumen: "Árbol de hoja caduca. El Kc sube desde la brotación hasta el verano.",
  },
  maiz: {
    tipo: "maiz",
    nombre: "Maíz",
    fechaEtiqueta: "Fecha de siembra",
    fechaAyuda: "El coeficiente del maíz se cuenta desde la siembra.",
    variedades: ["Híbrido blanco", "Híbrido amarillo", "Criollo", "Elote"],
    coberturaPct: 95,
    profundidadCm: 70,
    plantasPorHa: 75_000,
    sistemaInicial: "aspersion",
    resumen: "Ciclo anual. El Kc inicial es bajo y pasa de 1.20 en el llenado.",
  },
  manzana: {
    tipo: "manzana",
    nombre: "Manzana",
    fechaEtiqueta: "Inicio de temporada",
    fechaAyuda: "El coeficiente de la manzana se cuenta desde el inicio de temporada.",
    variedades: ["Golden Delicious", "Red Delicious", "Gala", "Starking", "Anna"],
    coberturaPct: 75,
    profundidadCm: 100,
    plantasPorHa: 800,
    sistemaInicial: "goteo",
    resumen: "Frutal de hoja caduca. El Kc de plena estación llega a 1.20.",
  },
}

export const ORDEN_CULTIVOS: CultivoTipo[] = ["aji", "nogal", "maiz", "manzana"]

export type FichaSistema = {
  tipo: SistemaTipo
  nombre: string
  resumen: string
}

export const SISTEMAS: Record<SistemaTipo, FichaSistema> = {
  aspersion: {
    tipo: "aspersion",
    nombre: "Aspersión",
    resumen: "Cubre el lote. La eficiencia de referencia es más baja por viento y evaporación.",
  },
  microaspersion: {
    tipo: "microaspersion",
    nombre: "Microaspersión",
    resumen: "Moja un bulbo amplio bajo la planta, con menos pérdida que el aspersor grande.",
  },
  goteo: {
    tipo: "goteo",
    nombre: "Goteo",
    resumen: "Entrega el agua junto a la planta. La superficie mojada es la más estrecha.",
  },
}

export const ORDEN_SISTEMAS: SistemaTipo[] = ["goteo", "microaspersion", "aspersion"]

type ParametrosSistema = {
  caudalEmisorLph: number
  caudalPlantaLph: number
  eficienciaPct: number
  superficieMojadaPct: number
  anchoMojadoM: number
}

const SISTEMA_BASE: Record<CultivoTipo, Record<SistemaTipo, ParametrosSistema>> = {
  aji: {
    goteo: { caudalEmisorLph: 2, caudalPlantaLph: 2, eficienciaPct: 90, superficieMojadaPct: 40, anchoMojadoM: 0.4 },
    microaspersion: { caudalEmisorLph: 35, caudalPlantaLph: 35, eficienciaPct: 85, superficieMojadaPct: 70, anchoMojadoM: 2.5 },
    aspersion: { caudalEmisorLph: 1500, caudalPlantaLph: 2.4, eficienciaPct: 75, superficieMojadaPct: 100, anchoMojadoM: 12 },
  },
  maiz: {
    goteo: { caudalEmisorLph: 1.5, caudalPlantaLph: 1.5, eficienciaPct: 90, superficieMojadaPct: 45, anchoMojadoM: 0.35 },
    microaspersion: { caudalEmisorLph: 40, caudalPlantaLph: 8, eficienciaPct: 85, superficieMojadaPct: 75, anchoMojadoM: 3 },
    aspersion: { caudalEmisorLph: 1500, caudalPlantaLph: 0.8, eficienciaPct: 75, superficieMojadaPct: 100, anchoMojadoM: 12 },
  },
  nogal: {
    goteo: { caudalEmisorLph: 4, caudalPlantaLph: 24, eficienciaPct: 90, superficieMojadaPct: 30, anchoMojadoM: 1.2 },
    microaspersion: { caudalEmisorLph: 70, caudalPlantaLph: 70, eficienciaPct: 85, superficieMojadaPct: 55, anchoMojadoM: 4.5 },
    aspersion: { caudalEmisorLph: 1500, caudalPlantaLph: 384, eficienciaPct: 75, superficieMojadaPct: 100, anchoMojadoM: 18 },
  },
  manzana: {
    goteo: { caudalEmisorLph: 4, caudalPlantaLph: 12, eficienciaPct: 90, superficieMojadaPct: 35, anchoMojadoM: 1 },
    microaspersion: { caudalEmisorLph: 55, caudalPlantaLph: 55, eficienciaPct: 85, superficieMojadaPct: 60, anchoMojadoM: 4 },
    aspersion: { caudalEmisorLph: 1500, caudalPlantaLph: 75, eficienciaPct: 75, superficieMojadaPct: 100, anchoMojadoM: 14 },
  },
}

export function parametrosSistema(cultivo: CultivoTipo, sistema: SistemaTipo): ParametrosSistema {
  return { ...SISTEMA_BASE[cultivo][sistema] }
}

export function plantasSugeridas(cultivo: CultivoTipo, superficieHa: number): number {
  return Math.max(1, Math.round(CULTIVOS[cultivo].plantasPorHa * superficieHa))
}

export const TEXTURA_FICHA: Record<Textura, { nombre: string; mmPorM: number }> = {
  arena: { nombre: "Arena", mmPorM: 80 },
  franco_arenoso: { nombre: "Franco arenoso", mmPorM: 120 },
  franco: { nombre: "Franco", mmPorM: 170 },
  franco_limoso: { nombre: "Franco limoso", mmPorM: 200 },
  franco_arcilloso: { nombre: "Franco arcilloso", mmPorM: 180 },
  arcilla: { nombre: "Arcilla", mmPorM: 150 },
}

export const ORDEN_TEXTURAS: Textura[] = [
  "arena",
  "franco_arenoso",
  "franco",
  "franco_limoso",
  "franco_arcilloso",
  "arcilla",
]
