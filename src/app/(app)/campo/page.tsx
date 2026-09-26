import { redirect } from "next/navigation"
import { refrescarClima, salir } from "@/lib/actions"
import { formatoCoord, formatoNumero } from "@/lib/dates"
import { rachaActiva } from "@/lib/irrigation"
import { requireUser, vistaDeCampo } from "@/lib/queries"
import { CampoForm } from "@/components/campo-form"
import { Button } from "@/components/ui/button"
import { FieldMap } from "@/components/field-map"

export default async function CampoPage() {
  const user = await requireUser()
  const vista = await vistaDeCampo(user.id)
  if (!vista) redirect("/onboarding")
  const dias = vista.et.days.slice(-14)
  const maximo = Math.max(1, ...dias.map((dia) => dia.et0Mm))

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 md:px-0">
      <header>
        <p className="text-sm text-muted-foreground">Referencia de clima</p>
        <h1 className="font-heading text-4xl tracking-tight">{vista.campo.nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatoCoord(vista.campo.lat, vista.campo.lng)}</p>
      </header>

      <section className="h-72 overflow-hidden rounded-3xl ring-1 ring-foreground/10">
        <FieldMap lat={vista.campo.lat} lng={vista.campo.lng} readOnly />
      </section>

      <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Evapotranspiración de referencia</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          ET0 FAO Penman-Monteith consultada en Open-Meteo con las coordenadas del campo. Cada lote la convierte en evapotranspiración de cultivo con su coeficiente y su cobertura.
        </p>
        {vista.et.error ? (
          <p className="mt-3 text-sm text-destructive">{vista.et.error}</p>
        ) : null}
        {dias.length === 0 ? (
          <p className="mt-4 text-sm">Todavía no hay días de ET0 guardados.</p>
        ) : (
          <div className="mt-4 flex h-36 items-end gap-1">
            {dias.map((dia) => (
              <div key={dia.fecha} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-water"
                    style={{ height: `${Math.max(8, (dia.et0Mm / maximo) * 100)}%` }}
                    title={`${dia.fecha}: ${formatoNumero(dia.et0Mm, 1)} mm`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{dia.fecha.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Últimos días, en milímetros. Fuente:{" "}
          <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{" "}
          y{" "}
          <a className="underline" href="https://github.com/open-meteo/open-meteo" target="_blank" rel="noreferrer">
            open-meteo/open-meteo
          </a>
          . Mapa © OpenStreetMap.
        </p>
        <form action={refrescarClima} className="mt-3">
          <Button type="submit" variant="outline">
            Volver a consultar el clima
          </Button>
        </form>
      </section>

      <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Cuenta y racha</h2>
        <p className="mt-2 text-sm">
          {user.nombre} · {user.email}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuenta de ejemplo. La racha es tuya, no del lote:{" "}
          {rachaActiva(user.rachaActual) ? `hoy va en ${user.rachaActual} días` : "empieza al segundo día seguido a tiempo"}.
        </p>
        <form action={salir} className="mt-4">
          <Button type="submit" variant="outline">
            Cerrar sesión
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-heading text-2xl">Ajustar el campo</h2>
        <div className="mt-3">
          <CampoForm
            modo="editar"
            inicial={{ nombre: vista.campo.nombre, lat: vista.campo.lat, lng: vista.campo.lng }}
          />
        </div>
      </section>
    </main>
  )
}
