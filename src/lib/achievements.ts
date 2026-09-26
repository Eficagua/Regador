export const CATEGORIAS_LOGRO = [
  "Embalse",
  "Reservorio",
  "Represa",
  "Presa",
  "Laguna",
  "Lago",
] as const

export type CategoriaLogro = (typeof CATEGORIAS_LOGRO)[number]

export type LogroDef = {
  codigo: string
  nombre: string
  categoria: CategoriaLogro
  lugar: string
  umbralM3: number
  relato: string
}

/**
 * Marcas de agua equivalente. El umbral es el consumo acumulado del campo,
 * no el volumen real del cuerpo de agua: el logro toma su nombre.
 */
export const LOGROS: readonly LogroDef[] = [
  {
    codigo: "presa-san-jose",
    nombre: "Presa San José",
    categoria: "Embalse",
    lugar: "San Luis Potosí",
    umbralM3: 50,
    relato: "Embalse de mampostería en la ciudad de San Luis Potosí.",
  },
  {
    codigo: "presa-el-palote",
    nombre: "Presa El Palote",
    categoria: "Embalse",
    lugar: "León, Guanajuato",
    umbralM3: 400,
    relato: "Embalse al norte de León, sobre el río de los Gómez.",
  },
  {
    codigo: "presa-madin",
    nombre: "Presa Madín",
    categoria: "Reservorio",
    lugar: "Estado de México",
    umbralM3: 1_200,
    relato: "Reservorio entre Naucalpan y Atizapán, en el sistema metropolitano.",
  },
  {
    codigo: "presa-valle-de-bravo",
    nombre: "Presa Valle de Bravo",
    categoria: "Reservorio",
    lugar: "Valle de Bravo, Estado de México",
    umbralM3: 3_000,
    relato: "Reservorio del Sistema Cutzamala, en el valle de Bravo.",
  },
  {
    codigo: "presa-solis",
    nombre: "Presa Solís",
    categoria: "Represa",
    lugar: "Acámbaro, Guanajuato",
    umbralM3: 7_000,
    relato: "Represa de riego sobre el río Lerma, en Acámbaro.",
  },
  {
    codigo: "presa-tepuxtepec",
    nombre: "Presa Tepuxtepec",
    categoria: "Represa",
    lugar: "Contepec, Michoacán",
    umbralM3: 15_000,
    relato: "Represa del alto Lerma, en Contepec.",
  },
  {
    codigo: "presa-endho",
    nombre: "Presa Endhó",
    categoria: "Presa",
    lugar: "Hidalgo",
    umbralM3: 30_000,
    relato: "Presa de riego del valle del Mezquital.",
  },
  {
    codigo: "presa-temascal",
    nombre: "Presa Miguel Alemán",
    categoria: "Presa",
    lugar: "Temascal, Oaxaca",
    umbralM3: 60_000,
    relato: "Presa Temascal, sobre el río Tonto.",
  },
  {
    codigo: "laguna-yuriria",
    nombre: "Laguna de Yuriria",
    categoria: "Laguna",
    lugar: "Yuriria, Guanajuato",
    umbralM3: 120_000,
    relato: "Laguna artificial del siglo XVI en el Bajío.",
  },
  {
    codigo: "laguna-catemaco",
    nombre: "Laguna de Catemaco",
    categoria: "Laguna",
    lugar: "Catemaco, Veracruz",
    umbralM3: 250_000,
    relato: "Laguna volcánica de Los Tuxtlas.",
  },
  {
    codigo: "lago-patzcuaro",
    nombre: "Lago de Pátzcuaro",
    categoria: "Lago",
    lugar: "Pátzcuaro, Michoacán",
    umbralM3: 500_000,
    relato: "Lago del altiplano purépecha.",
  },
  {
    codigo: "lago-chapala",
    nombre: "Lago de Chapala",
    categoria: "Lago",
    lugar: "Jalisco y Michoacán",
    umbralM3: 1_000_000,
    relato: "El lago más grande de México.",
  },
]

export function logroPorCodigo(codigo: string): LogroDef | undefined {
  return LOGROS.find((logro) => logro.codigo === codigo)
}

export function logrosAlcanzados(totalM3: number, yaDesbloqueados: readonly string[]): LogroDef[] {
  const previos = new Set(yaDesbloqueados)
  return LOGROS.filter((logro) => totalM3 >= logro.umbralM3 && !previos.has(logro.codigo))
}

export function siguienteLogro(totalM3: number): LogroDef | null {
  return LOGROS.find((logro) => totalM3 < logro.umbralM3) ?? null
}
