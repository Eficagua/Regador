"use client"

import { useEffect, useRef, useState } from "react"
import { CommitStrategy, RealtimeEvents, Scribe, type RealtimeConnection } from "@elevenlabs/client"
import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ComentarioPorVoz({ onCommitted }: { onCommitted: (texto: string) => void }) {
  const [estado, setEstado] = useState<"idle" | "conectando" | "escuchando">("idle")
  const [parcial, setParcial] = useState("")
  const [error, setError] = useState<string | null>(null)
  const conexion = useRef<RealtimeConnection | null>(null)
  const turno = useRef(0)
  const alConfirmar = useRef(onCommitted)
  alConfirmar.current = onCommitted

  useEffect(() => {
    return () => {
      turno.current += 1
      conexion.current?.close()
      conexion.current = null
    }
  }, [])

  function detener() {
    turno.current += 1
    conexion.current?.close()
    conexion.current = null
    setEstado("idle")
    setParcial("")
  }

  async function alternar() {
    if (estado !== "idle" || conexion.current) {
      detener()
      return
    }

    const actual = ++turno.current
    setError(null)
    setParcial("")
    setEstado("conectando")

    try {
      const respuesta = await fetch("/api/scribe-token", { method: "POST" })
      const data = (await respuesta.json().catch(() => null)) as { token?: string; error?: string } | null
      if (turno.current !== actual) return
      if (!respuesta.ok || !data?.token) {
        setError(data?.error ?? "No se pudo abrir el dictado.")
        setEstado("idle")
        return
      }

      const connection = Scribe.connect({
        token: data.token,
        modelId: "scribe_v2_realtime",
        languageCode: "es",
        commitStrategy: CommitStrategy.VAD,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      if (turno.current !== actual) {
        connection.close()
        return
      }
      conexion.current = connection

      connection.on(RealtimeEvents.OPEN, () => {
        if (turno.current === actual) setEstado("escuchando")
      })
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (evento) => {
        if (turno.current === actual) setParcial(evento.text)
      })
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (evento) => {
        const texto = evento.text.trim()
        if (texto) alConfirmar.current(texto)
        if (turno.current === actual) setParcial("")
      })
      connection.on(RealtimeEvents.ERROR, (evento) => {
        if (turno.current !== actual) return
        setError(mensajeDictado(evento.error))
        setEstado("idle")
        setParcial("")
        turno.current += 1
        if (conexion.current === connection) conexion.current = null
        connection.close()
      })
      connection.on(RealtimeEvents.CLOSE, () => {
        if (conexion.current === connection) conexion.current = null
        if (turno.current !== actual) return
        setEstado("idle")
        setParcial("")
      })
    } catch {
      if (turno.current !== actual) return
      conexion.current?.close()
      conexion.current = null
      setError("No se pudo activar el micrófono.")
      setEstado("idle")
    }
  }

  const escuchando = estado === "escuchando"
  const conectando = estado === "conectando"

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={escuchando ? "destructive" : "outline"}
        className={escuchando ? undefined : "bg-card"}
        onClick={alternar}
        aria-pressed={escuchando}
      >
        {escuchando ? <Square /> : <Mic />}
        {conectando ? "Conectando micrófono…" : escuchando ? "Detener voz" : "Comando de voz"}
      </Button>
      {parcial ? (
        <p className="rounded-2xl bg-[#e7f1f8] px-3 py-2 text-sm text-water-deep" aria-live="polite">
          {parcial}
        </p>
      ) : escuchando ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Escuchando. El texto aparece aquí y se agrega al comentario.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function mensajeDictado(raw: string): string {
  if (/notallowed|permission|denied|notallowederror/i.test(raw)) {
    return "El navegador no dio permiso para usar el micrófono."
  }
  if (/notfound|device/i.test(raw)) {
    return "No encontramos un micrófono en este dispositivo."
  }
  if (/ELEVENLABS_API_KEY|token/i.test(raw)) {
    return raw
  }
  return "El dictado se interrumpió. Intenta otra vez."
}
