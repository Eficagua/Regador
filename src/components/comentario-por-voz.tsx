"use client"

import { useEffect, useRef, useState } from "react"
import { CommitStrategy, RealtimeEvents, Scribe, type RealtimeConnection } from "@elevenlabs/client"
import { Mic, Square } from "lucide-react"
import { conConfirmado, conParcial, dictadoVacio, textoDictado, type DictadoEnCurso } from "@/lib/dictado"
import { Button } from "@/components/ui/button"

export function ComentarioPorVoz({
  onSessionStart,
  onTranscript,
  onSessionEnd,
}: {
  onSessionStart: () => void
  onTranscript: (texto: string) => void
  onSessionEnd: () => void
}) {
  const [estado, setEstado] = useState<"idle" | "conectando" | "escuchando">("idle")
  const [parcial, setParcial] = useState("")
  const [error, setError] = useState<string | null>(null)
  const conexion = useRef<RealtimeConnection | null>(null)
  const turno = useRef(0)
  const curso = useRef<DictadoEnCurso>(dictadoVacio())
  const ultimo = useRef("")
  const viva = useRef(false)
  const cerrando = useRef(false)
  const alEmpezar = useRef(onSessionStart)
  const alTranscribir = useRef(onTranscript)
  const alTerminar = useRef(onSessionEnd)
  alEmpezar.current = onSessionStart
  alTranscribir.current = onTranscript
  alTerminar.current = onSessionEnd

  function emitir() {
    const texto = textoDictado(curso.current)
    if (texto === ultimo.current) return
    ultimo.current = texto
    alTranscribir.current(texto)
  }

  function finalizar(actual: number) {
    if (turno.current !== actual) return
    turno.current += 1
    emitir()
    curso.current = dictadoVacio()
    ultimo.current = ""
    if (viva.current) {
      viva.current = false
      cerrando.current = false
      alTerminar.current()
    }
    const connection = conexion.current
    conexion.current = null
    connection?.close()
    setEstado("idle")
    setParcial("")
  }

  useEffect(() => {
    return () => {
      turno.current += 1
      viva.current = false
      conexion.current?.close()
      conexion.current = null
    }
  }, [])

  async function alternar() {
    if (estado !== "idle" || conexion.current || viva.current) {
      if (cerrando.current) return
      const actual = turno.current
      const connection = conexion.current
      if (connection && estado === "escuchando") {
        cerrando.current = true
        try {
          connection.commit()
        } catch {
          // Si el socket ya no está abierto, el parcial que se mostró sigue en el comentario.
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      finalizar(actual)
      return
    }

    const actual = ++turno.current
    curso.current = dictadoVacio()
    ultimo.current = ""
    viva.current = true
    alEmpezar.current()
    setError(null)
    setParcial("")
    setEstado("conectando")

    try {
      const respuesta = await fetch("/api/scribe-token", { method: "POST" })
      const data = (await respuesta.json().catch(() => null)) as { token?: string; error?: string } | null
      if (turno.current !== actual) return
      if (!respuesta.ok || !data?.token) {
        setError(data?.error ?? "No se pudo abrir el dictado.")
        finalizar(actual)
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
        if (turno.current !== actual) return
        curso.current = conParcial(curso.current, evento.text ?? "")
        setParcial(curso.current.parcial)
        emitir()
      })
      connection.on(RealtimeEvents.FINAL_TRANSCRIPT, (evento) => {
        if (turno.current !== actual) return
        curso.current = conParcial(curso.current, evento.text ?? "")
        setParcial(curso.current.parcial)
        emitir()
      })
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (evento) => {
        if (turno.current !== actual) return
        curso.current = conConfirmado(curso.current, evento.text ?? "")
        setParcial(curso.current.parcial)
        emitir()
      })
      connection.on(RealtimeEvents.ERROR, (evento) => {
        if (turno.current !== actual) return
        setError(mensajeDictado(evento.error))
        finalizar(actual)
      })
      connection.on(RealtimeEvents.CLOSE, () => {
        if (turno.current !== actual) return
        finalizar(actual)
      })
    } catch {
      if (turno.current !== actual) return
      setError("No se pudo activar el micrófono.")
      finalizar(actual)
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
          Escuchando. El texto se escribe en el comentario y se suma a lo que ya estaba.
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
