import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
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

export async function establecerSesion(userId: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, firmarSesion(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  })
}

export async function cerrarSesion() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function getSessionUser() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = leerSesion(token)
  if (!userId) return null
  return prisma.usuario.findUnique({ where: { id: userId } })
}
