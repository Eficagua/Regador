import { z } from "zod"
import { addDays, todayISO } from "@/lib/dates"
import { CULTIVO_TIPOS, SISTEMA_TIPOS, TEXTURAS } from "@/lib/irrigation"

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Usa una fecha válida.")

export const campoSchema = z.object({
  nombre: z.string().trim().min(2, "Ponle un nombre al campo.").max(60, "Usa un nombre más corto."),
  lat: z.number().gte(-90, "La latitud no es válida.").lte(90, "La latitud no es válida."),
  lng: z.number().gte(-180, "La longitud no es válida.").lte(180, "La longitud no es válida."),
})

export const loteSchema = z
  .object({
    nombre: z.string().trim().min(2, "Ponle un nombre al lote.").max(60, "Usa un nombre más corto."),
    superficieHa: z
      .number()
      .gt(0, "La superficie tiene que ser mayor a 0.")
      .lte(5000, "La superficie es demasiado grande."),
    plantas: z.number().int("Las plantas tienen que ser un número entero.").positive("Indica al menos una planta."),
    cultivo: z.enum(CULTIVO_TIPOS),
    variedad: z.string().trim().min(2, "Indica la variedad.").max(60, "Usa un nombre de variedad más corto."),
    coberturaPct: z.number().gte(1, "La cobertura mínima es 1%.").lte(100, "La cobertura máxima es 100%."),
    fechaInicio: fecha,
    textura: z.enum(TEXTURAS),
    profundidadCm: z
      .number()
      .gte(10, "La profundidad mínima es 10 cm.")
      .lte(300, "La profundidad máxima es 300 cm."),
    sistema: z.enum(SISTEMA_TIPOS),
    caudalEmisorLph: z.number().positive("El caudal del emisor tiene que ser mayor a 0."),
    caudalPlantaLph: z.number().positive("El caudal por planta tiene que ser mayor a 0."),
    eficienciaPct: z.number().gt(0, "La eficiencia tiene que ser mayor a 0.").lte(100, "La eficiencia máxima es 100%."),
    superficieMojadaPct: z
      .number()
      .gt(0, "La superficie mojada tiene que ser mayor a 0.")
      .lte(100, "La superficie mojada máxima es 100%."),
    anchoMojadoM: z.number().positive("El ancho de mojado tiene que ser mayor a 0.").lte(80),
  })
  .superRefine((lote, contexto) => {
    const hoy = todayISO()
    if (lote.fechaInicio > addDays(hoy, 370)) {
      contexto.addIssue({
        code: "custom",
        path: ["fechaInicio"],
        message: "El inicio queda demasiado lejos.",
      })
    }
    if (lote.fechaInicio < addDays(hoy, -760)) {
      contexto.addIssue({
        code: "custom",
        path: ["fechaInicio"],
        message: "Usa un inicio dentro de los últimos dos años.",
      })
    }
  })

export const riegoSchema = z.object({
  fecha: fecha,
  horas: z.number().int().gte(0).lte(240),
  minutos: z.number().int().gte(0).lte(59),
  insumos: z.string().trim().max(2000, "El comentario es demasiado largo.").optional(),
})

export function mensajeZod(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos."
}
