import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { comentarioConDictado, conConfirmado, conParcial, dictadoVacio, textoDictado } from "./dictado"

describe("texto del dictado", () => {
  it("usa el parcial mientras la frase sigue abierta", () => {
    const estado = conParcial(dictadoVacio(), "  apliqué urea  ")
    assert.equal(textoDictado(estado), "apliqué urea")
  })

  it("conserva lo ya cerrado y le suma el parcial nuevo", () => {
    let estado = conConfirmado(conParcial(dictadoVacio(), "apliqué urea"), "apliqué urea")
    estado = conParcial(estado, "y potasio")
    assert.equal(textoDictado(estado), "apliqué urea y potasio")
  })

  it("no repite la frase cuando el confirmado coincide con el parcial", () => {
    const estado = conConfirmado(conParcial(dictadoVacio(), "apliqué urea y potasio"), "apliqué urea")
    assert.equal(textoDictado(estado), "apliqué urea y potasio")
  })

  it("agrega cada comando de voz al comentario que ya estaba escrito", () => {
    let comentario = "Nota previa"
    let base = comentario
    const aplicar = (dictado: string) => {
      comentario = comentarioConDictado(base, dictado)
    }

    aplicar("apliqué urea")
    aplicar("apliqué urea y potasio")
    assert.equal(comentario, "Nota previa apliqué urea y potasio")

    base = comentario
    aplicar("en el tanque")
    assert.equal(comentario, "Nota previa apliqué urea y potasio en el tanque")
  })

  it("deja el comentario intacto si el dictado vuelve a quedar vacío", () => {
    assert.equal(comentarioConDictado("Nota previa", "   "), "Nota previa")
  })

  it("no borra la frase si llega un parcial vacío", () => {
    const conFrase = conParcial(dictadoVacio(), "apliqué urea")
    assert.equal(textoDictado(conParcial(conFrase, " ")), "apliqué urea")
  })
})
