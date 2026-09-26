import { NextResponse } from "next/server"
import { guardarEstado, nuevoEstado, origenApp, proveedoresConfigurados } from "@/lib/oauth"

export async function GET(request: Request) {
  if (!proveedoresConfigurados().apple) {
    return NextResponse.redirect(new URL("/?error=config", origenApp(request)))
  }
  const state = nuevoEstado()
  await guardarEstado(state)
  const url = new URL("https://appleid.apple.com/auth/authorize")
  url.searchParams.set("client_id", process.env.APPLE_CLIENT_ID || "")
  url.searchParams.set("redirect_uri", `${origenApp(request)}/api/auth/apple/callback`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("response_mode", "form_post")
  url.searchParams.set("scope", "name email")
  url.searchParams.set("state", state)
  return NextResponse.redirect(url)
}
