export type DictadoEnCurso = {
  confirmados: string[]
  parcial: string
}

export function dictadoVacio(): DictadoEnCurso {
  return { confirmados: [], parcial: "" }
}

export function conParcial(estado: DictadoEnCurso, parcial: string): DictadoEnCurso {
  const texto = parcial ?? ""
  if (!texto.trim() && estado.parcial.trim()) return estado
  return { confirmados: estado.confirmados, parcial: texto }
}

export function conConfirmado(estado: DictadoEnCurso, texto: string): DictadoEnCurso {
  const limpio = texto.trim()
  if (!limpio) return { confirmados: estado.confirmados, parcial: "" }
  const pendiente = estado.parcial.trim()
  const mismaFrase =
    !pendiente || pendiente === limpio || limpio.startsWith(pendiente) || pendiente.startsWith(limpio)
  if (!mismaFrase) return { confirmados: [...estado.confirmados, limpio], parcial: estado.parcial }
  const mejor = limpio.length >= pendiente.length ? limpio : pendiente
  return { confirmados: [...estado.confirmados, mejor], parcial: "" }
}

export function textoDictado(estado: DictadoEnCurso): string {
  const partes = estado.confirmados.map((texto) => texto.trim()).filter(Boolean)
  const pendiente = estado.parcial.trim()
  if (pendiente && partes[partes.length - 1] !== pendiente) partes.push(pendiente)
  return partes.join(" ")
}

export function comentarioConDictado(base: string, dictado: string): string {
  const extra = dictado.trim()
  const previo = base.replace(/\s+$/, "")
  if (!extra) return previo
  if (!previo.trim()) return extra
  return `${previo} ${extra}`
}
