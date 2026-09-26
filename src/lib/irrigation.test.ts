import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { logrosAlcanzados, LOGROS, siguienteLogro } from "./achievements"
import { addDays, diffDays, todayISO } from "./dates"
import {
  aguaAplicada,
  estimarMilimetros,
  aguaDisponibleMm,
  anclaParaFecha,
  aplicarRacha,
  rachaActiva,
  balanceEnFecha,
  duracionSugeridaMin,
  fechasDeConsumo,
  kcBase,
  kcEfectivo,
  litrosDisponiblesPorPlanta,
  puntuarRiego,
  barraEfectividad,
} from "./irrigation"

describe("fechas", () => {
  it("suma días cruzando el fin de mes", () => {
    assert.equal(addDays("2026-01-30", 2), "2026-02-01")
    assert.equal(diffDays("2026-09-01", "2026-09-21"), 20)
  })

  it("usa el calendario de la Ciudad de México", () => {
    assert.equal(todayISO(new Date("2026-09-26T03:00:00Z")), "2026-09-25")
    assert.equal(todayISO(new Date("2026-09-26T18:00:00Z")), "2026-09-26")
  })
})

describe("coeficiente de cultivo", () => {
  it("interpola el ají a mitad del desarrollo", () => {
    assert.ok(Math.abs(kcBase("aji", 45) - 0.825) < 1e-9)
    assert.equal(kcBase("aji", 0), 0.6)
    assert.equal(kcBase("aji", 200), 0.9)
  })

  it("escala el maíz con la cobertura sin borrar el Kc inicial", () => {
    assert.equal(kcEfectivo("maiz", 0, 50), 0.3)
    const pleno = kcBase("maiz", 80)
    const efectivo = kcEfectivo("maiz", 80, 50)
    assert.ok(Math.abs(efectivo - (0.3 + (pleno - 0.3) * 0.5)) < 1e-9)
  })

  it("deja un piso de evaporación en el nogal con cobertura parcial", () => {
    const kc = kcBase("nogal", 120)
    const efectivo = kcEfectivo("nogal", 120, 70)
    assert.ok(Math.abs(efectivo - (0.35 + (kc - 0.35) * 0.7)) < 1e-9)
  })
})

describe("suelo y lámina", () => {
  it("calcula milímetros y litros por planta", () => {
    assert.equal(aguaDisponibleMm("franco", 70), 119)
    const litros = litrosDisponiblesPorPlanta(100, 1, 100, 40)
    assert.equal(litros, 4000)
  })

  it("separa volumen bruto y milímetros netos", () => {
    const agua = aguaAplicada({
      duracionMin: 120,
      caudalPlantaLph: 2,
      plantas: 1000,
      eficienciaPct: 90,
      superficieHa: 1,
    })
    assert.equal(agua.metrosCubicos, 4)
    assert.ok(Math.abs(agua.mmNetos - 0.36) < 1e-9)
  })

  it("estima los milímetros con la precipitación real, la superficie mojada y la eficiencia", () => {
    const estimacion = estimarMilimetros({
      duracionMin: 120,
      caudalPlantaLph: 2,
      plantas: 1000,
      superficieHa: 1,
      superficieMojadaPct: 40,
      eficienciaPct: 90,
    })
    assert.ok(Math.abs(estimacion.precipitacionMmH - 0.5) < 1e-9)
    assert.ok(Math.abs(estimacion.mmAplicar - 0.9) < 1e-9)
  })

  it("cuenta toda la duración porque el presurizado es inmediato", () => {
    const unaHora = estimarMilimetros({
      duracionMin: 60,
      caudalPlantaLph: 2,
      plantas: 1000,
      superficieHa: 1,
      superficieMojadaPct: 40,
      eficienciaPct: 90,
    })
    const horaYMedia = estimarMilimetros({
      duracionMin: 90,
      caudalPlantaLph: 2,
      plantas: 1000,
      superficieHa: 1,
      superficieMojadaPct: 40,
      eficienciaPct: 90,
    })
    assert.ok(Math.abs(horaYMedia.mmAplicar - unaHora.mmAplicar * 1.5) < 1e-9)
  })

  it("coincide con la lámina de campo cuando la superficie mojada es total", () => {
    const entrada = {
      duracionMin: 120,
      caudalPlantaLph: 2,
      plantas: 1000,
      superficieHa: 1,
      eficienciaPct: 90,
    }
    const agua = aguaAplicada(entrada)
    const estimacion = estimarMilimetros({ ...entrada, superficieMojadaPct: 100 })
    assert.ok(Math.abs(estimacion.mmAplicar - agua.mmNetos) < 1e-9)
  })

  it("sugiere la duración que repone el déficit", () => {
    const minutos = duracionSugeridaMin({
      necesariosMm: 10,
      superficieHa: 1,
      caudalPlantaLph: 2,
      plantas: 25_000,
      eficienciaPct: 90,
    })
    assert.equal(minutos, 133)
  })
})

