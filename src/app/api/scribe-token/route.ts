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
    return NextResponse.json(
      { error: "ElevenLabs no entregó el token de transcripción." },
      { status: 502 },
    )
  }

  const data = (await respuesta.json().catch(() => null)) as { token?: string } | null
  if (!data?.token) {
    return NextResponse.json({ error: "La respuesta de ElevenLabs no incluyó un token." }, { status: 502 })
  }

  return NextResponse.json({ token: data.token })
}
