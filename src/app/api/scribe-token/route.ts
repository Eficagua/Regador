import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"

export async function POST() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para dictar comentarios." }, { status: 401 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ELEVENLABS_API_KEY en el servidor. Agrégala en .env para dictar comentarios." },
      { status: 503 },
    )
  }

  let respuesta: Response
  try {
    respuesta = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { error: "No pudimos contactar a ElevenLabs para pedir el token." },
      { status: 502 },
    )
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null)
    return NextResponse.json({ error: mensajeElevenLabs(detalle) }, { status: 502 })
  }

  const data = (await respuesta.json().catch(() => null)) as { token?: string } | null
  if (!data?.token) {
    return NextResponse.json({ error: "La respuesta de ElevenLabs no incluyó un token." }, { status: 502 })
  }

  return NextResponse.json({ token: data.token })
}

function mensajeElevenLabs(detalle: unknown): string {
  const mensaje = textoError(detalle)
  if (/speech_to_text|missing_permissions/i.test(mensaje)) {
    return "La clave de ElevenLabs no tiene permiso de speech-to-text. Actívalo en la clave y vuelve a intentar."
  }
  return "ElevenLabs no entregó el token de transcripción."
}

function textoError(detalle: unknown): string {
  if (!detalle || typeof detalle !== "object") return ""
  const detail = "detail" in detalle ? detalle.detail : detalle
  if (typeof detail === "string") return detail
  if (!detail || typeof detail !== "object") return ""
  const partes = ["message", "code", "status"].map((clave) => {
    const valor = clave in detail ? detail[clave as keyof typeof detail] : ""
    return typeof valor === "string" ? valor : ""
  })
  return partes.join(" ")
}
