import Link from "next/link"
import { redirect } from "next/navigation"
import { Flame } from "lucide-react"
import { siguienteLogro } from "@/lib/achievements"
import { salir } from "@/lib/actions"
import { formatoM3 } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import { metrosDelCampo } from "@/lib/queries"
import { getSessionUser } from "@/lib/session"
import { BottomNav, SideNav } from "@/components/app-nav"
import { Marca } from "@/components/brand"
import { Button } from "@/components/ui/button"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect("/")
  const campo = await prisma.campo.findFirst({
    where: { usuarioId: user.id },
    include: {
      logros: true,
      lotes: { include: { riegos: { select: { metrosCubicos: true } } } },
    },
  })
  const total = campo ? metrosDelCampo(campo) : 0
  const siguiente = siguienteLogro(total)

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex w-full max-w-6xl items-start md:gap-8 md:px-6 md:py-8">
        {campo ? (
          <aside className="sticky top-8 hidden w-72 shrink-0 md:block">
            <Marca />
            <p className="mt-6 font-heading text-2xl leading-tight">{campo.nombre}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user.nombre}</p>
            <div className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <p className="flex items-center gap-2 text-sm">
                <Flame className={user.rachaActual > 0 ? "size-4 text-streak" : "size-4 text-muted-foreground"} />
                {user.rachaActual > 0 ? `Racha de ${user.rachaActual} días` : "Sin racha"}
              </p>
              <p className="mt-3 font-heading text-3xl">{formatoM3(total)}</p>
              <p className="text-sm text-muted-foreground">agua aplicada en el campo</p>
              {siguiente ? (
                <p className="mt-3 text-sm">
                  Siguiente: {siguiente.nombre}, a {formatoM3(siguiente.umbralM3)}.
                </p>
              ) : (
                <p className="mt-3 text-sm">Llegaste al lago más grande del tablero.</p>
              )}
            </div>
            <div className="mt-4">
              <SideNav />
            </div>
            <form action={salir} className="mt-4">
              <Button type="submit" variant="ghost" className="px-3">
                Cerrar sesión
              </Button>
            </form>
            <Link href="/lotes/nuevo" className="mt-2 block text-sm text-water-deep">
              Nuevo lote de riego
            </Link>
          </aside>
        ) : null}
        <div className={campo ? "min-w-0 flex-1 pb-28 md:pb-0" : "min-w-0 flex-1"}>{children}</div>
      </div>
      {campo ? <BottomNav /> : null}
    </div>
  )
}
