"use client"

import { useState } from "react"
import { useActionState } from "react"
import { entrarDemo } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Marca } from "@/components/brand"

const errores: Record<string, string> = {
  acceso: "No pudimos completar el acceso. Intenta otra vez.",
  estado: "La verificación del proveedor expiró. Vuelve a intentar.",
  correo: "El proveedor no compartió un correo.",
  config: "Ese proveedor todavía no tiene credenciales. Entra con una sesión local.",
}

export function LoginScreen({ error }: { error?: string }) {
  const [proveedor, setProveedor] = useState<"google" | "apple" | null>(null)
  const [cargando, setCargando] = useState<"google" | "apple" | null>(null)
  const [state, action, pending] = useActionState(entrarDemo, null)

  async function elegir(siguiente: "google" | "apple") {
    setCargando(siguiente)
    try {
      const respuesta = await fetch("/api/auth/providers")
      const data = (await respuesta.json()) as { google?: boolean; apple?: boolean }
      if (data[siguiente]) {
        window.location.href = siguiente === "google" ? "/api/auth/google" : "/api/auth/apple"
        return
      }
      setProveedor(siguiente)
    } catch {
      setProveedor(siguiente)
    } finally {
      setCargando(null)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-6 py-10">
      <div>
        <Marca />
        <h1 className="mt-10 font-heading text-5xl leading-none tracking-tight text-water-deep">
          La bitácora de riego de tu campo
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Ubica el campo, arma los lotes de ají, nogal, maíz o manzana, y anota cada riego contra el agua que todavía guarda el suelo.
        </p>
        <ul className="mt-8 grid gap-3 text-sm">
          <li className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">La barra azul es el agua disponible. Se vacía con la evapotranspiración.</li>
          <li className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">Al anotar un riego, el conteo vuelve a empezar y recibes una puntuación.</li>
        </ul>
      </div>
      <div className="mt-10 grid gap-3">
        {error && errores[error] ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{errores[error]}</p>
        ) : null}
        <Button type="button" variant="outline" size="xl" className="bg-card" onClick={() => elegir("google")} disabled={cargando !== null}>
          <GoogleMark />
          {cargando === "google" ? "Conectando…" : "Continuar con Google"}
        </Button>
        <Button type="button" size="xl" className="bg-black text-white hover:bg-black/90" onClick={() => elegir("apple")} disabled={cargando !== null}>
          <AppleMark />
          {cargando === "apple" ? "Conectando…" : "Continuar con Apple"}
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Si Google o Apple están configurados, el acceso es el de tu cuenta. Si no, se abre una sesión local en este dispositivo.
        </p>
      </div>
      <Dialog open={proveedor !== null} onOpenChange={(open) => !open && setProveedor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{proveedor === "apple" ? "Continuar con Apple" : "Continuar con Google"}</DialogTitle>
            <DialogDescription>
              Esta demo no contacta al proveedor. Guarda tu nombre y correo solo en la base local.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-3">
            <input type="hidden" name="proveedor" value={proveedor ?? "google"} />
            <div className="grid gap-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required minLength={2} placeholder="Ana Ruiz" className="h-11" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" required placeholder="ana@correo.com" className="h-11" />
            </div>
            {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" size="xl" disabled={pending}>
              {pending ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.7 18.8 23 15.8 23 12.3z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3h3.8A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.1 14.3A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.6.4-2.3v-3H1.3A12 12 0 0 0 0 12c0 1.9.5 3.7 1.3 5.3l3.8-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.3 6.7l3.8 3C6.1 7 8.8 4.8 12 4.8z" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c.7-1 1.2-2.1 1.5-3.2-3.9-1.5-3.8-5.3-3.8-5.3zM14.7 6.5c.6-.8 1.1-1.9.9-3-1 .1-2.1.6-2.8 1.4-.6.7-1.2 1.8-.9 2.9 1.1.1 2.1-.5 2.8-1.3z" />
    </svg>
  )
}
