import { barraEfectividad, type ColorBarraEfectividad } from "@/lib/irrigation"

const COLORES: Record<ColorBarraEfectividad, string> = {
  amarillo: "#e6b325",
  verde: "#98B06F",
  rojo: "#c44536",
}

const TEXTOS: Record<ColorBarraEfectividad, string> = {
  amarillo: "La lámina va llenando lo que el suelo puede recibir.",
  verde: "Los milímetros quedan dentro del 10% y el riego es adecuado.",
  rojo: "La barra completa marca un riego excesivo.",
}

export function BarraEfectividad({
  necesariosMm,
  aplicadosMm,
}: {
  necesariosMm: number
  aplicadosMm: number
}) {
  const barra = barraEfectividad(necesariosMm, aplicadosMm)
  const pct = Math.round(barra.fraccion * 100)

  return (
    <section aria-live="polite" className="grid gap-2">
      <p className="text-sm text-muted-foreground">Efectividad esperada</p>
      <div
        className="h-4 overflow-hidden rounded-full bg-track"
        role="meter"
        aria-label="Efectividad esperada del riego"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={TEXTOS[barra.color]}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: COLORES[barra.color] }}
        />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{TEXTOS[barra.color]}</p>
    </section>
  )
}
