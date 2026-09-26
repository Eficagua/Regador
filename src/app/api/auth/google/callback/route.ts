import { NextResponse } from "next/server"
import { consumirEstado, entrarConPerfil, intercambiarGoogle, origenApp } from "@/lib/oauth"

export async function GET(request: Request) {
  const origen = origenApp(request)
  const url = new URL(request.url)
  const error = url.searchParams.get("error")
  if (error) return NextResponse.redirect(new URL("/?error=acceso", origen))
  const stateOk = await consumirEstado(url.searchParams.get("state"))
  if (!stateOk) return NextResponse.redirect(new URL("/?error=estado", origen))
  const code = url.searchParams.get("code")
  if (!code) return NextResponse.redirect(new URL("/?error=acceso", origen))
  try {
    const perfil = await intercambiarGoogle(code, `${origen}/api/auth/google/callback`)
    const destino = await entrarConPerfil({
      email: perfil.email,
      nombre: perfil.nombre,
      proveedor: "google",
    })
    return NextResponse.redirect(new URL(destino, origen))
  } catch (causa) {
    const codigo = causa instanceof Error && causa.message.includes("correo") ? "correo" : "acceso"
    return NextResponse.redirect(new URL(`/?error=${codigo}`, origen))
  }
}
