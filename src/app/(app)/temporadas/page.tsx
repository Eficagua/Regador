import { redirect } from "next/navigation"
import { formatoM3, formatoNumero } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import { campoDeUsuario, requireUser } from "@/lib/queries"
import { asegurarTemporadaEjemplo } from "@/lib/temporada-ejemplo"
import { agruparTemporadas } from "@/lib/temporadas"

export default async function TemporadasPage() {
  const user = await requireUser()
  await asegurarTemporadaEjemplo(user.id)
  const campo = await campoDeUsuario(user.id)
  if (!campo) redirect("/onboarding")
  const temporadas = await prisma.temporada.findMany({
    where: { campoId: campo.id },
    orderBy: [{ cultivo: "asc" }, { anio: "desc" }],
  })
  const grupos = agruparTemporadas(temporadas)

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-0">
      <p className="text-sm text-muted-foreground">{campo.nombre}</p>
      <h1 className="font-heading text-4xl tracking-tight">Temporadas</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Cada cultivo guarda su cosecha, el riego, la lluvia y la productividad del agua de la temporada.
      </p>
      {grupos.length === 0 ? (
        <section className="mt-6 rounded-3xl bg-card px-5 py-8 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Todavía no hay temporadas</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Cuando el campo cierre una cosecha, el resultado queda aquí, separado por cultivo.
          </p>
        </section>
      ) : (
        <div className="mt-6 grid gap-6">
          {grupos.map((grupo) => (
            <section key={grupo.cultivo}>
              <h2 className="font-heading text-2xl">{grupo.cultivo}</h2>
              <ul className="mt-3 grid gap-3">
                {grupo.filas.map((fila) => (
                  <li key={fila.id} className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
                    <p className="text-sm text-muted-foreground">Temporada {fila.anio}</p>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Dato etiqueta="Cosecha total" valor={`${formatoNumero(fila.cosechaKg, 0)} kg`} />
                      <Dato etiqueta="Riego total" valor={formatoM3(fila.riegoM3)} />
                      <Dato etiqueta="Lluvia" valor={`${formatoNumero(fila.lluviaMm, 0)} mm`} />
                      <Dato etiqueta="Productividad del agua" valor={`${formatoNumero(fila.productividadLporKg, 0)} L/kg`} />
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-heading text-2xl">{valor}</dd>
    </div>
  )
}
