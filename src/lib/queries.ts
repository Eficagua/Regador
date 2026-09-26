import { redirect } from "next/navigation"
import { hoyDeCampo, syncEt0 } from "@/lib/et0"
import {
  balanceEnFecha,
  duracionSugeridaMin,
  kcEfectivo,
  type CultivoTipo,
  type SistemaTipo,
  type Textura,
} from "@/lib/irrigation"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { diffDays } from "@/lib/dates"

const loteInclude = {
  cultivo: true,
  suelo: true,
  sistema: true,
  riegos: { orderBy: [{ fecha: "desc" as const }, { createdAt: "desc" as const }] },
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect("/")
  return user
}

export async function campoDeUsuario(usuarioId: string) {
  return prisma.campo.findFirst({
    where: { usuarioId },
    include: {
      logros: { orderBy: { createdAt: "asc" } },
      lotes: { include: loteInclude, orderBy: { createdAt: "asc" } },
    },
  })
}

export type CampoCargado = NonNullable<Awaited<ReturnType<typeof campoDeUsuario>>>
export type LoteCargado = CampoCargado["lotes"][number]

export type LoteVista = {
  id: string
  nombre: string
  superficieHa: number
  plantas: number
  cultivo: CultivoTipo
  cultivoNombre: string
  variedad: string
  coberturaPct: number
  fechaInicio: string
  diasCultivo: number
  kcHoy: number
  sistema: SistemaTipo
  caudalEmisorLph: number
  caudalPlantaLph: number
  eficienciaPct: number
  superficieMojadaPct: number
  anchoMojadoM: number
  textura: Textura
  profundidadCm: number
  aguaDisponibleMm: number
  litrosDisponiblesPorPlanta: number
  ultimoRiego: string | null
  totalM3: number
  riegos: number
  remanenteMm: number
  fraccion: number
  depletionMm: number
  necesariosMm: number
  duracionSugeridaMin: number | null
  litrosRemanentesPorPlanta: number
  faltantes: number
  fechasRiego: string[]
}

export async function vistaDeCampo(usuarioId: string) {
  const campo = await campoDeUsuario(usuarioId)
  if (!campo) return null
  const hoy = hoyDeCampo()
  const inicios = campo.lotes
    .map((lote) => lote.cultivo?.fechaInicio)
    .filter((fecha): fecha is string => Boolean(fecha))
  const desde = inicios.reduce((min, fecha) => (fecha < min ? fecha : min), hoy)
  const et = await syncEt0(campo.id, campo.lat, campo.lng, desde, hoy)
  const lotes = campo.lotes.flatMap((lote) => {
    const vista = presentarLote(lote, et.days, hoy)
    return vista ? [vista] : []
  })
  const totalM3 = metrosDelCampo(campo)
  return { campo, lotes, totalM3, et, hoy }
}

export function presentarLote(
  lote: LoteCargado,
  et0: { fecha: string; et0Mm: number }[],
  hoy: string,
): LoteVista | null {
  if (!lote.cultivo || !lote.suelo || !lote.sistema) return null
  const tipo = lote.cultivo.tipo as CultivoTipo
  const fechasRiego = lote.riegos.map((riego) => riego.fecha)
  const balance = balanceEnFecha({
    fecha: hoy,
    fechaInicio: lote.cultivo.fechaInicio,
    fechasRiego,
    et0,
    tipo,
    coberturaPct: lote.cultivo.coberturaPct,
    aguaDisponibleMm: lote.suelo.aguaDisponibleMm,
    litrosDisponiblesPorPlanta: lote.suelo.litrosDisponiblesPorPlanta,
  })
  const ultimo = [...fechasRiego].sort().at(-1) ?? null
  return {
    id: lote.id,
    nombre: lote.nombre,
    superficieHa: lote.superficieHa,
    plantas: lote.plantas,
    cultivo: tipo,
    cultivoNombre: tipo,
    variedad: lote.cultivo.variedad,
    coberturaPct: lote.cultivo.coberturaPct,
    fechaInicio: lote.cultivo.fechaInicio,
    diasCultivo: Math.max(0, diffDays(lote.cultivo.fechaInicio, hoy)),
    kcHoy: kcEfectivo(tipo, Math.max(0, diffDays(lote.cultivo.fechaInicio, hoy)), lote.cultivo.coberturaPct),
    sistema: lote.sistema.tipo as SistemaTipo,
    caudalEmisorLph: lote.sistema.caudalEmisorLph,
    caudalPlantaLph: lote.sistema.caudalPlantaLph,
    eficienciaPct: lote.sistema.eficienciaPct,
    superficieMojadaPct: lote.sistema.superficieMojadaPct,
    anchoMojadoM: lote.sistema.anchoMojadoM,
    textura: lote.suelo.textura as Textura,
    profundidadCm: lote.suelo.profundidadCm,
    aguaDisponibleMm: lote.suelo.aguaDisponibleMm,
    litrosDisponiblesPorPlanta: lote.suelo.litrosDisponiblesPorPlanta,
    ultimoRiego: ultimo,
    totalM3: lote.riegos.reduce((suma, riego) => suma + riego.metrosCubicos, 0),
    riegos: lote.riegos.length,
    remanenteMm: balance.remanenteMm,
    fraccion: balance.fraccion,
    depletionMm: balance.depletionMm,
    necesariosMm: balance.necesariosMm,
    duracionSugeridaMin: duracionSugeridaMin({
      necesariosMm: balance.necesariosMm,
      superficieHa: lote.superficieHa,
      caudalPlantaLph: lote.sistema.caudalPlantaLph,
      plantas: lote.plantas,
      eficienciaPct: lote.sistema.eficienciaPct,
    }),
    litrosRemanentesPorPlanta: balance.litrosRemanentesPorPlanta,
    faltantes: balance.faltantes.length,
    fechasRiego,
  }
}

export function metrosDelCampo(campo: { lotes: { riegos: { metrosCubicos: number }[] }[] }): number {
  return campo.lotes.reduce(
    (suma, lote) => suma + lote.riegos.reduce((parcial, riego) => parcial + riego.metrosCubicos, 0),
    0,
  )
}

export async function loteDeUsuario(usuarioId: string, loteId: string) {
  const lote = await prisma.loteRiego.findFirst({
    where: { id: loteId, campo: { usuarioId } },
    include: {
      ...loteInclude,
      campo: { include: { logros: true, lotes: { include: { riegos: true } } } },
    },
  })
  return lote
}
