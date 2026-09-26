import { cn } from "cn"

export function Marca({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-2xl bg-water-deep text-[#f4f0e6]">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
          <path d="M16 4c2.2 4.2 7 7.2 7 13a7 7 0 0 1-14 0c0-5.8 4.8-8.8 7-13z" fill="currentColor" />
        </svg>
      </span>
      {compact ? null : <span className="font-heading text-xl tracking-tight">Lámina</span>}
    </div>
  )
}
