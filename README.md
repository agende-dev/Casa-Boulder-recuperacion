# Casa Boulder · Recuperaciones

App de gestión de recuperaciones para **Casa Boulder** (gimnasio de escalada boulder, Santiago). Pensada para recepción y alumnos de cursos fijos, con prioridad en el celular.

Stack: React 18 + Tailwind CSS 4 + localStorage (Vite). Sin backend.

## Cómo arrancarlo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (sitio estático)
npm run preview    # sirve dist/
```

Requiere Node 18+. La navegación usa `#/rutas`, por lo que `dist/` funciona en cualquier hosting estático.

## Pantallas

| Ruta | Pantalla |
|---|---|
| `#/` | Panel semanal: grilla con ocupación "7/10", lugares libres y filtro por nivel |
| `#/clase/:claseId/:fecha` | Detalle de clase: fijos (Marcar presente / Avisar ausencia), recuperaciones, lugares libres, Reservar recuperación |
| `#/alumnos` | Alumnos: nivel, plan, créditos vigentes con vencimiento, Registrar pase de nivel |
| `#/reservar` | Alumno con crédito → crédito → clases futuras de su nivel con cupo → Confirmar recuperación |
| `#/creditos/:alumnoId` | Mis créditos: activos, vencidos y consumidos, con origen y vencimiento |
| `#/info` | Página del negocio (qué hace, mapa, redes, planes) y modo demostración |

## Vistas: Recepción / Alumno

Debajo del encabezado hay un selector de vista (simulado, sin login; se guarda en localStorage):

- **Recepción:** todo: alumnos, marcar presente/ausente, notas, créditos y reservas de cualquier alumno.
- **Alumno** (eligiendo "Soy …"): ve sus clases (marcadas "Tu clase"), sus propios créditos, reserva y cancela solo sus recuperaciones y avisa su propia ausencia. No ve la lista de alumnos ni los nombres de otros, y no puede marcar asistencia ni deshacer avisos.

Es una separación de interfaz para la demo: el control de acceso real lo aporta el backend.

## Reglas implementadas (`src/lib/logic.js`)

- Avisar ausencia con **≥ 6 h** de anticipación: crea un crédito (vence = fecha de la clase + 30 días) y libera el lugar.
- Avisar con **< 6 h**: queda como aviso tardío, sin crédito y el lugar sigue ocupado.
- Lugares libres = cupo (10) − fijos sin aviso − recuperaciones reservadas. Con 0 no se aceptan más recuperaciones.
- Reservar solo permite clases futuras del `nivel_actual` del alumno, con cupo, y hasta el vencimiento del crédito.
- Un crédito activo con fecha vencida se muestra y guarda como **vencido** y no es seleccionable.
- Cancelar una recuperación con ≥ 6 h devuelve el crédito a **activo**; con < 6 h el crédito no se devuelve.
- Registrar pase de nivel actualiza `nivel_actual` y las clases fijas; los créditos pendientes se pueden usar en el nivel nuevo.
- Deshacer un aviso elimina el crédito que generó, salvo que ya se haya usado.

## Qué está simulado

- **Sin backend ni servicios externos**: no hay correo, WhatsApp ni pagos. Los avisos ("aviso simulado por WhatsApp") son solo texto; los botones de redes en la página de info muestran un aviso.
- **Datos de ejemplo**: 14 clases del catálogo y 6 alumnos, con créditos activos, vencido, consumido y por vencer, generados **relativos a la fecha de hoy** al cargar.
- **Alumnos fijos "sin ficha"**: para que las clases muestren ocupaciones realistas (p. ej. 7/10) con solo 6 alumnos, cada clase tiene un campo `externos` con alumnos fijos que ocupan lugar pero no tienen ficha en la demo. En producción se reemplaza por la lista real.
- **Datos del negocio** (dirección, teléfonos, redes, horario de sala) son de ejemplo; están en `src/pages/Info.jsx`. El mapa es un embed de OpenStreetMap y necesita conexión.
- Sin login: cualquier persona puede operar todas las pantallas. Zona horaria: la del navegador.
- **Reloj de demostración** (`#/info` → Modo demostración): permite adelantar la hora para probar la regla de las 6 h sin esperar.

## Datos y reinicio

Todo se guarda en `localStorage` bajo la clave `casaboulder.recuperaciones.v1` y persiste al recargar o reabrir la pestaña. Si el navegador bloquea localStorage, aparece un aviso y la app sigue funcionando en memoria.

Para reiniciar los datos de ejemplo: **`#/info` → Modo demostración → "Reiniciar datos de ejemplo"**, o desde la consola del navegador:

```js
localStorage.removeItem('casaboulder.recuperaciones.v1'); location.reload()
```

## Estructura

```
src/
  lib/dates.js     fechas y formatos (es-CL)
  lib/seed.js      catálogo, planes y datos de ejemplo
  lib/logic.js     reglas de negocio (funciones puras)
  lib/storage.js   localStorage con detección de bloqueo
  store.jsx        estado global, persistencia, toasts
  pages/           una por pantalla
  components/ui.jsx  componentes base
```

Para integrar el backend, las acciones de `logic.js` (`avisarAusencia`, `reservarRecuperacion`, `cancelarReserva`, `pasarDeNivel`…) son el contrato a reemplazar por llamadas a API; los modelos usan los campos del encargo (con nombres sin tildes: `dia_semana`, `fecha_generacion`).
