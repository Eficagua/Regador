import { redirect } from "next/navigation"
import { CampoForm } from "@/components/campo-form"
import { LoteWizard } from "@/components/lote-wizard"
import { Marca } from "@/components/brand"
import { campoDeUsuario, requireUser } from "@/lib/queries"

export default async function OnboardingPage() {
  const user = await requireUser()
  const campo = await campoDeUsuario(user.id)
  if (campo && campo.lotes.length > 0) redirect("/inicio")

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Marca />
      {campo ? (
        <div className="mt-8">
          <LoteWizard nombreInicial="Lote 1" campoNombre={campo.nombre} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          <div>
            <p className="text-sm text-water-deep">Paso 1 de 2</p>
            <h1 className="font-heading text-4xl tracking-tight">¿Dónde está tu campo?</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Esa ubicación es la referencia para estimar la evapotranspiración. Después vas a crear el primer lote de riego.
            </p>
          </div>
          <CampoForm modo="crear" />
        </div>
      )}
    </main>
  )
}
