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
  if (input.rachaResultante > input.rachaAntes) {
    if (input.rachaResultante === 1) {
      return "Empieza una racha de 1 día. Se mantiene si el siguiente riego se anota el mismo día en que ocurre."
    }
    return `La racha llega a ${input.rachaResultante} días.`
  }
  return `La racha se mantiene en ${input.rachaResultante} días. Este riego también es de hoy.`
}
