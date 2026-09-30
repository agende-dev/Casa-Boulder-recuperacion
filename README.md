# Casa Boulder — Gestión de recuperaciones

Que recepción y alumnos sepan al instante qué clases tienen lugar libre y qué
créditos de recuperación están vigentes, desde el celular.

App de gestión de recuperaciones para un gimnasio de escalada boulder en
Santiago, con cursos fijos por nivel. Es una demo funcional que corre por
completo en el navegador: no hay backend ni servicios externos conectados (ver
"Qué está simulado").

**Stack:** React · Vite · Tailwind CSS · localStorage.

## Para qué sirve

- Los alumnos de cursos fijos (Iniciación, Básico, Intermedio, Avanzado y
  Niños) tienen una o dos clases por semana, con cupo de 10 y 90 minutos.
- Si un alumno avisa que no viene con **6 horas o más** de anticipación, su
  clase se convierte en un **crédito** válido por 30 días para recuperar en otra
  clase de su mismo nivel donde haya lugar.
- En una sola pantalla se ve la ocupación de cada clase de la semana ("7/10"),
  con sus lugares libres.
- Tiene dos vistas de la misma app: **Recepción** (gestión completa) y
  **Alumno** (solo lo suyo).
- No maneja pagos ni cobranza: solo asistencia, créditos y reservas de
  recuperación.

## Cómo se usa

1. Arriba a la derecha hay un selector de vista: **Recepción** o **Alumno**. En
   Alumno aparece una lista "Soy…" para elegir quién es.
2. En el **Panel semanal** se navega por semanas, se filtra por nivel y se entra
   a una clase con un toque. La primera vez aparece una **guía de la demo** con
   3 pasos y un atajo para probar; se cierra con "Entendido" y se reabre desde
   "Ver la guía de la demo", al pie del panel.
3. En la vista Alumno, **Mis clases** abre con la tarjeta **"Tu próxima clase"**:
   fecha, hora, nivel, cuánto falta, lugares libres y el botón "Avisar ausencia".
4. En el **detalle de la clase** (Recepción) se marca presente, se avisa una
   ausencia o se cancela una recuperación. Con 6 h o más de anticipación el aviso
   genera un crédito y libera el lugar; con menos, no genera crédito.
5. **Recuperar** guía en tres pasos: alumno con crédito vigente → crédito →
   clase futura de su nivel con cupo → "Confirmar recuperación".
6. **Créditos** muestra, por alumno, los créditos activos, vencidos y
   consumidos con su origen y vencimiento.
7. **Alumnos** (solo Recepción) lista nivel, plan y créditos vigentes, y permite
   "Registrar pase de nivel".
8. **Sobre Nosotros** es la página informativa: qué es Casa Boulder, cómo
   funcionan las recuperaciones, planes, horario, cómo llegar y redes. Al final
   tiene el "Modo demostración".

## Cómo arrancar el proyecto

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
```

Para probar la versión de producción:

```bash
npm run build      # genera dist/ (estático)
npm run preview    # http://localhost:4173
```

No requiere clave de acceso ni variables de entorno.

## URL de previsualización

**https://casa-boulder-recuperacion.vercel.app**

El proyecto está desplegado en Vercel, conectado al repositorio de GitHub
(`agende-dev/Casa-Boulder-recuperacion`, rama `main`). La configuración usa el
preset **Vite**, comando `npm run build` y salida `dist/`; no requiere variables
de entorno.

Cada `git push` a `main` dispara un redeploy automático en la misma URL.

> **Importante para quien siga trabajando en este repo**: Vercel bloquea el
> deploy si el email del autor del commit no coincide con un email verificado de
> la cuenta de GitHub conectada. Verificá que `git config user.email` esté bien
> seteado antes de commitear; si un deploy queda en estado "Blocked", ese suele
> ser el motivo (el detalle se ve en la pestaña Deployments de Vercel).

## Estructura

```
index.html                  Punto de entrada
src/main.jsx                Monta la app
src/App.jsx                 Encabezado con selector de vista, navegación y ruteo de pantallas
src/router.js               Router por hash (sin dependencias)
src/store.jsx               Estado, persistencia en localStorage y avisos (todo el acceso a datos)
src/lib/logic.js            Reglas de negocio: ausencias, créditos, reservas, pase de nivel
src/lib/seed.js             Catálogo de clases, planes y datos de ejemplo (14 clases, 6 alumnos)
src/lib/storage.js          localStorage con detección de bloqueo
src/lib/dates.js            Fechas y formatos es-CL
src/components/ui.jsx       Componentes base (botones, modal, chips, presas de ocupación)
src/pages/Panel.jsx         Panel semanal, guía de la demo y tarjeta "Tu próxima clase"
src/pages/ClaseDetalle.jsx  Detalle de clase (fecha concreta)
src/pages/Alumnos.jsx       Alumnos y pase de nivel
src/pages/Reservar.jsx      Reservar recuperación
src/pages/Creditos.jsx      Créditos por alumno
src/pages/Info.jsx          Sobre Nosotros y modo demostración
```

Navegación por hash (`#/`, `#/clase/:claseId/:fecha`, `#/alumnos`, `#/reservar`,
`#/creditos/:alumnoId`, `#/info`) para no depender de configuración de servidor.

