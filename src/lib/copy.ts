import { formatoNumero } from "@/lib/dates"
import type { MotivoRiego, ResultadoRiego } from "@/lib/irrigation"

export function textoPuntuacion(input: {
  resultado: ResultadoRiego
  motivo: MotivoRiego
  mmAplicados: number
  mmNecesarios: number
  mmDeficitAntes: number
}): { titulo: string; detalle: string } {
  const aplicados = formatoNumero(input.mmAplicados, 1)
  const necesarios = formatoNumero(input.mmNecesarios, 1)
  const perdidos = formatoNumero(input.mmDeficitAntes, 1)

  if (input.mmNecesarios <= 0.05 && input.motivo === "exceso") {
    return {
      titulo: "Riego ineficiente",
      detalle: `El suelo estaba en capacidad de campo. Los ${aplicados} mm netos no tenían dónde guardarse.`,
    }
  }

  if (input.resultado === "adecuado") {
    return {
      titulo: "Riego adecuado",
      detalle: `Aplicaste ${aplicados} mm netos y el suelo podía recibir ${necesarios} mm. La diferencia queda dentro del margen de 10%.`,
    }
  }

  if (input.motivo === "exceso") {
    const extra =
      input.mmDeficitAntes > input.mmNecesarios + 0.5
        ? ` La evapotranspiración sumaba ${perdidos} mm, pero el suelo solo podía guardar ${necesarios} mm.`
        : ""
    return {
      titulo: "Riego ineficiente",
      detalle: `Aplicaste ${aplicados} mm netos, más de 10% por encima de los ${necesarios} mm que el suelo tenía libres.${extra}`,
    }
  }

  return {
    titulo: "Riego ineficiente",
    detalle: `Aplicaste ${aplicados} mm netos, más de 10% por debajo de los ${necesarios} mm que el suelo tenía libres.`,
  }
}

export function textoRacha(input: {
  rachaRota: boolean
  rachaAntes: number
  rachaResultante: number
}): string {
  if (input.rachaRota) {
    return "Anotaste un riego con fecha anterior a hoy. La racha se rompió."
  }
  if (input.rachaResultante >= 2 && input.rachaAntes < 2) {
    return "La racha empieza en 2 días. Sigue sumando cada día que el riego se registre a tiempo."
  }
  if (input.rachaResultante > input.rachaAntes) {
    return `La racha llega a ${input.rachaResultante} días.`
  }
  if (input.rachaResultante >= 2) {
    return `La racha se mantiene en ${input.rachaResultante} días. Este riego también es de hoy.`
  }
  if (input.rachaAntes > 0) {
    return "Este riego también es de hoy. La racha aparece al segundo día seguido a tiempo."
  }
  return "Este riego es de hoy. La racha se acumula desde el segundo día seguido a tiempo."
}
