export function WaterBar({ fraccion }: { fraccion: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(fraccion * 100)))
  return (
    <div
      className="h-3 overflow-hidden rounded-full bg-track"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Agua disponible: ${pct}%`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-water-deep to-water transition-[width] duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
