"use client"

import { useActionState, useMemo, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { registrarRiego } from "@/lib/actions"
import { formatoNumero } from "@/lib/dates"
import {
  aguaAplicada,
  estimarMilimetros,
  balanceEnFecha,
  puntuarRiego,
  type CultivoTipo,
  type Et0Dia,
} from "@/lib/irrigation"
import { comentarioConDictado } from "@/lib/dictado"
import { BarraEfectividad } from "@/components/barra-efectividad"
import { ComentarioPorVoz } from "@/components/comentario-por-voz"
import { RelojDuracion } from "@/components/reloj-duracion"
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
    nombre: string
    fechaInicio: string
    fechasRiego: string[]
    superficieHa: number
    plantas: number
    coberturaPct: number
    aguaDisponibleMm: number
    litrosDisponiblesPorPlanta: number
    caudalPlantaLph: number
    eficienciaPct: number
    superficieMojadaPct: number
    hoy: string
    cultivo: CultivoTipo
  }
  et0: Et0Dia[]
  climaError: string | null
}) {
  const [state, action] = useActionState(registrarRiego, null)
  const [fecha, setFecha] = useState(lote.hoy)
  const [horas, setHoras] = useState(1)
  const [minutos, setMinutos] = useState(0)
  const [insumos, setInsumos] = useState("")
  const insumosRef = useRef(insumos)
  const baseDictado = useRef("")
  const dictando = useRef(false)
  insumosRef.current = insumos

  function empezarDictado() {
    dictando.current = true
    baseDictado.current = insumosRef.current
  }

  function aplicarDictado(texto: string) {
    const siguiente = comentarioConDictado(baseDictado.current, texto)
    insumosRef.current = siguiente
    setInsumos(siguiente)
  }

  function terminarDictado() {
    dictando.current = false
  }

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
  const duracion = horas * 60 + minutos
  const estimacion = estimarMilimetros({
    duracionMin: Math.max(0, duracion),
    caudalPlantaLph: lote.caudalPlantaLph,
    plantas: lote.plantas,
    superficieHa: lote.superficieHa,
    superficieMojadaPct: lote.superficieMojadaPct,
    eficienciaPct: lote.eficienciaPct,
  })
  const agua = aguaAplicada({
    duracionMin: Math.max(0, duracion),
    caudalPlantaLph: lote.caudalPlantaLph,
    plantas: lote.plantas,
    eficienciaPct: lote.eficienciaPct,
    superficieHa: lote.superficieHa,
  })
  const nota = duracion > 0 ? puntuarRiego(balance.necesariosMm, agua.mmNetos) : null
  const sinClima = balance.fechas.length > 0 && balance.faltantes.length === balance.fechas.length

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="loteId" value={lote.id} />
      {climaError ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{climaError}</p>
      ) : null}
      <p className="text-sm leading-relaxed text-muted-foreground">
        Registra el riego de {lote.nombre} cuando el evento ya concluyó. La fecha de hoy suma a la racha a partir del segundo día seguido.
      </p>
      <RelojDuracion horas={horas} minutos={minutos} onHoras={setHoras} onMinutos={setMinutos} />
      <BarraEfectividad necesariosMm={balance.necesariosMm} aplicadosMm={estimacion.mmAplicar} />
      <div className="grid gap-1.5">
        <Label htmlFor="fecha">Fecha del riego</Label>
        <Input id="fecha" name="fecha" type="date" required value={fecha} max={lote.hoy} min={lote.fechaInicio} onChange={(event) => setFecha(event.target.value)} className="h-12 bg-card" />
        {fecha < lote.hoy ? (
          <p className="text-xs text-muted-foreground">Fecha anterior. El riego queda en el lote y no suma a la racha.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Fecha de hoy. La racha se acumula desde el segundo día seguido a tiempo.</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="insumos">Comentarios de insumos</Label>
        <Textarea
          id="insumos"
          name="insumos"
          value={insumos}
          onChange={(event) => {
            const valor = event.target.value
            insumosRef.current = valor
            setInsumos(valor)
            if (!dictando.current) baseDictado.current = valor
          }}
          placeholder="Aplicaciones de insumos durante el riego. Escríbelas o complétalas con el comando de voz."
          className="min-h-24 bg-card"
        />
        <ComentarioPorVoz onSessionStart={empezarDictado} onTranscript={aplicarDictado} onSessionEnd={terminarDictado} />
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
      {pending ? "Registrando riego…" : "Registrar riego"}
    </Button>
  )
}

