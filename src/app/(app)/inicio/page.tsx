import Link from "next/link"
import { redirect } from "next/navigation"
import { Flame, Plus } from "lucide-react"
import { siguienteLogro } from "@/lib/achievements"
import { CULTIVOS, SISTEMAS } from "@/lib/catalog"
import { formatoFecha, formatoM3, formatoNumero } from "@/lib/dates"
import { requireUser, vistaDeCampo } from "@/lib/queries"
import { CropIcon } from "@/components/crop-icon"
import { WaterBar } from "@/components/water-bar"
import { Button } from "@/components/ui/button"

export default async function InicioPage() {
  const user = await requireUser()
  const vista = await vistaDeCampo(user.id)
  if (!vista) redirect("/onboarding")
  const siguiente = siguienteLogro(vista.totalM3)
  const progreso = siguiente ? Math.min(1, vista.totalM3 / siguiente.umbralM3) : 1

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-0">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Campo</p>
          <h1 className="font-heading text-4xl tracking-tight">{vista.campo.nombre}</h1>
        </div>
        <p className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm ring-1 ring-foreground/10">
          <Flame className={user.rachaActual > 0 ? "size-4 text-streak" : "size-4 text-muted-foreground"} />
          {user.rachaActual > 0 ? `${user.rachaActual} días` : "Sin racha"}
        </p>
      </header>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        La racha suma cuando anotas un riego el mismo día. Se rompe si la fecha es anterior.
      </p>

      <Link href="/logros" className="mt-5 block rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Agua aplicada</p>
        <p className="font-heading text-3xl">{formatoM3(vista.totalM3)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-track">
          <div className="h-full rounded-full bg-leaf" style={{ width: `${progreso * 100}%` }} />
        </div>
        <p className="mt-2 text-sm">
          {siguiente
            ? `Siguiente logro: ${siguiente.categoria.toLowerCase()} ${siguiente.nombre}`
            : "Completaste los logros de agua equivalente."}
        </p>
      </Link>

      {vista.et.error ? (
        <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          No pudimos consultar la evapotranspiración en Open-Meteo. La barra puede quedar sin datos hasta que haya clima.
        </p>
      ) : null}

      {vista.lotes.length === 0 ? (
        <section className="mt-6 rounded-3xl bg-card px-5 py-8 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Todavía no hay lotes</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Un lote junta un cultivo, un suelo y un sistema de riego. El campo puede tener varios.
          </p>
          <Button asChild size="xl" className="mt-5">
            <Link href="/lotes/nuevo">Crear el primer lote</Link>
          </Button>
        </section>
      ) : (
        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {vista.lotes.map((lote) => {
            const pct = Math.round(lote.fraccion * 100)
            return (
              <article key={lote.id} className="flex flex-col rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex items-start gap-3">
                  <CropIcon tipo={lote.cultivo} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/lotes/${lote.id}`} className="font-heading text-xl tracking-tight">
                      {lote.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {CULTIVOS[lote.cultivo].nombre} · {lote.variedad}
                    </p>
                    <p className="text-sm text-muted-foreground">{SISTEMAS[lote.sistema].nombre}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm">
                  {lote.ultimoRiego ? `Riego previo: ${formatoFecha(lote.ultimoRiego)}` : "Sin riegos registrados"}
                </p>
                <div className="mt-3">
                  <WaterBar fraccion={lote.fraccion} />
                </div>
                <p className="mt-2 text-sm">
                  {formatoNumero(lote.remanenteMm, 1)} mm de {formatoNumero(lote.aguaDisponibleMm, 1)} mm · {pct}%
                </p>
                {lote.faltantes > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">Faltan {lote.faltantes} días de ET0 en este periodo.</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">{formatoM3(lote.totalM3)} acumulados</p>
                <Button asChild size="xl" className="mt-4">
                  <Link href={`/lotes/${lote.id}/regar`}>Anotar riego</Link>
                </Button>
              </article>
            )
          })}
          <Link
            href="/lotes/nuevo"
            className="flex min-h-40 items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/40 px-4 py-8 text-sm text-muted-foreground"
          >
            <Plus className="size-4" />
            Nuevo lote
          </Link>
        </section>
      )}
    </main>
  )
}
