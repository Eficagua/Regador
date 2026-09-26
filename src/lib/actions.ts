"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logrosAlcanzados } from "@/lib/achievements"
import { hoyDeCampo, syncEt0 } from "@/lib/et0"
import {
  aguaAplicada,
  aguaDisponibleMm,
  aplicarRacha,
  balanceEnFecha,
  litrosDisponiblesPorPlanta,
  puntuarRiego,
  type CultivoTipo,
} from "@/lib/irrigation"
import { prisma } from "@/lib/prisma"
import { campoDeUsuario, loteDeUsuario, metrosDelCampo, requireUser } from "@/lib/queries"
import { campoSchema, loteSchema, mensajeZod, riegoSchema } from "@/lib/schemas"
import { cerrarSesion, establecerSesion } from "@/lib/session"
import { asegurarTemporadaEjemplo } from "@/lib/temporada-ejemplo"

const CUENTA_EJEMPLO = {
  email: "ejemplo@lamina.test",
  nombre: "Ana Ruiz",
  proveedor: "ejemplo",
} as const

const CORREO_DEMO_PREVIO = "ana.ruiz@correo.test"

export async function entrarEjemplo() {
  const usuario = await asegurarCuentaEjemplo()
  await establecerSesion(usuario.id)
  await asegurarTemporadaEjemplo(usuario.id)
  const campo = await prisma.campo.findFirst({ where: { usuarioId: usuario.id } })
  redirect(campo ? "/inicio" : "/onboarding")
}

async function asegurarCuentaEjemplo() {
  const existente = await prisma.usuario.findUnique({ where: { email: CUENTA_EJEMPLO.email } })
  if (existente) {
    if (existente.nombre !== CUENTA_EJEMPLO.nombre || existente.proveedor !== CUENTA_EJEMPLO.proveedor) {
      return prisma.usuario.update({
        where: { id: existente.id },
        data: { nombre: CUENTA_EJEMPLO.nombre, proveedor: CUENTA_EJEMPLO.proveedor },
      })
    }
    return existente
  }

  const previo = await prisma.usuario.findUnique({ where: { email: CORREO_DEMO_PREVIO } })
  if (previo) {
    return prisma.usuario.update({
      where: { id: previo.id },
      data: CUENTA_EJEMPLO,
    })
  }

  return prisma.usuario.create({ data: CUENTA_EJEMPLO })
}

export async function salir() {
  await cerrarSesion()
  redirect("/")
}

export async function crearCampo(_prev: { error: string } | null, formData: FormData) {
  const user = await requireUser()
  const existente = await prisma.campo.findFirst({ where: { usuarioId: user.id } })
  if (existente) redirect("/onboarding")
  const parsed = campoSchema.safeParse({
    nombre: formData.get("nombre"),
    lat: numero(formData.get("lat")),
    lng: numero(formData.get("lng")),
  })
  if (!parsed.success) return { error: mensajeZod(parsed.error) }
  await prisma.campo.create({
    data: {
      usuarioId: user.id,
      nombre: parsed.data.nombre,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    },
  })
  revalidatePath("/onboarding")
  redirect("/onboarding")
}

export async function actualizarCampo(_prev: { error: string } | null, formData: FormData) {
  const user = await requireUser()
  const campo = await prisma.campo.findFirst({ where: { usuarioId: user.id } })
  if (!campo) redirect("/onboarding")
  const parsed = campoSchema.safeParse({
    nombre: formData.get("nombre"),
    lat: numero(formData.get("lat")),
    lng: numero(formData.get("lng")),
  })
  if (!parsed.success) return { error: mensajeZod(parsed.error) }
  const movio =
    Math.abs(parsed.data.lat - campo.lat) > 0.0001 || Math.abs(parsed.data.lng - campo.lng) > 0.0001
  await prisma.campo.update({
    where: { id: campo.id },
    data: parsed.data,
  })
  if (movio) {
    await prisma.et0Diario.deleteMany({ where: { campoId: campo.id } })
  }
  revalidatePath("/campo")
  revalidatePath("/inicio")
  redirect("/campo")
}

export async function crearLote(input: unknown) {
  const user = await requireUser()
  const campo = await prisma.campo.findFirst({ where: { usuarioId: user.id } })
  if (!campo) return { error: "Primero crea tu campo." }
  const parsed = loteSchema.safeParse(input)
  if (!parsed.success) return { error: mensajeZod(parsed.error) }
  const lote = parsed.data
  const aguaMm = aguaDisponibleMm(lote.textura, lote.profundidadCm)
  const litros = litrosDisponiblesPorPlanta(
    aguaMm,
    lote.superficieHa,
    lote.plantas,
    lote.superficieMojadaPct,
  )
  await prisma.$transaction(async (tx) => {
    const creado = await tx.loteRiego.create({
      data: {
        campoId: campo.id,
        nombre: lote.nombre,
        superficieHa: lote.superficieHa,
        plantas: lote.plantas,
      },
    })
    await tx.cultivo.create({
      data: {
        loteId: creado.id,
        tipo: lote.cultivo,
        variedad: lote.variedad,
        coberturaPct: lote.coberturaPct,
        fechaInicio: lote.fechaInicio,
      },
    })
    await tx.suelo.create({
      data: {
        loteId: creado.id,
        textura: lote.textura,
        profundidadCm: lote.profundidadCm,
        aguaDisponibleMm: aguaMm,
        litrosDisponiblesPorPlanta: litros,
      },
    })
    await tx.sistemaRiego.create({
      data: {
        loteId: creado.id,
        tipo: lote.sistema,
        caudalEmisorLph: lote.caudalEmisorLph,
        caudalPlantaLph: lote.caudalPlantaLph,
        eficienciaPct: lote.eficienciaPct,
        superficieMojadaPct: lote.superficieMojadaPct,
        anchoMojadoM: lote.anchoMojadoM,
      },
    })
  })
  revalidatePath("/inicio")
  redirect("/inicio")
}

