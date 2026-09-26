# Lámina

Bitácora de riego para un campo. La demostración entra con la cuenta de ejemplo de Ana Ruiz, marca el campo en el mapa y crea lotes de ají, nogal, maíz o manzana. Cada lote guarda un cultivo, un suelo y un sistema de riego. En el inicio, la barra azul muestra el agua que todavía le queda al suelo.

## Cómo correrlo

```bash
npm install
npx prisma db push
npm run dev
```

Abre [http://127.0.0.1:3847](http://127.0.0.1:3847) y pulsa **Entrar con la cuenta de ejemplo**.

Copia `.env.example` a `.env` y define `SESSION_SECRET`. Para dictar comentarios en el registro de riego, agrega `ELEVENLABS_API_KEY`. El navegador pide el token de un solo uso a `/api/scribe-token`; la clave no sale del servidor. Sin la clave, el botón de audio muestra el aviso y el comentario se puede escribir a mano.

## Qué calcula

- **Evapotranspiración.** La ET0 diaria (FAO Penman-Monteith) sale de [Open-Meteo](https://open-meteo.com/) usando la latitud y longitud del campo. El código de referencia está en [open-meteo/open-meteo](https://github.com/open-meteo/open-meteo).
- **Cultivo.** ETc = ET0 × Kc × ajuste de cobertura. El Kc del ají y del maíz se cuenta desde la siembra. El del nogal y la manzana, desde el inicio de temporada. Las curvas de ají, maíz y manzana siguen FAO-56; la del nogal es una curva de referencia de hoja caduca.
- **Suelo.** Los milímetros disponibles salen de la textura (mm por metro) y la profundidad. Los litros por planta usan además la superficie mojada del sistema.
- **Riego.** Los metros cúbicos acumulados son el agua total (caudal por planta × plantas × horas). La puntuación compara los milímetros netos —ya descontada la eficiencia— con los milímetros que el suelo podía recibir. Un margen de ±10% es riego adecuado. Fuera de ese margen, es ineficiente.
- **Comentarios.** En anotar riego, el botón de audio abre el micrófono con Scribe (`@elevenlabs/client`). El texto parcial se muestra en pantalla y el texto confirmado se agrega al comentario del riego.
- **Racha.** Sube cuando el riego se anota el mismo día. Se rompe si la fecha es anterior. La racha pertenece al usuario.
- **Logros.** El campo desbloquea embalses, reservorios, represas, presas, lagunas y lagos de México según el agua total aplicada. El umbral es una marca del campo, no el volumen real de ese cuerpo de agua.

## Pruebas

```bash
npm test
```