describe("balance", () => {
  const et0 = [
    { fecha: "2026-09-01", et0Mm: 4 },
    { fecha: "2026-09-02", et0Mm: 4 },
    { fecha: "2026-09-03", et0Mm: 5 },
  ]

  it("suma desde la siembra si todavía no hay riegos", () => {
    const balance = balanceEnFecha({
      fecha: "2026-09-03",
      fechaInicio: "2026-09-02",
      fechasRiego: [],
      et0,
      tipo: "aji",
      coberturaPct: 100,
      aguaDisponibleMm: 80,
      litrosDisponiblesPorPlanta: 20,
    })
    assert.deepEqual(balance.fechas, ["2026-09-02", "2026-09-03"])
    assert.ok(balance.depletionMm > 0)
    assert.equal(balance.faltantes.length, 0)
  })

  it("reinicia el conteo el día del riego", () => {
    const balance = balanceEnFecha({
      fecha: "2026-09-03",
      fechaInicio: "2026-09-01",
      fechasRiego: ["2026-09-03"],
      et0,
      tipo: "maiz",
      coberturaPct: 100,
      aguaDisponibleMm: 100,
      litrosDisponiblesPorPlanta: 10,
    })
    assert.equal(balance.depletionMm, 0)
    assert.equal(balance.fraccion, 1)
  })

  it("marca los días sin ET0", () => {
    const fechas = fechasDeConsumo("2026-09-01", null, "2026-09-03")
    assert.deepEqual(fechas, ["2026-09-01", "2026-09-02", "2026-09-03"])
    const balance = balanceEnFecha({
      fecha: "2026-09-03",
      fechaInicio: "2026-09-01",
      fechasRiego: [],
      et0: [{ fecha: "2026-09-02", et0Mm: 4 }],
      tipo: "maiz",
      coberturaPct: 100,
      aguaDisponibleMm: 100,
      litrosDisponiblesPorPlanta: 10,
    })
    assert.deepEqual(balance.faltantes, ["2026-09-01", "2026-09-03"])
  })

  it("ancla el déficit en un riego del mismo día", () => {
    assert.equal(anclaParaFecha(["2026-09-01", "2026-09-10"], "2026-09-10"), "2026-09-10")
    assert.equal(anclaParaFecha(["2026-09-01", "2026-09-20"], "2026-09-10"), "2026-09-01")
  })
})

describe("barra de efectividad", () => {
  it("se llena en amarillo mientras los milímetros quedan bajo el 10%", () => {
    assert.deepEqual(barraEfectividad(10, 0), { color: "amarillo", fraccion: 0 })
    const media = barraEfectividad(10, 5)
    assert.equal(media.color, "amarillo")
    assert.ok(Math.abs(media.fraccion - 0.5) < 1e-9)
  })

  it("pasa a verde dentro del margen de 10%", () => {
    const justo = barraEfectividad(10, 10)
    assert.equal(justo.color, "verde")
    assert.ok(Math.abs(justo.fraccion - 1) < 1e-9)
    assert.equal(barraEfectividad(10, 9.2).color, "verde")
    assert.equal(barraEfectividad(10, 10.8).color, "verde")
  })

  it("se pone roja y completa cuando el riego es excesivo", () => {
    assert.deepEqual(barraEfectividad(10, 12), { color: "rojo", fraccion: 1 })
    assert.deepEqual(barraEfectividad(0, 4), { color: "rojo", fraccion: 1 })
  })
})

