"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { LocateFixed, Search } from "lucide-react"
import { actualizarCampo, crearCampo } from "@/lib/actions"
import { PIN_INICIAL } from "@/lib/catalog"
import { formatoCoord } from "@/lib/dates"
import { FieldMap } from "@/components/field-map"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Resultado = { nombre: string; lat: number; lng: number }

export function CampoForm({
  modo,
  inicial,
}: {
  modo: "crear" | "editar"
  inicial?: { nombre: string; lat: number; lng: number }
}) {
  const action = modo === "crear" ? crearCampo : actualizarCampo
  const [state, formAction, pending] = useActionState(action, null)
  const [nombre, setNombre] = useState(inicial?.nombre ?? "")
  const [lat, setLat] = useState(inicial?.lat ?? PIN_INICIAL.lat)
  const [lng, setLng] = useState(inicial?.lng ?? PIN_INICIAL.lng)
  const [consulta, setConsulta] = useState("")
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [flyToken, setFlyToken] = useState(0)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    if (consulta.trim().length < 3) {
      setResultados([])
      return
    }
    const control = new AbortController()
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const respuesta = await fetch(`/api/geocode?q=${encodeURIComponent(consulta.trim())}`, {
          signal: control.signal,
        })
        const data = (await respuesta.json()) as { resultados?: Resultado[] }
        setResultados(data.resultados ?? [])
      } catch {
        if (!control.signal.aborted) setResultados([])
      } finally {
        if (!control.signal.aborted) setBuscando(false)
      }
    }, 450)
    return () => {
      control.abort()
      clearTimeout(timer)
    }
  }, [consulta])

  function irA(siguienteLat: number, siguienteLng: number) {
    setLat(siguienteLat)
    setLng(siguienteLng)
    setFlyToken((token) => token + 1)
    setResultados([])
    setConsulta("")
  }

  function ubicar() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError("Este navegador no comparte la ubicación.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => irA(pos.coords.latitude, pos.coords.longitude),
      () => setGeoError("No pudimos leer tu ubicación. Mueve el pin en el mapa."),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="nombre">Nombre del campo</Label>
        <Input
          id="nombre"
          name="nombre"
          required
          minLength={2}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Rancho San Isidro"
          className="h-12 bg-card"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="buscar">Ubicación</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" />
          <Input
            id="buscar"
            value={consulta}
            onChange={(event) => setConsulta(event.target.value)}
            placeholder="Busca una localidad"
            className="h-12 bg-card pl-9"
            autoComplete="off"
          />
        </div>
        {buscando ? <p className="text-xs text-muted-foreground">Buscando…</p> : null}
        {resultados.length > 0 ? (
          <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            {resultados.map((lugar) => (
              <li key={`${lugar.lat}-${lugar.lng}-${lugar.nombre}`}>
                <button
                  type="button"
                  className="w-full px-3 py-3 text-left text-sm hover:bg-muted"
                  onClick={() => irA(lugar.lat, lugar.lng)}
                >
                  {lugar.nombre}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="h-80 overflow-hidden rounded-3xl ring-1 ring-foreground/10">
          <FieldMap lat={lat} lng={lng} flyToken={flyToken} onChange={(siguienteLat, siguienteLng) => {
            setLat(siguienteLat)
            setLng(siguienteLng)
          }} />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">{formatoCoord(lat, lng)}</p>
          <Button type="button" variant="outline" className="bg-card" onClick={ubicar}>
            <LocateFixed />
            Mi ubicación
          </Button>
        </div>
        {geoError ? <p className="text-sm text-destructive">{geoError}</p> : null}
        {modo === "crear" ? (
          <p className="text-sm text-muted-foreground">
            El pin inicia en {PIN_INICIAL.lugar}. Muévelo o busca el punto que servirá para estimar la evapotranspiración.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Si mueves el pin, se vuelve a consultar el clima de las coordenadas nuevas.
          </p>
        )}
      </div>
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "Guardando…" : modo === "crear" ? "Guardar campo" : "Actualizar campo"}
      </Button>
    </form>
  )
}
