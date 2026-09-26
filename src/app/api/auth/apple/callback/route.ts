import { NextResponse } from "next/server"
import { consumirEstado, entrarConPerfil, intercambiarApple, nombreApple, origenApp } from "@/lib/oauth"

async function completar(request: Request) {
  const origen = origenApp(request)
  const form = await request.formData().catch(() => null)
  const url = new URL(request.url)
  const code = form?.get("code")?.toString() || url.searchParams.get("code")
  const state = form?.get("state")?.toString() || url.searchParams.get("state")
  const userJson = form?.get("user")?.toString()
  const error = form?.get("error")?.toString() || url.searchParams.get("error")
  if (error || !code) return NextResponse.redirect(new URL("/?error=acceso", origen))
  const stateOk = await consumirEstado(state ?? null)
  if (!stateOk) return NextResponse.redirect(new URL("/?error=estado", origen))
  try {
    const perfil = await intercambiarApple(code, `${origen}/api/auth/apple/callback`)
    const destino = await entrarConPerfil({
      email: perfil.email,
      nombre: nombreApple(userJson, perfil.email),
      proveedor: "apple",
    })
    return NextResponse.redirect(new URL(destino, origen))
  } catch (causa) {
    const codigo = causa instanceof Error && causa.message.includes("correo") ? "correo" : "acceso"
    return NextResponse.redirect(new URL(`/?error=${codigo}`, origen))
  }
}

export function POST(request: Request) {
  return completar(request)
}

export function GET(request: Request) {
  return completar(request)
}
