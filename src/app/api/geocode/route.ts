import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Sin sesión." }, { status: 401 })
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (q.length < 3) return NextResponse.json({ resultados: [] })
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("q", q)
  url.searchParams.set("limit", "5")
  const respuesta = await fetch(url, {
    headers: {
      "User-Agent": "regador/0.1 (bitacora de riego)",
      "Accept-Language": "es",
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  })
  if (!respuesta.ok) {
    return NextResponse.json({ error: "No se pudo buscar el lugar." }, { status: 502 })
  }
  const cuerpo = (await respuesta.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>
  const resultados = cuerpo.flatMap((lugar) => {
    const lat = Number(lugar.lat)
    const lng = Number(lugar.lon)
    if (!lugar.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) return []
    return [{ nombre: lugar.display_name, lat, lng }]
  })
  return NextResponse.json({ resultados })
}
