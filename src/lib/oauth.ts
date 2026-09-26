import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { establecerSesion } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const STATE_COOKIE = "lamina_oauth_state"
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"))

export function proveedoresConfigurados() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(
      process.env.APPLE_CLIENT_ID &&
        process.env.APPLE_TEAM_ID &&
        process.env.APPLE_KEY_ID &&
        process.env.APPLE_PRIVATE_KEY,
    ),
  }
}

export function origenApp(request: Request): string {
  return process.env.APP_URL || new URL(request.url).origin
}

export async function guardarEstado(state: string) {
  const jar = await cookies()
  jar.set(STATE_COOKIE, firmarEstado(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  })
}

export async function consumirEstado(state: string | null): Promise<boolean> {
  if (!state) return false
  const jar = await cookies()
  const token = jar.get(STATE_COOKIE)?.value
  jar.delete(STATE_COOKIE)
  if (!token) return false
  const esperado = leerEstado(token)
  if (!esperado) return false
  const a = Buffer.from(state)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function nuevoEstado(): string {
  return randomBytes(16).toString("base64url")
}

export async function entrarConPerfil(input: {
  email: string
  nombre: string
  proveedor: "google" | "apple"
}) {
  const email = input.email.trim().toLowerCase()
  const nombre = input.nombre.trim()
  const existente = await prisma.usuario.findUnique({ where: { email } })
  const usuario = existente
    ? await prisma.usuario.update({
        where: { id: existente.id },
        data: { nombre: nombre || existente.nombre, proveedor: input.proveedor },
      })
    : await prisma.usuario.create({
        data: { email, nombre, proveedor: input.proveedor },
      })
  await establecerSesion(usuario.id)
  const campo = await prisma.campo.findFirst({ where: { usuarioId: usuario.id } })
  return campo ? "/inicio" : "/onboarding"
}

export async function intercambiarGoogle(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  })
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!tokenRes.ok) throw new Error("Google no entregó el acceso.")
  const token = (await tokenRes.json()) as { access_token?: string }
  if (!token.access_token) throw new Error("Google no entregó el acceso.")
  const perfilRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
  if (!perfilRes.ok) throw new Error("Google no compartió el perfil.")
  const perfil = (await perfilRes.json()) as { email?: string; name?: string }
  if (!perfil.email) throw new Error("Google no compartió un correo.")
  return { email: perfil.email, nombre: perfil.name || perfil.email }
}

export async function intercambiarApple(code: string, redirectUri: string) {
  const clientSecret = await secretoApple()
  const body = new URLSearchParams({
    code,
    client_id: process.env.APPLE_CLIENT_ID || "",
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  })
  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!tokenRes.ok) throw new Error("Apple no entregó el acceso.")
  const token = (await tokenRes.json()) as { id_token?: string }
  if (!token.id_token) throw new Error("Apple no entregó el acceso.")
  const { payload } = await jwtVerify(token.id_token, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_CLIENT_ID,
  })
  const email = typeof payload.email === "string" ? payload.email : ""
  if (!email) throw new Error("Apple no compartió un correo.")
  return { email }
}

export function nombreApple(userJson: string | undefined, email: string): string {
  if (!userJson) return email.split("@")[0] || "Productor"
  try {
    const user = JSON.parse(userJson) as { name?: { firstName?: string; lastName?: string } }
    const nombre = [user.name?.firstName, user.name?.lastName].filter(Boolean).join(" ")
    return nombre || email.split("@")[0] || "Productor"
  } catch {
    return email.split("@")[0] || "Productor"
  }
}

async function secretoApple(): Promise<string> {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
  const key = await importPKCS8(privateKey, "ES256")
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID || "")
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience("https://appleid.apple.com")
    .setSubject(process.env.APPLE_CLIENT_ID || "")
    .sign(key)
}

function firmarEstado(state: string): string {
  const firma = createHmac("sha256", process.env.SESSION_SECRET || "lamina-dev-session-secret")
    .update(state)
    .digest("base64url")
  return `${state}.${firma}`
}

function leerEstado(token: string): string | null {
  const corte = token.lastIndexOf(".")
  if (corte <= 0) return null
  const state = token.slice(0, corte)
  const firma = token.slice(corte + 1)
  const esperada = createHmac("sha256", process.env.SESSION_SECRET || "lamina-dev-session-secret")
    .update(state)
    .digest("base64url")
  const a = Buffer.from(firma)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return state
}
