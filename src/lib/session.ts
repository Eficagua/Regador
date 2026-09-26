import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies, headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export const SESSION_COOKIE = "lamina_session"

function secret(): string {
  return process.env.SESSION_SECRET || "lamina-dev-session-secret"
}

export function firmarSesion(userId: string): string {
  const firma = createHmac("sha256", secret()).update(userId).digest("base64url")
  return `${userId}.${firma}`
}

export function leerSesion(token: string): string | null {
  const corte = token.lastIndexOf(".")
  if (corte <= 0) return null
  const userId = token.slice(0, corte)
  const firma = token.slice(corte + 1)
  const esperada = createHmac("sha256", secret()).update(userId).digest("base64url")
  const recibida = Buffer.from(firma)
  const valida = Buffer.from(esperada)
  if (recibida.length !== valida.length || !timingSafeEqual(recibida, valida)) return null
  return userId
}

async function opcionesCookie() {
  const cabeceras = await headers()
  const proto = cabeceras.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const host = `${cabeceras.get("x-forwarded-host") ?? ""} ${cabeceras.get("host") ?? ""}`
  const https = proto === "https" || host.includes("agent.cvm.dev") || host.includes("cursorvm.com")
  return {
    httpOnly: true,
    path: "/",
    sameSite: https ? ("none" as const) : ("lax" as const),
    secure: https || process.env.NODE_ENV === "production",
    partitioned: https,
    maxAge: 60 * 60 * 24 * 60,
  }
}

export async function establecerSesion(userId: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, firmarSesion(userId), await opcionesCookie())
}

export async function cerrarSesion() {
  const jar = await cookies()
  const opciones = await opcionesCookie()
  jar.set(SESSION_COOKIE, "", { ...opciones, maxAge: 0 })
}

const CORREO_EJEMPLO = "ejemplo@lamina.test"

async function esVisor(): Promise<boolean> {
  const cabeceras = await headers()
  const host = `${cabeceras.get("x-forwarded-host") ?? ""} ${cabeceras.get("host") ?? ""}`
  return host.includes("cursorvm.com") || host.includes("agent.cvm.dev")
}

export async function getSessionUser() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    const userId = leerSesion(token)
    if (userId) {
      const usuario = await prisma.usuario.findUnique({ where: { id: userId } })
      if (usuario) return usuario
    }
  }
  // El visor no reenvía cookies. La demostración entra con la cuenta de ejemplo.
  if (!(await esVisor())) return null
  return prisma.usuario.findUnique({ where: { email: CORREO_EJEMPLO } })
}
