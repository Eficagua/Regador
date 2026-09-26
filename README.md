# Lámina

Bitácora de riego para un campo. El usuario entra con Google o Apple, marca el campo en el mapa y crea lotes de ají, nogal, maíz o manzana. Cada lote guarda un cultivo, un suelo y un sistema de riego. En el inicio, la barra azul muestra el agua que todavía le queda al suelo.

## Cómo correrlo

```bash
npm install
npx prisma db push
npm run dev
```

Abre [http://127.0.0.1:3847](http://127.0.0.1:3847).

Si Google y Apple no tienen credenciales, los botones abren una sesión local en SQLite. Para el acceso real, copia `.env.example` a `.env` y completa:

- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` y `APPLE_PRIVATE_KEY`
- `APP_URL` con la URL pública
- `SESSION_SECRET`

Las redirecciones son `/api/auth/google/callback` y `/api/auth/apple/callback`.

## Qué calcula

- **Evapotranspiración.** La ET0 diaria (FAO Penman-Monteith) sale de [Open-Meteo](https://open-meteo.com/) usando la latitud y longitud del campo. El código de referencia está en [open-meteo/open-meteo](https://github.com/open-meteo/open-meteo).
- **Cultivo.** ETc = ET0 × Kc × ajuste de cobertura. El Kc del ají y del maíz se cuenta desde la siembra. El del nogal y la manzana, desde el inicio de temporada. Las curvas de ají, maíz y manzana siguen FAO-56; la del nogal es una curva de referencia de hoja caduca.
- **Suelo.** Los milímetros disponibles salen de la textura (mm por metro) y la profundidad. Los litros por planta usan además la superficie mojada del sistema.
- **Riego.** Los metros cúbicos acumulados son el agua total (caudal por planta × plantas × horas). La puntuación compara los milímetros netos —ya descontada la eficiencia— con los milímetros que el suelo podía recibir. Un margen de ±10% es riego adecuado. Fuera de ese margen, es ineficiente.
- **Racha.** Sube cuando el riego se anota el mismo día. Se rompe si la fecha es anterior. La racha pertenece al usuario.
- **Logros.** El campo desbloquea embalses, reservorios, represas, presas, lagunas y lagos de México según el agua total aplicada. El umbral es una marca del campo, no el volumen real de ese cuerpo de agua.

## Pruebas

```bash
npm test
```