## Qué está simulado

- **Persistencia**: todo se guarda en `localStorage` del navegador (claves
  `casaboulder.recuperaciones.v1` para los datos y la vista elegida, y
  `casaboulder.guia.v1` para recordar que se cerró la guía). No hay servidor ni
  base de datos: cada navegador tiene sus propios datos. Si el navegador bloquea
  el almacenamiento, aparece un aviso y la app sigue funcionando solo en memoria.
- **Acceso**: no hay login. El selector Recepción / Alumno es solo una
  separación de interfaz para la demo; cualquiera puede cambiar de vista.
  Kodarvia debe integrar autenticación y permisos reales del lado del servidor.
- **Integraciones**: no hay correo, WhatsApp ni pagos. El aviso "por WhatsApp"
  al confirmar una recuperación y los botones de redes son solo texto o avisos
  simulados.
- **Datos de ejemplo**: 14 clases del catálogo y 6 alumnos ficticios con planes
  y niveles variados. Los créditos (activos, uno vencido, uno consumido y uno por
  vencer) se generan **relativos a la fecha de hoy** al cargar.
- **Alumnos "sin ficha"**: para que las clases muestren ocupaciones realistas
  con solo 6 alumnos, cada clase tiene un campo `externos` con alumnos fijos que
  ocupan lugar pero no tienen ficha en la demo.
- **Datos del negocio**: dirección, teléfonos, correo, redes y horario de sala
  son de ejemplo (`src/pages/Info.jsx`). El mapa es un embed de OpenStreetMap y
  necesita conexión.
- **Zona horaria**: se usa la del navegador.

## Cómo reiniciar los datos de ejemplo

Dos maneras:

1. **Desde la app**: en "Sobre Nosotros" → "Modo demostración", tocá "Reiniciar
   datos de ejemplo" y confirmá. Reemplaza todo por el set original y vuelve a la
   vista Recepción.
2. **Manualmente**: en las herramientas de desarrollador del navegador,
   ejecutá `localStorage.clear()` y recargá — la app vuelve a precargar los
   datos de ejemplo automáticamente (y vuelve a mostrar la guía de la demo).

En "Modo demostración" también hay un **reloj de prueba** (+1 hora, +6 horas,
+1 día, −1 hora) para probar la regla de las 6 h sin esperar. Mientras está
movido aparece un aviso arriba; "Volver a la hora real" lo restablece.

## Decisiones que no estaban especificadas en el encargo

**Reglas de negocio**

- **Aviso con menos de 6 h**: queda registrado como "ausente sin aviso" (aviso
  tardío): sin crédito y con el lugar ocupado.
- **Vencimiento en la reserva**: solo se ofrecen clases hasta la fecha de
  vencimiento del crédito, además de ser futuras, del nivel actual y con cupo. Un
  crédito sigue vigente durante todo su último día.
- **Cancelar con menos de 6 h**: la recuperación se cancela pero el crédito no
  se devuelve. No se puede cancelar una clase que ya comenzó.
- **Deshacer un aviso**: elimina el crédito que generó, salvo que ya se haya
  usado; y no se puede si otro alumno ya tomó el lugar liberado (la clase
  quedaría con más de 10 personas).
- **Pase de nivel**: pide elegir las clases fijas del nivel nuevo (una o dos
  según el plan); los créditos pendientes se pueden usar en el nivel nuevo con
  su vencimiento original. Las reservas ya hechas en el nivel anterior se
  mantienen.
- **Una sola recuperación por clase**: un alumno no puede reservar dos veces la
  misma clase, ni recuperar en una de sus propias clases fijas.
- **Reloj de prueba**: mientras está movido no se guardan créditos como vencidos
  (el estado "vencido" se calcula al vuelo). Así, al volver a la hora real no se
  pierde ningún crédito.

**Vistas y pantallas**

