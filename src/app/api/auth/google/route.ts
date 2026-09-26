import { NextResponse } from "next/server"
import { guardarEstado, nuevoEstado, origenApp, proveedoresConfigurados } from "@/lib/oauth"

export async function GET(request: Request) {
  if (!proveedoresConfigurados().google) {
    return NextResponse.redirect(new URL("/?error=config", origenApp(request)))
  }
  const state = nuevoEstado()
  await guardarEstado(state)
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "")
  url.searchParams.set("redirect_uri", `${origenApp(request)}/api/auth/google/callback`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("prompt", "select_account")
  return NextResponse.redirect(url)
}
