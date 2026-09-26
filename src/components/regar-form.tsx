"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { registrarRiego } from "@/lib/actions"
import { formatoDuracion, formatoNumero } from "@/lib/dates"
import {
  aguaAplicada,
  balanceEnFecha,
  duracionSugeridaMin,
  puntuarRiego,
  type CultivoTipo,
  type Et0Dia,
} from "@/lib/irrigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function RegarForm({
  lote,
  et0,
  climaError,
}: {
  lote: {
    id: string
    fechaInicio: string
    fechasRiego: string[]
    superficieHa: number
    plantas: number
    coberturaPct: number
    aguaDisponibleMm: number
    litrosDisponiblesPorPlanta: number
    caudalPlantaLph: number
    eficienciaPct: number
    hoy: string
    cultivo: CultivoTipo
  }
  et0: Et0Dia[]
  climaError: string | null
}) {
  const [state, action] = useActionState(registrarRiego, null)
  const [fecha, setFecha] = useState(lote.hoy)
  const [horas, setHoras] = useState("4")
  const [minutos, setMinutos] = useState("0")
  const [insumos, setInsumos] = useState("")

  const balance = useMemo(
    () =>
      balanceEnFecha({
        fecha,
        fechaInicio: lote.fechaInicio,
        fechasRiego: lote.fechasRiego,
        et0,
        tipo: lote.cultivo,
        coberturaPct: lote.coberturaPct,
        aguaDisponibleMm: lote.aguaDisponibleMm,
        litrosDisponiblesPorPlanta: lote.litrosDisponiblesPorPlanta,
      }),
    [fecha, lote, et0],
  )
  const sugerida = duracionSugeridaMin({
    necesariosMm: balance.necesariosMm,
    superficieHa: lote.superficieHa,
    caudalPlantaLph: lote.caudalPlantaLph,
    plantas: lote.plantas,
    eficienciaPct: lote.eficienciaPct,
  })
  const duracion = Math.round(num(horas) * 60 + num(minutos))
  const agua = aguaAplicada({
    duracionMin: Math.max(0, duracion),
    caudalPlantaLph: lote.caudalPlantaLph,
    plantas: lote.plantas,
    eficienciaPct: lote.eficienciaPct,
    superficieHa: lote.superficieHa,
  })
  const nota = duracion > 0 ? puntuarRiego(balance.necesariosMm, agua.mmNetos) : null
  const sinClima = balance.fechas.length > 0 && balance.faltantes.length === balance.fechas.length

  function usarSugerida() {
    if (!sugerida) return
    setHoras(String(Math.floor(sugerida / 60)))
    setMinutos(String(sugerida % 60))
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="loteId" value={lote.id} />
      {climaError ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{climaError}</p>
      ) : null}
      <div className="rounded-3xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Antes de este riego</p>
        <p className="mt-1 font-heading text-2xl">
          {formatoNumero(balance.necesariosMm, 1)} mm libres
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          La evapotranspiración suma {formatoNumero(balance.depletionMm, 1)} mm. El suelo guarda hasta {formatoNumero(lote.aguaDisponibleMm, 1)} mm.
          {balance.faltantes.length > 0 ? ` Faltan ${balance.faltantes.length} días de ET0, así que la estimación puede quedar corta.` : ""}
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="fecha">Fecha del riego</Label>
        <Input id="fecha" name="fecha" type="date" required value={fecha} max={lote.hoy} min={lote.fechaInicio} onChange={(event) => setFecha(event.target.value)} className="h-12 bg-card" />
        {fecha < lote.hoy ? (
          <p className="text-xs text-destructive">Una fecha anterior a hoy rompe la racha.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Si el riego es de hoy, la racha se mantiene.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="horas">Horas</Label>
          <Input id="horas" name="horas" inputMode="numeric" value={horas} onChange={(event) => setHoras(event.target.value)} className="h-12 bg-card" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="minutos">Minutos</Label>
          <Input id="minutos" name="minutos" inputMode="numeric" value={minutos} onChange={(event) => setMinutos(event.target.value)} className="h-12 bg-card" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 4, 8].map((hora) => (
          <Button key={hora} type="button" variant="outline" className="bg-card" onClick={() => { setHoras(String(hora)); setMinutos("0") }}>
            {hora} h
          </Button>
        ))}
        {sugerida && sugerida > 0 ? (
          <Button type="button" variant="secondary" onClick={usarSugerida}>
            Sugerida · {formatoDuracion(sugerida)}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="insumos">Aplicación de insumos</Label>
        <Textarea
          id="insumos"
          name="insumos"
          value={insumos}
          onChange={(event) => setInsumos(event.target.value)}
          placeholder="Opcional. Ej. Fertirriego con nitrato de calcio, 8 L/ha"
          className="min-h-24 bg-card"
        />
      </div>
      <div className="rounded-3xl bg-[#e7f1f8] px-4 py-3 text-sm text-water-deep">
        <p>
          {formatoNumero(agua.mmNetos, 1)} mm netos · {formatoNumero(agua.metrosCubicos, 1)} m³ totales
        </p>
        <p className="mt-1">
          {nota
            ? nota.resultado === "adecuado"
              ? "Con esta duración el riego cae dentro del margen de 10%."
              : nota.motivo === "exceso"
                ? "Con esta duración se aplica de más respecto del suelo."
                : "Con esta duración no se repone lo que el suelo perdió."
            : "Indica la duración para ver la lámina."}
        </p>
        <p className="mt-1 text-xs">
          Los milímetros netos descuentan la eficiencia de {formatoNumero(lote.eficienciaPct, 0)}%. Los metros cúbicos suman el agua total.
        </p>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton disabled={sinClima || duracion < 1} />
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="xl" disabled={disabled || pending}>
      {pending ? "Guardando riego…" : "Guardar riego"}
    </Button>
  )
}

function num(value: string): number {
  const parsed = Number(value.trim().replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}