- **Selector de vista en el encabezado**: compacto, a la derecha; la lista "Soy…"
  solo aparece en vista Alumno. La vista y el alumno elegidos se guardan y
  persisten al recargar.
- **Vista Alumno**: ve solo lo suyo (clases marcadas "Tu clase", créditos,
  reservas y aviso de su propia ausencia); no ve la lista de alumnos ni nombres
  de otros, no marca asistencia ni deshace avisos. Si abre `#/alumnos` ve un
  aviso de "Solo recepción".
- **Clase donde el alumno ya tiene lugar**: en el detalle, en vez del botón
  "Reservar recuperación" se muestra "Tienes una recuperación reservada en esta
  clase" o "Esta es tu clase fija: ya tienes tu lugar". Si avisó que no va a su
  clase fija, el botón vuelve a aparecer.
- **Tarjeta "Tu próxima clase"**: considera las clases fijas y las recuperaciones
  reservadas, y salta las clases donde el alumno ya avisó que no va. "Avisar
  ausencia" solo aparece si faltan 6 h o más; si no, un texto explica que ya no
  genera crédito. Sin clases próximas, ofrece "Usar un crédito" si tiene alguno.
- **Guía de la demo**: tarjeta descartable con 3 pasos (distintos para Recepción
  y Alumno) y un atajo a la primera clase futura con más de 6 h de anticipación,
  para que quien prueba la app pueda avisar una ausencia de inmediato.
- **Tarjetas del panel**: muestran contador ("5/10"), presas y "N lugares libres"
  en todas. Se probó una versión más limpia (texto solo con 3 o menos lugares) y
  se revirtió por preferencia.
- **Redacción**: se escribe "clase de nivel básico" / "de nivel intermedio" (no
  "clase Básico") en avisos, confirmaciones, errores y títulos.
- **Sobre Nosotros**: la página informativa reemplazó el nombre "El gimnasio". En
  celular el nombre se muestra en dos líneas en la barra inferior, para que no se
  recorte.
- **Notas de progreso**: Recepción puede dejar una nota por alumno presente.
- **Mapa y redes**: el mapa es un embed de OpenStreetMap y los botones de redes
  muestran un aviso simulado.

**Backend**

- Las funciones de `src/lib/logic.js` (`avisarAusencia`, `reservarRecuperacion`,
  `cancelarReserva`, `pasarDeNivel`…) y `src/store.jsx` son lo que se reemplaza
  por llamadas a API. Modelo: `Clase {id, nivel, dia_semana, hora, duracion,
  cupo}` · `Alumno {id, nombre, nivel_actual, plan, clases_fijas}` ·
  `Sesion {clase_id, fecha, asistencias[]}` · `Credito {id, alumno_id,
  nivel_origen, fecha_generacion, fecha_vencimiento, estado}` · `Reserva
  {credito_id, sesion_id, alumno_id, estado}`.

## Criterios verificados

Verificados con pruebas automáticas sobre `src/lib/logic.js` (33 casos, incluidos
los bordes de exactamente 6 h y de 5 h 59 min) y con pruebas en el navegador.

- Avisar ausencia con 6 h o más genera un crédito con vencimiento a fecha de
  clase + 30 días y libera el lugar; con menos de 6 h no genera crédito.
- Al reservar recuperación solo se muestran clases del nivel actual del alumno.
- Lugares libres = cupo − fijos sin aviso − recuperaciones reservadas; con 0 no
  se aceptan más recuperaciones (el botón se deshabilita y la lógica lo rechaza).
- Un crédito con fecha de vencimiento pasada aparece como vencido y no se puede
  seleccionar.
- Cancelar una recuperación con 6 h o más devuelve el crédito a activo.
- Registrar pase de nivel actualiza el nivel y permite usar los créditos
  pendientes en el nivel nuevo.
- Los datos, la vista y el alumno elegido persisten en `localStorage` tras
  recargar o cerrar y reabrir la pestaña.
- Interfaz responsiva verificada a 375 px en las 6 pantallas y en ambas vistas,
  sin desbordes horizontales, botones tapados ni errores de consola.
- Peso de la primera carga ≈ 67 kB de JS y 6 kB de CSS (comprimidos), más las
  fuentes.

## Paleta y tipografía

- Grafito: `#3A3A3A`
- Fondo (blanco): `#FFFFFF`
- Acento (naranja presa): `#E8641E`
- Texto (negro): `#1B1B1B`
- Fondo de página: gris cemento `#E4E4E1`
- Títulos: `Oswald` · Texto y formularios: `Inter`