describe("eficiencia", () => {
  it("acepta un margen de 10% y rechaza lo que queda fuera", () => {
    const exacto = puntuarRiego(20, 20)
    assert.equal(exacto.puntuacion, 100)
    assert.equal(exacto.resultado, "adecuado")

    const limite = puntuarRiego(20, 22)
    assert.equal(limite.puntuacion, 90)
    assert.equal(limite.resultado, "adecuado")
    assert.equal(limite.motivo, "exceso")

    const corto = puntuarRiego(20, 18)
    assert.equal(corto.resultado, "adecuado")
    assert.equal(corto.motivo, "deficit")

    const exceso = puntuarRiego(20, 22.2)
    assert.equal(exceso.resultado, "ineficiente")
    assert.equal(exceso.motivo, "exceso")
    assert.equal(exceso.puntuacion, 89)

    const deficit = puntuarRiego(20, 17)
    assert.equal(deficit.resultado, "ineficiente")
    assert.equal(deficit.motivo, "deficit")
  })

  it("trata como exceso regar un suelo lleno", () => {
    const lleno = puntuarRiego(0, 5)
    assert.equal(lleno.resultado, "ineficiente")
    assert.equal(lleno.puntuacion, 0)
  })

  it("no pide más agua de la que el suelo puede guardar", () => {
    const balance = balanceEnFecha({
      fecha: "2026-09-03",
      fechaInicio: "2026-09-01",
      fechasRiego: [],
      et0: [
        { fecha: "2026-09-01", et0Mm: 40 },
        { fecha: "2026-09-02", et0Mm: 40 },
        { fecha: "2026-09-03", et0Mm: 40 },
      ],
      tipo: "aji",
      coberturaPct: 100,
      aguaDisponibleMm: 30,
      litrosDisponiblesPorPlanta: 10,
    })
    assert.ok(balance.depletionMm > 30)
    assert.equal(balance.necesariosMm, 30)
    assert.equal(balance.remanenteMm, 0)
  })
})

describe("racha", () => {
  const hoy = "2026-09-26"

  it("guarda el primer riego de hoy y activa la racha al segundo día", () => {
    const primero = aplicarRacha({ actual: 0, ultimaFecha: null }, hoy, hoy)
    assert.equal(primero.actual, 1)
    assert.equal(primero.cambio, "inicia")
    assert.equal(rachaActiva(primero.actual), false)

    const segundo = aplicarRacha({ actual: 1, ultimaFecha: "2026-09-25" }, hoy, hoy)
    assert.equal(segundo.actual, 2)
    assert.equal(segundo.cambio, "suma")
    assert.equal(rachaActiva(segundo.actual), true)
  })

  it("suma si ayer también se anotó en el día", () => {
    const racha = aplicarRacha({ actual: 3, ultimaFecha: "2026-09-25" }, hoy, hoy)
    assert.equal(racha.actual, 4)
    assert.equal(racha.cambio, "suma")
  })

  it("se mantiene con otro riego del mismo día", () => {
    const racha = aplicarRacha({ actual: 4, ultimaFecha: hoy }, hoy, hoy)
    assert.equal(racha.actual, 4)
    assert.equal(racha.cambio, "mantiene")
  })

  it("se rompe con una fecha previa y no continúa tras un hueco", () => {
    const rota = aplicarRacha({ actual: 4, ultimaFecha: "2026-09-25" }, "2026-09-24", hoy)
    assert.equal(rota.actual, 0)
    assert.equal(rota.rota, true)

    const hueco = aplicarRacha({ actual: 4, ultimaFecha: "2026-09-20" }, hoy, hoy)
    assert.equal(hueco.actual, 1)
    assert.equal(hueco.cambio, "inicia")
  })
})

describe("logros", () => {
  it("ordenan los umbrales y nombran cuerpos de agua de México", () => {
    for (let index = 1; index < LOGROS.length; index += 1) {
      assert.ok(LOGROS[index].umbralM3 > LOGROS[index - 1].umbralM3)
    }
    const nuevos = logrosAlcanzados(450, ["presa-san-jose"])
    assert.deepEqual(
      nuevos.map((logro) => logro.codigo),
      ["presa-el-palote"],
    )
    assert.equal(siguienteLogro(450)?.codigo, "presa-madin")
    assert.equal(siguienteLogro(2_000_000), null)
  })
})
