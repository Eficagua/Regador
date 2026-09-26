import { cn } from "cn"
import type { CultivoTipo } from "@/lib/irrigation"

const imagen: Record<CultivoTipo, string> = {
  aji: "/cultivos/aji.png",
  nogal: "/cultivos/nuez-pecana.png",
  maiz: "/cultivos/maiz.png",
  manzana: "/cultivos/manzana.png",
}

export function imagenDeCultivo(nombre: string): string | null {
  const clave = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  if (clave.includes("nuez") || clave.includes("nogal") || clave.includes("pecan")) return imagen.nogal
  if (clave.includes("aji") || clave.includes("chile")) return imagen.aji
  if (clave.includes("maiz")) return imagen.maiz
  if (clave.includes("manzana")) return imagen.manzana
  return null
}

export function CropIcon({
  tipo,
  className,
}: {
  tipo: CultivoTipo
  className?: string
}) {
  return (
    <img
      src={imagen[tipo]}
      alt=""
      width={512}
      height={512}
      className={cn("size-12 shrink-0 object-contain", className)}
    />
  )
}
