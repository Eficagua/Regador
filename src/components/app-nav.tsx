"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, CalendarDays, Droplets, MapPin } from "lucide-react"
import { cn } from "cn"

const items = [
  { href: "/inicio", label: "Inicio", icon: Droplets },
  { href: "/logros", label: "Logros", icon: Award },
  { href: "/campo", label: "Campo", icon: MapPin },
  { href: "/temporadas", label: "Temporadas", icon: CalendarDays },
]

function activo(href: string, path: string) {
  if (href === "/inicio") return path === "/inicio" || path.startsWith("/lotes")
  return path === href || path.startsWith(`${href}/`)
}

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon
          const on = activo(item.href, path)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-xs",
                  on ? "text-water-deep" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function SideNav() {
  const path = usePathname()
  return (
    <nav>
      <ul className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const on = activo(item.href, path)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm",
                  on ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
