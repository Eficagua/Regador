import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { logroPorCodigo } from "@/lib/achievements"
import { textoPuntuacion, textoRacha } from "@/lib/copy"
import { formatoDuracion, formatoFecha, formatoM3, formatoNumero } from "@/lib/dates"
import type { MotivoRiego, ResultadoRiego } from "@/lib/irrigation"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/queries"
import { Button } from "@/components/ui/button"

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ id: string; riegoId: string }>
}) {
  const { id, riegoId } = await params
  const user = await requireUser()
  const riego = await prisma.riego.findFirst({
    where: { id: riegoId, loteId: id, lote: { campo: { usuarioId: user.id } } },
    include: { lote: true },
  })
  if (!riego) notFound()
  const texto = textoPuntuacion({
    resultado: riego.resultado as ResultadoRiego,
    motivo: riego.motivo as MotivoRiego,
    mmAplicados: riego.mmAplicados,
    mmNecesarios: riego.mmNecesarios,
    mmDeficitAntes: riego.mmDeficitAntes,
  })
  const logros = leerLogros(riego.logrosJson)
  const adecuado = riego.resultado === "adecuado"

  return (
    <main className="mx-auto grid w-full max-w-xl gap-4 px-4 py-6 md:px-0">
      <Link href={`/lotes/${riego.loteId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        {riego.lote.nombre}
      </Link>
      <section className={`rounded-3xl p-5 ring-1 ring-foreground/10 ${adecuado ? "bg-[#e7f6ee]" : "bg-[#fdecea]"}`}>
        <p className="text-sm">{texto.titulo}</p>
        <p className={`font-heading text-7xl tracking-tight ${adecuado ? "text-leaf" : "text-destructive"}`}>
          {riego.puntuacion}
        </p>
        <p className="text-sm text-muted-foreground">de 100</p>
        <p className="mt-3 text-sm leading-relaxed">{texto.detalle}</p>
      </section>
      <section className="rounded-3xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <p>{formatoFecha(riego.fecha)} · {formatoDuracion(riego.duracionMin)}</p>
        <p className="mt-2">
          {formatoNumero(riego.mmAplicados, 1)} mm netos aplicados · {formatoNumero(riego.mmNecesarios, 1)} mm que el suelo podía recibir
        </p>
        <p className="mt-1 text-muted-foreground">
          Evapotranspiración acumulada antes del riego: {formatoNumero(riego.mmDeficitAntes, 1)} mm. Volumen de este riego: {formatoM3(riego.metrosCubicos)}.
        </p>
        {riego.descripcionInsumos ? <p className="mt-3">Comentario: {riego.descripcionInsumos}</p> : null}
      </section>
      <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl">Racha</h2>
        <p className="mt-2 text-sm leading-relaxed">
          {textoRacha({
            rachaRota: riego.rachaRota,
            rachaAntes: riego.rachaAntes,
            rachaResultante: riego.rachaResultante,
          })}
        </p>
      </section>
      {logros.length > 0 ? (
        <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl">Logros nuevos</h2>
          <ul className="mt-3 grid gap-3">
            {logros.map((logro) => (
              <li key={logro.codigo}>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">{logro.categoria}</p>
                <p className="font-heading text-2xl">{logro.nombre}</p>
                <p className="text-sm text-muted-foreground">{logro.lugar}. {logro.relato}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="flex gap-2">
        <Button asChild size="xl" className="flex-1">
          <Link href="/inicio">Volver al inicio</Link>
        </Button>
        <Button asChild variant="outline" size="xl" className="bg-card">
          <Link href="/logros">Ver logros</Link>
        </Button>
      </div>
    </main>
  )
}

function leerLogros(json: string) {
  try {
    const codigos = JSON.parse(json) as unknown
    if (!Array.isArray(codigos)) return []
    return codigos.flatMap((codigo) => {
      if (typeof codigo !== "string") return []
      const logro = logroPorCodigo(codigo)
      return logro ? [logro] : []
    })
  } catch {
    return []
  }
}
