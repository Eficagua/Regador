import { cn } from "cn"
import type { CultivoTipo } from "@/lib/irrigation"

const tono: Record<CultivoTipo, string> = {
  aji: "bg-[#f8e4dc] text-[#a33b24]",
  nogal: "bg-[#f3e6d6] text-[#6a4528]",
  maiz: "bg-[#f8efd0] text-[#8a6410]",
  manzana: "bg-[#f8e0e6] text-[#a1263c]",
}

export function CropIcon({
  tipo,
  className,
}: {
  tipo: CultivoTipo
  className?: string
}) {
  return (
    <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tono[tipo], className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        {tipo === "aji" ? <Aji /> : null}
        {tipo === "nogal" ? <Nogal /> : null}
        {tipo === "maiz" ? <Maiz /> : null}
        {tipo === "manzana" ? <Manzana /> : null}
      </svg>
    </span>
  )
}

function Aji() {
  return (
    <path
      d="M17.5 4.5c.4 2.2-.8 3.2-.8 3.2-3.6.6-7.2 4.4-7.7 9.3-.4 4.2 2 7.8 5.8 8.4 4.2.7 8-2.2 9-6.6 1.1-5-1.2-9.6-2.6-12.4 0 0 .4-1.6 1.8-1.9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  )
}

function Nogal() {
  return (
    <>
      <circle cx="16" cy="17" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 9.2c.4 2.6.2 5.2 0 7.8.2 2.6.4 5.2 0 7.8M9.2 17c2.4-.6 4.6-.4 6.8 0 2.2.4 4.4.6 6.8 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}

function Maiz() {
  return (
    <>
      <path d="M12 6c2 1 3 3 3 5v14c0 1.2 2.2 2 4 1.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 12h6M13 16h6M13 20h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.5 7.5c2.2 1.2 4 4.6 3.2 8.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  )
}

function Manzana() {
  return (
    <>
      <path d="M16 8c-1.2-2 1-3.2 2.4-2.2 1.2 1.6-.2 3-2.4 2.2z" fill="currentColor" />
      <path d="M16 9.5c-4.8 0-8 3.6-8 8.2 0 3.6 2.6 6.3 6.2 6.3 1.2 0 1.8-.7 1.8-.7s.6.7 1.8.7c3.6 0 6.2-2.7 6.2-6.3 0-4.6-3.2-8.2-8-8.2z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 9.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}
