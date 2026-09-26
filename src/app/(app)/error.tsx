"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPantalla({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-0">
      <h1 className="font-heading text-3xl">No se pudo abrir esta pantalla</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Puede ser la conexión con el clima o un dato del campo. Vuelve a intentarlo.
      </p>
      <Button type="button" size="xl" className="mt-5" onClick={() => reset()}>
        Reintentar
      </Button>
    </main>
  )
}
