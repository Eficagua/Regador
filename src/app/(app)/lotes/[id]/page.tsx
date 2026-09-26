import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { CULTIVOS, SISTEMAS, TEXTURA_FICHA } from "@/lib/catalog"
import { formatoDuracion, formatoFecha, formatoM3, formatoNumero } from "@/lib/dates"
import { hoyDeCampo, syncEt0 } from "@/lib/et0"
import { loteDeUsuario, presentarLote, requireUser } from "@/lib/queries"
import { CropIcon } from "@/components/crop-icon"
import { WaterBar } from "@/components/water-bar"
import { Button } from "@/components/ui/button"

export default async function LotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const lote = await loteDeUsuario(user.id, id)
  if (!lote || !lote.cultivo || !lote.suelo || !lote.sistema) notFound()
  const hoy = hoyDeCampo()
  const et = await syncEt0(lote.campoId, lote.campo.lat, lote.campo.lng, lote.cultivo.fechaInicio, hoy)
  const vista = presentarLote(lote, et.days, hoy)
  if (!vista) notFound()
  const cultivo = CULTIVOS[vista.cultivo]
  const textura = TEXTURA_FICHA[vista.textura]

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-6 md:px-0">
      <Link href="/inicio" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Lotes
      </Link>
      <header className="flex items-start gap-3">
        <CropIcon tipo={vista.cultivo} className="size-14" />
        <div>
          <h1 className="font-heading text-4xl tracking-tight">{vista.nombre}</h1>
          <p className="text-muted-foreground">
            {cultivo.nombre} · {vista.variedad}
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Agua disponible hoy</p>
        <p className="font-heading text-4xl">{Math.round(vista.fraccion * 100)}%</p>
        <div className="mt-3">
          <WaterBar fraccion={vista.fraccion} />
        </div>
        <p className="mt-2 text-sm">
          {formatoNumero(vista.remanenteMm, 1)} mm de {formatoNumero(vista.aguaDisponibleMm, 1)} mm ·{" "}
          {formatoNumero(vista.litrosRemanentesPorPlanta, 0)} L por planta
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Desde el último riego se han perdido {formatoNumero(vista.depletionMm, 1)} mm. El cultivo va en el día {vista.diasCultivo} con un Kc de {formatoNumero(vista.kcHoy, 2)}.
          {vista.faltantes > 0 ? ` Faltan ${vista.faltantes} días de ET0 en el periodo.` : ""}
        </p>
        <Button asChild size="xl" className="mt-4">
          <Link href={`/lotes/${lote.id}/regar`}>Anotar riego</Link>
        </Button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Ficha titulo="Cultivo">
          <Dato etiqueta="Especie" valor={cultivo.nombre} />
          <Dato etiqueta="Variedad" valor={vista.variedad} />
          <Dato etiqueta="Cobertura" valor={`${formatoNumero(vista.coberturaPct, 0)}%`} />
          <Dato etiqueta={cultivo.fechaEtiqueta} valor={formatoFecha(vista.fechaInicio)} />
        </Ficha>
        <Ficha titulo="Suelo">
          <Dato etiqueta="Textura" valor={textura.nombre} />
          <Dato etiqueta="Profundidad" valor={`${formatoNumero(vista.profundidadCm, 0)} cm`} />
          <Dato etiqueta="Agua disponible" valor={`${formatoNumero(vista.aguaDisponibleMm, 1)} mm`} />
          <Dato etiqueta="Por planta" valor={`${formatoNumero(vista.litrosDisponiblesPorPlanta, 0)} L`} />
        </Ficha>
        <Ficha titulo="Sistema">
          <Dato etiqueta="Tipo" valor={SISTEMAS[vista.sistema].nombre} />
          <Dato etiqueta="Emisor" valor={`${formatoNumero(vista.caudalEmisorLph, 1)} L/h`} />
          <Dato etiqueta="Planta" valor={`${formatoNumero(vista.caudalPlantaLph, 1)} L/h`} />
          <Dato etiqueta="Eficiencia" valor={`${formatoNumero(vista.eficienciaPct, 0)}%`} />
          <Dato etiqueta="Superficie mojada" valor={`${formatoNumero(vista.superficieMojadaPct, 0)}%`} />
          <Dato etiqueta="Ancho de mojado" valor={`${formatoNumero(vista.anchoMojadoM, 2)} m`} />
        </Ficha>
      </section>

      <section className="rounded-3xl bg-card p-4 text-sm leading-relaxed ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl">Cómo se estima</h2>
        <p className="mt-2 text-muted-foreground">
          Cada día se multiplica la ET0 de Open-Meteo por el coeficiente del cultivo —según los días desde {cultivo.fechaEtiqueta.toLowerCase()}— y por la cobertura. Esa suma vacía la barra. Al anotar un riego, el conteo se reinicia en esa fecha. Los milímetros de suelo salen de la textura y la profundidad: {textura.nombre.toLowerCase()} aporta {textura.mmPorM} mm por metro.
        </p>
        <p className="mt-2">
          Superficie {formatoNumero(vista.superficieHa, 2)} ha · {formatoNumero(vista.plantas, 0)} plantas · {formatoM3(vista.totalM3)} aplicados.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl">Riegos</h2>
        {lote.riegos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Cuando anotes el primero, el agua acumulada y la puntuación quedan en esta lista.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {lote.riegos.map((riego) => (
              <li key={riego.id}>
                <Link href={`/lotes/${lote.id}/riegos/${riego.id}`} className="block rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{formatoFecha(riego.fecha)}</span>
                    <span className={riego.resultado === "adecuado" ? "text-leaf" : "text-destructive"}>
                      {riego.puntuacion}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {formatoDuracion(riego.duracionMin)} · {formatoNumero(riego.mmAplicados, 1)} mm · {formatoM3(riego.metrosCubicos)}
                  </span>
                  {riego.descripcionInsumos ? (
                    <span className="mt-1 block text-sm">{riego.descripcionInsumos}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function Ficha({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl">{titulo}</h2>
      <dl className="mt-3 grid gap-2">{children}</dl>
    </section>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  )
}
