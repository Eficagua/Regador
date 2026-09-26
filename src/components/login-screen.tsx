"use client"

import { useFormStatus } from "react-dom"
import { entrarEjemplo } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Marca } from "@/components/brand"

export function LoginScreen() {
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
      <form action={entrarEjemplo} className="mt-10 grid gap-3">
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          La demostración entra con la cuenta de Ana Ruiz.
        </p>
        <EntrarButton />
      </form>
    </main>
  )
}

function EntrarButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="xl" disabled={pending}>
      {pending ? "Entrando…" : "Entrar con la cuenta de ejemplo"}
    </Button>
  )
}
