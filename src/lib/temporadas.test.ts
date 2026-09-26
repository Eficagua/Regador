import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { agruparTemporadas } from "./temporadas"

describe("temporadas", () => {
  it("separa los resultados por cultivo y deja el año más reciente primero", () => {
    const grupos = agruparTemporadas([
      { cultivo: "Nuez pecana", anio: 2024, cosechaKg: 1 },
      { cultivo: "Ají", anio: 2025, cosechaKg: 2 },
      { cultivo: "Nuez pecana", anio: 2025, cosechaKg: 3 },
    ])
    assert.deepEqual(
      grupos.map((grupo) => ({ cultivo: grupo.cultivo, anios: grupo.filas.map((fila) => fila.anio) })),
      [
        { cultivo: "Ají", anios: [2025] },
        { cultivo: "Nuez pecana", anios: [2025, 2024] },
      ],
    )
  })
})
