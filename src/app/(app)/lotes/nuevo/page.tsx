import { redirect } from "next/navigation"
import { LoteWizard } from "@/components/lote-wizard"
import { campoDeUsuario, requireUser } from "@/lib/queries"

export default async function NuevoLotePage() {
  const user = await requireUser()
  const campo = await campoDeUsuario(user.id)
  if (!campo) redirect("/onboarding")

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 md:px-0">
      <LoteWizard nombreInicial={`Lote ${campo.lotes.length + 1}`} campoNombre={campo.nombre} />
    </main>
  )
}
