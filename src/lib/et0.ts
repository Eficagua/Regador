import { addDays, eachDate, todayISO } from "@/lib/dates"
import { prisma } from "@/lib/prisma"

export type Et0Dia = { fecha: string; et0Mm: number }

const FRESCURA_MS = 3 * 60 * 60 * 1000

export async function syncEt0(
  campoId: string,
  lat: number,
  lng: number,
  desde: string,
  hasta: string,
): Promise<{ days: Et0Dia[]; error: string | null }> {
  const inicio = desde < addDays(hasta, -790) ? addDays(hasta, -790) : desde
  const existentes = await prisma.et0Diario.findMany({
    where: { campoId, fecha: { gte: inicio, lte: hasta } },
  })
  const porFecha = new Map(existentes.map((dia) => [dia.fecha, dia]))
  const esperados = eachDate(inicio, hasta)
  const ayer = addDays(hasta, -1)
  const ahora = Date.now()
  const faltan = esperados.filter((fecha) => {
    const guardado = porFecha.get(fecha)
    if (!guardado) return true
    if (fecha === hasta || fecha === ayer) {
      return ahora - guardado.updatedAt.getTime() > FRESCURA_MS
    }
    return false
  })

  let error: string | null = null
  if (faltan.length > 0) {
    try {
      const traidos = await descargarEt0(lat, lng, faltan, hasta)
      if (traidos.length > 0) {
        await prisma.$transaction(
          traidos.map((dia) =>
            prisma.et0Diario.upsert({
              where: { campoId_fecha: { campoId, fecha: dia.fecha } },
              update: { et0Mm: dia.et0Mm },
              create: { campoId, fecha: dia.fecha, et0Mm: dia.et0Mm },
            }),
          ),
        )
      }
    } catch (causa) {
      error = causa instanceof Error ? causa.message : "No se pudo consultar Open-Meteo."
    }
  }

  const dias = await prisma.et0Diario.findMany({
    where: { campoId, fecha: { gte: inicio, lte: hasta } },
    orderBy: { fecha: "asc" },
  })
  if (dias.length === 0 && error) {
    return { days: [], error }
  }
  return {
    days: dias.map((dia) => ({ fecha: dia.fecha, et0Mm: dia.et0Mm })),
    error: dias.length === 0 ? error : null,
  }
}

async function descargarEt0(
  lat: number,
  lng: number,
  faltan: string[],
  hoy: string,
): Promise<Et0Dia[]> {
  const ventana = addDays(hoy, -92)
  const necesitaPronostico = faltan.some((fecha) => fecha >= ventana)
  const antiguos = faltan.filter((fecha) => fecha < ventana)
  const unidos = new Map<string, number>()

  if (necesitaPronostico) {
    const url = new URL("https://api.open-meteo.com/v1/forecast")
    url.searchParams.set("latitude", String(lat))
    url.searchParams.set("longitude", String(lng))
    url.searchParams.set("daily", "et0_fao_evapotranspiration")
    url.searchParams.set("timezone", "auto")
    url.searchParams.set("past_days", "92")
    url.searchParams.set("forecast_days", "1")
    mezclar(unidos, await pedirSerie(url))
  }

  if (antiguos.length > 0) {
    const desde = antiguos.reduce((min, fecha) => (fecha < min ? fecha : min), antiguos[0])
    const finArchivo = addDays(ventana, -1)
    if (desde <= finArchivo) {
      const url = new URL("https://archive-api.open-meteo.com/v1/archive")
      url.searchParams.set("latitude", String(lat))
      url.searchParams.set("longitude", String(lng))
      url.searchParams.set("start_date", desde)
      url.searchParams.set("end_date", finArchivo)
      url.searchParams.set("daily", "et0_fao_evapotranspiration")
      url.searchParams.set("timezone", "auto")
      mezclar(unidos, await pedirSerie(url))
    }
  }

  const pedidos = new Set(faltan)
  return [...unidos.entries()]
    .filter(([fecha]) => pedidos.has(fecha))
    .map(([fecha, et0Mm]) => ({ fecha, et0Mm }))
}

function mezclar(destino: Map<string, number>, serie: Et0Dia[]) {
  for (const dia of serie) destino.set(dia.fecha, dia.et0Mm)
}

async function pedirSerie(url: URL): Promise<Et0Dia[]> {
  const respuesta = await fetch(url, {
    headers: { "User-Agent": "Lamina/0.1 (bitacora de riego)" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  })
  if (!respuesta.ok) {
    throw new Error(`Open-Meteo respondió ${respuesta.status}.`)
  }
  const cuerpo = (await respuesta.json()) as {
    daily?: { time?: string[]; et0_fao_evapotranspiration?: Array<number | null> }
  }
  const fechas = cuerpo.daily?.time ?? []
  const valores = cuerpo.daily?.et0_fao_evapotranspiration ?? []
  const serie: Et0Dia[] = []
  fechas.forEach((fecha, index) => {
    const valor = valores[index]
    if (typeof valor === "number" && Number.isFinite(valor)) {
      serie.push({ fecha, et0Mm: valor })
    }
  })
  return serie
}

export function hoyDeCampo(): string {
  return todayISO()
}
