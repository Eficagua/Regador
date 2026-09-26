import { cn } from "cn"

export function Marca({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src="/regador-logo.png" alt="" width={385} height={448} className="h-14 w-auto" />
      {compact ? null : <span className="font-heading text-xl tracking-tight">regador</span>}
    </div>
  )
}