export async function registrarRiego(_prev: { error: string } | null, formData: FormData) {
  const user = await requireUser()
  const loteId = String(formData.get("loteId") || "")
  const lote = await loteDeUsuario(user.id, loteId)
  if (!lote || !lote.cultivo || !lote.suelo || !lote.sistema) {
    return { error: "No encontramos ese lote." }
  }
  const parsed = riegoSchema.safeParse({
    fecha: formData.get("fecha"),
    horas: numero(formData.get("horas")),
    minutos: numero(formData.get("minutos")),
    insumos: String(formData.get("insumos") || ""),
  })
  if (!parsed.success) return { error: mensajeZod(parsed.error) }
  const hoy = hoyDeCampo()
  if (parsed.data.fecha > hoy) return { error: "La fecha del riego no puede ser futura." }
  if (parsed.data.fecha < lote.cultivo.fechaInicio) {
    return { error: "Ese riego es anterior al inicio del cultivo." }
  }
  const duracionMin = parsed.data.horas * 60 + parsed.data.minutos
  if (duracionMin < 1) return { error: "Indica cuánto tiempo duró el riego." }
  if (duracionMin > 240 * 60) return { error: "La duración máxima es de 240 horas." }

  const et = await syncEt0(lote.campoId, lote.campo.lat, lote.campo.lng, lote.cultivo.fechaInicio, parsed.data.fecha)
  if (et.days.length === 0 && et.error) {
    return { error: "No pudimos estimar la evapotranspiración. Reintenta en un momento." }
  }
  const balance = balanceEnFecha({
    fecha: parsed.data.fecha,
    fechaInicio: lote.cultivo.fechaInicio,
    fechasRiego: lote.riegos.map((riego) => riego.fecha),
    et0: et.days,
    tipo: lote.cultivo.tipo as CultivoTipo,
    coberturaPct: lote.cultivo.coberturaPct,
    aguaDisponibleMm: lote.suelo.aguaDisponibleMm,
    litrosDisponiblesPorPlanta: lote.suelo.litrosDisponiblesPorPlanta,
  })
  if (balance.fechas.length > 0 && balance.faltantes.length === balance.fechas.length) {
    return { error: "Faltan datos de evapotranspiración para puntuar este riego." }
  }

  const agua = aguaAplicada({
    duracionMin,
    caudalPlantaLph: lote.sistema.caudalPlantaLph,
    plantas: lote.plantas,
    eficienciaPct: lote.sistema.eficienciaPct,
    superficieHa: lote.superficieHa,
  })
  const nota = puntuarRiego(balance.necesariosMm, agua.mmNetos)
  const racha = aplicarRacha(
    { actual: user.rachaActual, ultimaFecha: user.rachaUltimaFecha },
    parsed.data.fecha,
    hoy,
  )
  const totalPrevio = metrosDelCampo(lote.campo)
  const total = totalPrevio + agua.metrosCubicos
  const nuevos = logrosAlcanzados(
    total,
    lote.campo.logros.map((logro) => logro.codigo),
  )
  const insumos = parsed.data.insumos?.trim() ? parsed.data.insumos.trim() : null

  const riego = await prisma.$transaction(async (tx) => {
    const creado = await tx.riego.create({
      data: {
        loteId: lote.id,
        fecha: parsed.data.fecha,
        duracionMin,
        descripcionInsumos: insumos,
        mmAplicados: agua.mmNetos,
        metrosCubicos: agua.metrosCubicos,
        mmDeficitAntes: balance.depletionMm,
        mmNecesarios: balance.necesariosMm,
        puntuacion: nota.puntuacion,
        resultado: nota.resultado,
        motivo: nota.motivo,
        rachaAntes: user.rachaActual,
        rachaResultante: racha.actual,
        rachaRota: racha.rota,
        logrosJson: JSON.stringify(nuevos.map((logro) => logro.codigo)),
      },
    })
    await tx.usuario.update({
      where: { id: user.id },
      data: { rachaActual: racha.actual, rachaUltimaFecha: racha.ultimaFecha },
    })
    for (const logro of nuevos) {
      await tx.logroCampo.create({
        data: { campoId: lote.campoId, codigo: logro.codigo, metrosCubicos: total },
      })
    }
    return creado
  })

  revalidatePath("/inicio")
  revalidatePath("/logros")
  revalidatePath(`/lotes/${lote.id}`)
  redirect(`/lotes/${lote.id}/riegos/${riego.id}`)
}

export async function refrescarClima() {
  const user = await requireUser()
  const campo = await campoDeUsuario(user.id)
  if (!campo) redirect("/onboarding")
  await prisma.et0Diario.deleteMany({ where: { campoId: campo.id } })
  revalidatePath("/", "layout")
}

function numero(value: FormDataEntryValue | null): number {
  return Number(String(value ?? "").trim().replace(",", "."))
}
