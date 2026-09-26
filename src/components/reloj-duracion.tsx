"use client"

import { useEffect, useRef } from "react"

const ALTO = 48
const HORAS_MAX = 24

export function RelojDuracion({
  horas,
  minutos,
  onHoras,
  onMinutos,
}: {
  horas: number
  minutos: number
  onHoras: (valor: number) => void
  onMinutos: (valor: number) => void
}) {
  return (
    <section className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-sm text-muted-foreground">Duración del riego concluido</p>
      <p className="mt-1 text-center font-heading text-5xl tabular-nums tracking-tight text-water-deep">
        {dos(horas)}:{dos(minutos)}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">Desliza las ruedas para marcar horas y minutos.</p>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Rueda etiqueta="Horas" valor={horas} maximo={HORAS_MAX} onChange={onHoras} />
        <span className="font-heading text-3xl text-muted-foreground" aria-hidden>
          :
        </span>
        <Rueda etiqueta="Minutos" valor={minutos} maximo={59} onChange={onMinutos} />
      </div>
      <div className="mt-4 grid gap-3">
        <ControlLineal etiqueta="Horas" valor={horas} maximo={HORAS_MAX} onChange={onHoras} />
        <ControlLineal etiqueta="Minutos" valor={minutos} maximo={59} onChange={onMinutos} />
      </div>
      <input type="hidden" name="horas" value={horas} />
      <input type="hidden" name="minutos" value={minutos} />
    </section>
  )
}

function Rueda({
  etiqueta,
  valor,
  maximo,
  onChange,
}: {
  etiqueta: string
  valor: number
  maximo: number
  onChange: (valor: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const valorRef = useRef(valor)
  const origen = useRef<"usuario" | "estado">("estado")
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null)
  valorRef.current = valor

  useEffect(() => {
    const el = ref.current
    if (!el || origen.current === "usuario") return
    const destino = valor * ALTO
    if (Math.abs(el.scrollTop - destino) > 1) el.scrollTo({ top: destino })
  }, [valor])

  useEffect(() => {
    return () => {
      if (espera.current) clearTimeout(espera.current)
    }
  }, [])

  function alDeslizar() {
    const el = ref.current
    if (!el) return
    origen.current = "usuario"
    if (espera.current) clearTimeout(espera.current)
    espera.current = setTimeout(() => {
      const siguiente = Math.min(maximo, Math.max(0, Math.round(el.scrollTop / ALTO)))
      origen.current = "estado"
      if (siguiente !== valorRef.current) onChange(siguiente)
    }, 80)
  }

  return (
    <div className="relative h-36">
      <div className="pointer-events-none absolute inset-x-0 top-12 z-10 h-12 rounded-xl bg-water/10 ring-1 ring-water/30" />
      <div
        ref={ref}
        data-rueda={etiqueta}
        role="slider"
        tabIndex={0}
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={valor}
        aria-valuetext={`${valor} ${etiqueta.toLowerCase()}`}
        onScroll={alDeslizar}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
          event.preventDefault()
          const delta = event.key === "ArrowUp" ? -1 : 1
          onChange(Math.min(maximo, Math.max(0, valor + delta)))
        }}
        className="h-36 snap-y snap-mandatory overflow-y-auto overscroll-contain py-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: maximo + 1 }, (_, numero) => (
          <div
            key={numero}
            className="flex h-12 snap-center items-center justify-center font-heading text-3xl tabular-nums"
          >
            {dos(numero)}
          </div>
        ))}
      </div>
    </div>
  )
}

function ControlLineal({
  etiqueta,
  valor,
  maximo,
  onChange,
}: {
  etiqueta: string
  valor: number
  maximo: number
  onChange: (valor: number) => void
}) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      <span className="flex justify-between">
        <span>{etiqueta}</span>
        <span className="tabular-nums text-foreground">{dos(valor)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={maximo}
        step={1}
        value={valor}
        aria-label={`Deslizar ${etiqueta.toLowerCase()}`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="reloj-rango"
      />
    </label>
  )
}

function dos(valor: number): string {
  return String(valor).padStart(2, "0")
}
