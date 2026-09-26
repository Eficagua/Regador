import { prisma } from "@/lib/prisma"
import { TEMPORADA_EJEMPLO_NUEZ } from "@/lib/temporadas"

const CORREO_EJEMPLO = "ejemplo@lamina.test"

export async function asegurarTemporadaEjemplo(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
  if (!usuario || usuario.email !== CORREO_EJEMPLO) return
  const campo = await prisma.campo.findFirst({ where: { usuarioId } })
  if (!campo) return
  await prisma.temporada.upsert({
    where: {
      campoId_cultivo_anio: {
        campoId: campo.id,
        cultivo: TEMPORADA_EJEMPLO_NUEZ.cultivo,
        anio: TEMPORADA_EJEMPLO_NUEZ.anio,
      },
    },
    update: {
      cosechaKg: TEMPORADA_EJEMPLO_NUEZ.cosechaKg,
      riegoM3: TEMPORADA_EJEMPLO_NUEZ.riegoM3,
      lluviaMm: TEMPORADA_EJEMPLO_NUEZ.lluviaMm,
      productividadLporKg: TEMPORADA_EJEMPLO_NUEZ.productividadLporKg,
    },
    create: {
      campoId: campo.id,
      cultivo: TEMPORADA_EJEMPLO_NUEZ.cultivo,
      anio: TEMPORADA_EJEMPLO_NUEZ.anio,
      cosechaKg: TEMPORADA_EJEMPLO_NUEZ.cosechaKg,
      riegoM3: TEMPORADA_EJEMPLO_NUEZ.riegoM3,
      lluviaMm: TEMPORADA_EJEMPLO_NUEZ.lluviaMm,
      productividadLporKg: TEMPORADA_EJEMPLO_NUEZ.productividadLporKg,
    },
  })
}
