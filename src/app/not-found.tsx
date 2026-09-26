import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <h1 className="font-heading text-4xl">No está en la bitácora</h1>
      <p className="mt-2 text-sm text-muted-foreground">Ese lote o ese riego no existe en tu campo.</p>
      <Button asChild size="xl" className="mt-6">
        <Link href="/inicio">Ir al inicio</Link>
      </Button>
    </main>
  )
}
