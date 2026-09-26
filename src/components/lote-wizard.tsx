"use client"

import { useMemo, useState, useTransition } from "react"
import { crearLote } from "@/lib/actions"
import {
  CULTIVOS,
  ORDEN_CULTIVOS,
  ORDEN_SISTEMAS,
  ORDEN_TEXTURAS,
  SISTEMAS,
  TEXTURA_FICHA,
  parametrosSistema,
  plantasSugeridas,
} from "@/lib/catalog"
import { addDays, formatoNumero, todayISO } from "@/lib/dates"
import {
  aguaDisponibleMm,
  litrosDisponiblesPorPlanta,
  type CultivoTipo,
  type SistemaTipo,
  type Textura,
} from "@/lib/irrigation"
import { CropIcon } from "@/components/crop-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const pasos = ["Cultivo", "Lote", "Suelo", "Riego"]

export function LoteWizard({
  nombreInicial,
  campoNombre,
}: {
  nombreInicial: string
  campoNombre: string
}) {
  const hoy = todayISO()
  const [paso, setPaso] = useState(0)
  const [cultivo, setCultivo] = useState<CultivoTipo>("aji")
  const [nombre, setNombre] = useState(nombreInicial)
  const [superficie, setSuperficie] = useState("1")
  const [plantas, setPlantas] = useState(String(plantasSugeridas("aji", 1)))
  const [plantasEditada, setPlantasEditada] = useState(false)
  const [variedad, setVariedad] = useState(CULTIVOS.aji.variedades[0])
  const [variedadEditada, setVariedadEditada] = useState(false)
  const [cobertura, setCobertura] = useState(String(CULTIVOS.aji.coberturaPct))
  const [coberturaEditada, setCoberturaEditada] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(addDays(hoy, -12))
  const [textura, setTextura] = useState<Textura>("franco")
  const [profundidad, setProfundidad] = useState(String(CULTIVOS.aji.profundidadCm))
  const [profundidadEditada, setProfundidadEditada] = useState(false)
  const [sistema, setSistema] = useState<SistemaTipo>(CULTIVOS.aji.sistemaInicial)
  const [caudalEmisor, setCaudalEmisor] = useState(String(parametrosSistema("aji", "goteo").caudalEmisorLph))
  const [caudalPlanta, setCaudalPlanta] = useState(String(parametrosSistema("aji", "goteo").caudalPlantaLph))
  const [eficiencia, setEficiencia] = useState(String(parametrosSistema("aji", "goteo").eficienciaPct))
  const [mojada, setMojada] = useState(String(parametrosSistema("aji", "goteo").superficieMojadaPct))
  const [ancho, setAncho] = useState(String(parametrosSistema("aji", "goteo").anchoMojadoM))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function elegirCultivo(siguiente: CultivoTipo) {
    const ficha = CULTIVOS[siguiente]
    setCultivo(siguiente)
    if (!plantasEditada) setPlantas(String(plantasSugeridas(siguiente, num(superficie) || 1)))
    if (!variedadEditada) setVariedad(ficha.variedades[0])
    if (!coberturaEditada) setCobertura(String(ficha.coberturaPct))
    if (!profundidadEditada) setProfundidad(String(ficha.profundidadCm))
    const base = parametrosSistema(siguiente, ficha.sistemaInicial)
    setSistema(ficha.sistemaInicial)
    aplicarParametros(base)
  }

  function aplicarParametros(base: ReturnType<typeof parametrosSistema>) {
    setCaudalEmisor(String(base.caudalEmisorLph))
    setCaudalPlanta(String(base.caudalPlantaLph))
    setEficiencia(String(base.eficienciaPct))
    setMojada(String(base.superficieMojadaPct))
    setAncho(String(base.anchoMojadoM))
  }

  function cambiarSuperficie(valor: string) {
    setSuperficie(valor)
    if (!plantasEditada) setPlantas(String(plantasSugeridas(cultivo, num(valor) || 0)))
  }

  const aguaMm = aguaDisponibleMm(textura, num(profundidad) || 0)
  const litros = litrosDisponiblesPorPlanta(aguaMm, num(superficie) || 0, num(plantas) || 0, num(mojada) || 0)
  const ficha = CULTIVOS[cultivo]

  const errorPaso = useMemo(() => {
    if (paso === 1) {
      if (nombre.trim().length < 2) return "Ponle un nombre al lote."
      if (!(num(superficie) > 0)) return "Indica la superficie en hectáreas."
      if (!(num(plantas) >= 1)) return "Indica cuántas plantas tiene el lote."
    }
    if (paso === 2) {
      if (variedad.trim().length < 2) return "Indica la variedad."
      if (!(num(cobertura) >= 1 && num(cobertura) <= 100)) return "La cobertura va de 1 a 100%."
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) return "Elige la fecha de inicio."
      if (!(num(profundidad) >= 10)) return "Define la profundidad del suelo."
    }
    return null
  }, [paso, nombre, superficie, plantas, variedad, cobertura, fechaInicio, profundidad])

  function guardar() {
    setError(null)
    startTransition(async () => {
      const result = await crearLote({
        nombre,
        superficieHa: num(superficie),
        plantas: Math.round(num(plantas)),
        cultivo,
        variedad,
        coberturaPct: num(cobertura),
        fechaInicio,
        textura,
        profundidadCm: num(profundidad),
        sistema,
        caudalEmisorLph: num(caudalEmisor),
        caudalPlantaLph: num(caudalPlanta),
        eficienciaPct: num(eficiencia),
        superficieMojadaPct: num(mojada),
        anchoMojadoM: num(ancho),
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm text-muted-foreground">{campoNombre}</p>
        <h1 className="font-heading text-3xl tracking-tight">Nuevo lote de riego</h1>
      </div>
      <ol className="grid grid-cols-4 gap-2 text-center text-xs">
        {pasos.map((etiqueta, index) => (
          <li key={etiqueta} className={index <= paso ? "text-water-deep" : "text-muted-foreground"}>
            <span className={`mb-1 block h-1 rounded-full ${index <= paso ? "bg-water" : "bg-track"}`} />
            {etiqueta}
          </li>
        ))}
      </ol>

      {paso === 0 ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Un lote lleva un solo cultivo. El coeficiente se cuenta desde la siembra o el inicio de temporada.</p>
          {ORDEN_CULTIVOS.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => elegirCultivo(tipo)}
              className={`flex items-center gap-3 rounded-3xl bg-card p-3 text-left ring-1 ${cultivo === tipo ? "ring-water" : "ring-foreground/10"}`}
            >
              <CropIcon tipo={tipo} />
              <span>
                <span className="block font-heading text-lg">{CULTIVOS[tipo].nombre}</span>
                <span className="block text-sm text-muted-foreground">{CULTIVOS[tipo].resumen}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {paso === 1 ? (
        <div className="grid gap-4">
          <Campo label="Nombre" htmlFor="nombre-lote">
            <Input id="nombre-lote" value={nombre} onChange={(event) => setNombre(event.target.value)} className="h-12 bg-card" />
          </Campo>
          <Campo label="Superficie" hint="En hectáreas." htmlFor="superficie">
            <Input id="superficie" inputMode="decimal" value={superficie} onChange={(event) => cambiarSuperficie(event.target.value)} className="h-12 bg-card" />
          </Campo>
          <Campo
            label="Plantas en el lote"
            hint={`Referencia de ${formatoNumero(ficha.plantasPorHa, 0)} plantas por hectárea. Cámbialo si tu marco es otro.`}
            htmlFor="plantas"
          >
            <Input
              id="plantas"
              inputMode="numeric"
              value={plantas}
              onChange={(event) => {
                setPlantasEditada(true)
                setPlantas(event.target.value)
              }}
              className="h-12 bg-card"
            />
          </Campo>
        </div>
      ) : null}

      {paso === 2 ? (
        <div className="grid gap-4">
          <Campo label="Variedad" htmlFor="variedad">
            <Input
              id="variedad"
              list="variedades"
              value={variedad}
              onChange={(event) => {
                setVariedadEditada(true)
                setVariedad(event.target.value)
              }}
              className="h-12 bg-card"
            />
            <datalist id="variedades">
              {ficha.variedades.map((opcion) => (
                <option key={opcion} value={opcion} />
              ))}
            </datalist>
          </Campo>
          <Campo label="Cobertura estimada (%)" hint="Escala el coeficiente de cultivo. 100% usa la curva de referencia completa." htmlFor="cobertura">
            <Input
              id="cobertura"
              inputMode="decimal"
              value={cobertura}
              onChange={(event) => {
                setCoberturaEditada(true)
                setCobertura(event.target.value)
              }}
              className="h-12 bg-card"
            />
          </Campo>
          <Campo label={ficha.fechaEtiqueta} hint={ficha.fechaAyuda} htmlFor="fecha">
            <Input id="fecha" type="date" value={fechaInicio} max={addDays(hoy, 370)} onChange={(event) => setFechaInicio(event.target.value)} className="h-12 bg-card" />
          </Campo>
          <Campo label="Textura del suelo" htmlFor="textura">
            <select
              id="textura"
              value={textura}
              onChange={(event) => setTextura(event.target.value as Textura)}
              className="h-12 rounded-xl border border-input bg-card px-3 text-base"
            >
              {ORDEN_TEXTURAS.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {TEXTURA_FICHA[opcion].nombre} · {TEXTURA_FICHA[opcion].mmPorM} mm/m
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Profundidad de raíces (cm)" htmlFor="profundidad">
            <Input
              id="profundidad"
              inputMode="decimal"
              value={profundidad}
              onChange={(event) => {
                setProfundidadEditada(true)
                setProfundidad(event.target.value)
              }}
              className="h-12 bg-card"
            />
          </Campo>
          <p className="rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
            {TEXTURA_FICHA[textura].nombre} guarda {TEXTURA_FICHA[textura].mmPorM} mm por metro. A {formatoNumero(num(profundidad) || 0, 0)} cm hay{" "}
            <strong>{formatoNumero(aguaMm, 1)} mm</strong> de agua disponible.
          </p>
        </div>
      ) : null}

      {paso === 3 ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            {ORDEN_SISTEMAS.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => {
                  setSistema(tipo)
                  aplicarParametros(parametrosSistema(cultivo, tipo))
                }}
                className={`rounded-2xl bg-card px-4 py-3 text-left ring-1 ${sistema === tipo ? "ring-water" : "ring-foreground/10"}`}
              >
                <span className="block font-medium">{SISTEMAS[tipo].nombre}</span>
                <span className="block text-sm text-muted-foreground">{SISTEMAS[tipo].resumen}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Caudal por emisor (L/h)" htmlFor="emisor">
              <Input id="emisor" inputMode="decimal" value={caudalEmisor} onChange={(event) => setCaudalEmisor(event.target.value)} className="h-12 bg-card" />
            </Campo>
            <Campo label="Caudal por planta (L/h)" htmlFor="planta">
              <Input id="planta" inputMode="decimal" value={caudalPlanta} onChange={(event) => setCaudalPlanta(event.target.value)} className="h-12 bg-card" />
            </Campo>
            <Campo label="Eficiencia de referencia (%)" htmlFor="eficiencia">
              <Input id="eficiencia" inputMode="decimal" value={eficiencia} onChange={(event) => setEficiencia(event.target.value)} className="h-12 bg-card" />
            </Campo>
            <Campo label="Superficie mojada (%)" htmlFor="mojada">
              <Input id="mojada" inputMode="decimal" value={mojada} onChange={(event) => setMojada(event.target.value)} className="h-12 bg-card" />
            </Campo>
            <Campo label="Ancho de mojado por emisor (m)" htmlFor="ancho">
              <Input id="ancho" inputMode="decimal" value={ancho} onChange={(event) => setAncho(event.target.value)} className="h-12 bg-card" />
            </Campo>
          </div>
          <p className="rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
            Con esta superficie mojada, cada planta tiene <strong>{formatoNumero(litros, 0)} L</strong> de agua disponible. Los valores son una referencia: ajústalos a tu instalación.
          </p>
        </div>
      ) : null}

      {errorPaso && paso > 0 ? <p className="text-sm text-destructive">{errorPaso}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        {paso > 0 ? (
          <Button type="button" variant="outline" size="xl" className="bg-card" onClick={() => setPaso((actual) => actual - 1)}>
            Atrás
          </Button>
        ) : null}
        {paso < 3 ? (
          <Button type="button" size="xl" className="flex-1" disabled={Boolean(errorPaso)} onClick={() => setPaso((actual) => actual + 1)}>
            Continuar
          </Button>
        ) : (
          <Button type="button" size="xl" className="flex-1" disabled={pending} onClick={guardar}>
            {pending ? "Creando lote…" : "Crear lote"}
          </Button>
        )}
      </div>
    </div>
  )
}

function Campo({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function num(value: string): number {
  return Number(value.trim().replace(",", "."))
}
