import { redirect } from "next/navigation"
import { LOGROS, siguienteLogro } from "@/lib/achievements"
import { formatoM3, formatoNumero } from "@/lib/dates"
import { campoDeUsuario, metrosDelCampo, requireUser } from "@/lib/queries"

export default async function LogrosPage() {
  const user = await requireUser()
  const campo = await campoDeUsuario(user.id)
  if (!campo) redirect("/onboarding")
  const total = metrosDelCampo(campo)
  const desbloqueados = new Set(campo.logros.map((logro) => logro.codigo))
  const siguiente = siguienteLogro(total)

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-0">
      <p className="text-sm text-muted-foreground">{campo.nombre}</p>
      <h1 className="font-heading text-4xl tracking-tight">Logros de agua</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Cada marca usa el nombre de un cuerpo de agua de México. El umbral es el agua que tu campo ha aplicado, no el volumen real de esa presa o ese lago.
      </p>
      <p className="mt-4 font-heading text-4xl">{formatoM3(total)}</p>
      {siguiente ? (
        <p className="mt-1 text-sm">
          Faltan {formatoNumero(Math.max(0, siguiente.umbralM3 - total), 0)} m³ para {siguiente.nombre}.
        </p>
      ) : (
        <p className="mt-1 text-sm">El campo ya recorrió toda la escala, hasta el Lago de Chapala.</p>
      )}
      <ol className="mt-6 grid gap-3">
        {LOGROS.map((logro) => {
          const abierto = desbloqueados.has(logro.codigo)
          const progreso = Math.min(1, total / logro.umbralM3)
          return (
            <li key={logro.codigo} className={`rounded-3xl p-4 ring-1 ring-foreground/10 ${abierto ? "bg-card" : "bg-card/60"}`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">{logro.categoria}</p>
                <p className="text-xs text-muted-foreground">{formatoM3(logro.umbralM3)}</p>
              </div>
              <h2 className="mt-1 font-heading text-2xl">{logro.nombre}</h2>
              <p className="text-sm text-muted-foreground">{logro.lugar}</p>
              <p className="mt-2 text-sm">{logro.relato}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-track">
                <div className={`h-full rounded-full ${abierto ? "bg-leaf" : "bg-water"}`} style={{ width: `${progreso * 100}%` }} />
              </div>
              <p className="mt-2 text-sm">{abierto ? "Desbloqueado" : "Por alcanzar"}</p>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
