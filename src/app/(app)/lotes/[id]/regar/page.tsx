import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { CULTIVOS } from "@/lib/catalog"
import { formatoFecha } from "@/lib/dates"
import { hoyDeCampo, syncEt0 } from "@/lib/et0"
import type { CultivoTipo } from "@/lib/irrigation"
import { loteDeUsuario, requireUser } from "@/lib/queries"
import { RegarForm } from "@/components/regar-form"

export default async function RegarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const lote = await loteDeUsuario(user.id, id)
  if (!lote || !lote.cultivo || !lote.suelo || !lote.sistema) notFound()
  const hoy = hoyDeCampo()
  const tipo = lote.cultivo.tipo as CultivoTipo
  if (lote.cultivo.fechaInicio > hoy) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-6 md:px-0">
        <Link href={`/lotes/${lote.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" />
          {lote.nombre}
        </Link>
        <h1 className="mt-3 font-heading text-4xl tracking-tight">Anotar riego</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {CULTIVOS[tipo].nombre} empieza el {formatoFecha(lote.cultivo.fechaInicio)}. Podrás anotar un riego a partir de ese día.
        </p>
      </main>
    )
  }
  const et = await syncEt0(lote.campoId, lote.campo.lat, lote.campo.lng, lote.cultivo.fechaInicio, hoy)

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 md:px-0">
      <Link href={`/lotes/${lote.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        {lote.nombre}
      </Link>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">Anotar riego</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lote.nombre} · {CULTIVOS[tipo].nombre} · {lote.cultivo.variedad}
      </p>
      <div className="mt-5">
        <RegarForm
          climaError={et.error}
          et0={et.days}
          lote={{
            id: lote.id,
            nombre: lote.nombre,
            fechaInicio: lote.cultivo.fechaInicio,
            fechasRiego: lote.riegos.map((riego) => riego.fecha),
            superficieHa: lote.superficieHa,
            plantas: lote.plantas,
            coberturaPct: lote.cultivo.coberturaPct,
            aguaDisponibleMm: lote.suelo.aguaDisponibleMm,
            litrosDisponiblesPorPlanta: lote.suelo.litrosDisponiblesPorPlanta,
            caudalPlantaLph: lote.sistema.caudalPlantaLph,
            eficienciaPct: lote.sistema.eficienciaPct,
            hoy,
            cultivo: tipo,
          }}
        />
      </div>
    </main>
  )
}
