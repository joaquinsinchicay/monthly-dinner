# PRODUCT BACKLOG · MVP
## Cenas del Jueves

User Stories con Acceptance Criteria en formato Gherkin — ordenadas por prioridad de desarrollo

| Versión | Stack | US totales | Completadas | Pendientes | Fecha |
|---|---|---|---|---|---|
| MVP v1.0 | Next.js + Supabase | 22 | 21 | 1 (US-07b) | Marzo 2026 |

---

## E00 🏠 Creación de grupo

### US-00 — Crear grupo

> *Como usuario registrado, quiero crear un grupo con un nombre, para coordinar las cenas del jueves en un espacio propio.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P0 | M (3-4 días) | Acción fundacional. Sin grupo no hay evento, ni turno, ni historial. Prerequisito de todo el backlog. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-00 — Crear grupo

  Scenario: Creación exitosa
    Given soy un usuario autenticado sin grupo activo
    When completo el nombre del grupo y confirmo
    Then el grupo queda creado, soy asignado como admin y veo el panel del grupo vacío

  Scenario: Nombre obligatorio
    Given estoy en el formulario de creación de grupo
    When intento confirmar sin completar el nombre
    Then el sistema indica que el nombre es obligatorio y no crea el grupo

  Scenario: Nombre duplicado del mismo usuario
    Given ya tengo un grupo llamado "Cenas del Jueves"
    When intento crear otro grupo con el mismo nombre
    Then el sistema me avisa que ya existe un grupo con ese nombre y sugiere uno diferente

  Scenario: Grupo creado visible solo para el admin
    Given creé el grupo exitosamente
    When otro usuario ingresa a la app sin invitación
    Then ese usuario no puede ver ni acceder al grupo sin un link de invitación válido
```

---

### US-00b — Generar link de invitación al crear el grupo

> *Como admin del grupo, quiero obtener un link de invitación al crear el grupo, para poder compartirlo con los miembros sin agregarlos manualmente.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P0b | S (1-2 días) | Flujo complementario a US-00. Sin link no hay forma de incorporar miembros. Depende de US-00. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-00b — Link de invitación inicial

  Scenario: Link generado automáticamente al crear el grupo
    Given acabo de crear el grupo
    When el grupo queda guardado
    Then el sistema genera automáticamente un link de invitación y lo muestra con opción de copiar o compartir

  Scenario: Link copiado al portapapeles
    Given veo el link de invitación generado
    When toco "Copiar link"
    Then el link se copia al portapapeles y veo una confirmación visual breve

  Scenario: Link reutilizable y con expiración
    Given el link fue generado hace más de 30 días
    When un nuevo invitado intenta acceder con ese link
    Then el sistema indica que el link expiró y el admin puede generar uno nuevo desde la configuración del grupo

  Scenario: Revocar link activo
    Given hay un link de invitación activo
    When el admin lo revoca desde la configuración del grupo
    Then el link queda inválido y cualquier acceso posterior muestra el mensaje de link no válido
```

---

### US-00c — Configurar frecuencia y día al crear el grupo

> *Como usuario registrado, quiero definir la frecuencia y el día de reunión al crear el grupo, para que el sistema pueda generar los eventos automáticamente y todos los miembros sepan cuándo se reúne el grupo.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P0c | S (1-2 días) | Complemento directo de US-00. Sin frecuencia y día no hay base para generar eventos ni rotación. Depende de US-00. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-00c — Configurar frecuencia y día al crear el grupo

  Scenario: Selección de frecuencia mensual muestra días del mes
    Given estoy completando el formulario de creación de grupo
    When selecciono la frecuencia "Mensual"
    Then el campo "Día" muestra un selector numérico con los días del mes (1 al 31)

  Scenario: Selección de frecuencia semanal muestra días de la semana
    Given estoy completando el formulario de creación de grupo
    When selecciono la frecuencia "Semanal"
    Then el campo "Día" muestra los 7 días de la semana como opciones seleccionables

  Scenario: Selección de frecuencia quincenal muestra días de la semana
    Given estoy completando el formulario de creación de grupo
    When selecciono la frecuencia "Quincenal"
    Then el campo "Día" muestra los 7 días de la semana como opciones seleccionables

  Scenario: Campos obligatorios — frecuencia y día
    Given estoy en el formulario de creación de grupo
    When intento confirmar sin seleccionar frecuencia o día
    Then el sistema indica que ambos campos son obligatorios y no crea el grupo

  Scenario: Mensaje informativo visible al cargar el formulario
    Given accedo al formulario de creación de grupo
    When la pantalla carga
    Then veo el mensaje: "Como creador, tendrás el rol de administrador para gestionar las invitaciones, proponer fechas y coordinar los lugares de encuentro"

  Scenario: Datos de frecuencia y día guardados con el grupo
    Given completé nombre, frecuencia y día correctamente
    When confirmo la creación del grupo
    Then el grupo queda creado con los tres atributos guardados y accesibles desde la configuración del grupo
```

---

### US-00d — Pantalla de confirmación post-creación de grupo

> *Como usuario que acaba de crear un grupo, quiero ver una pantalla de confirmación con el resumen del grupo, mi rol y los próximos pasos, para entender qué tengo que hacer a continuación sin tener que explorar la app.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P0d | S (1-2 días) | Cierra el flujo de onboarding de US-00 y US-00c. Sin esta pantalla el usuario llega al dashboard sin contexto de qué hacer primero. Depende de US-00, US-00b y US-00c. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-00d — Pantalla de confirmación post-creación de grupo

  Scenario: Redirección automática tras crear el grupo
    Given completé el formulario de creación con nombre, frecuencia y día
    When el grupo se crea exitosamente
    Then soy redirigido automáticamente a la pantalla de confirmación
    And no puedo volver al formulario de creación con el botón atrás

  Scenario: Resumen del grupo visible
    Given estoy en la pantalla de confirmación
    When la pantalla carga
    Then veo el nombre del grupo, la frecuencia seleccionada y el día de reunión configurado

  Scenario: Mensaje de bienvenida al rol de admin
    Given estoy en la pantalla de confirmación
    When la pantalla carga
    Then veo un mensaje que me indica que soy el administrador del grupo
    And el mensaje explica que puedo gestionar invitaciones, proponer fechas y coordinar lugares

  Scenario: Próximos pasos visibles
    Given estoy en la pantalla de confirmación
    When la pantalla carga
    Then veo dos próximos pasos sugeridos: "Invitar miembros" y "Configurar rotación"
    And cada paso tiene una descripción breve de qué implica

  Scenario: Navegación al dashboard
    Given estoy en la pantalla de confirmación
    When toco "Ir al Dashboard"
    Then soy redirigido al dashboard del grupo recién creado

  Scenario: Acceso directo por URL bloqueado
    Given el grupo ya fue creado
    When intento acceder a la URL de confirmación directamente
    Then soy redirigido al dashboard del grupo sin mostrar la pantalla de confirmación
```

---

## E01 🔐 Acceso & Autenticación

### US-01 — Registro con Google

> *Como usuario nuevo, quiero registrarme con mi cuenta de Google, para acceder sin crear una contraseña nueva.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P1 | S (1-2 días) | El usuario accede por primera vez y crea su cuenta mediante OAuth de Google sin formularios ni contraseñas. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-01 — Registro con Google

  Scenario: Registro exitoso
    Given soy un usuario nuevo sin cuenta
    When selecciono "Ingresar con Google" y autorizo el acceso
    Then se crea mi perfil automáticamente y soy redirigido al panel de grupos

  Scenario: Email ya registrado
    Given ya existe una cuenta con ese email
    When intento registrarme con el mismo Google account
    Then inicio sesión en la cuenta existente sin crear un duplicado

  Scenario: Cancelación del flujo OAuth
    Given estoy en el flujo de autorización de Google
    When cancelo el permiso
    Then regreso a la pantalla de inicio sin crear cuenta ni mostrar error crítico
```

---

### US-02 — Login con Google

> *Como usuario registrado, quiero iniciar sesión con mi cuenta de Google, para acceder a mi grupo sin fricciones.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P2 | S (1-2 días) | El usuario con cuenta existente entra a la app en un solo paso sin recordar contraseñas. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-02 — Login con Google

  Scenario: Login exitoso
    Given tengo una cuenta registrada
    When selecciono "Ingresar con Google"
    Then accedo directamente al panel de mi grupo sin pasos adicionales

  Scenario: Sesión persistente
    Given ya inicié sesión anteriormente en este dispositivo
    When abro la app nuevamente
    Then accedo directamente sin autenticarme de nuevo

  Scenario: Token expirado
    Given mi sesión expiró por inactividad prolongada
    When intento acceder a cualquier pantalla protegida
    Then soy redirigido al login sin perder el contexto de navegación
```

---

### US-04 — Join por invitación

> *Como usuario invitado, quiero unirme a un grupo mediante un link de invitación, para no depender de que el administrador me agregue manualmente.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P3 | M (3-4 días) | El usuario nuevo accede al grupo directamente desde un link compartido por WhatsApp u otro canal. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-04 — Join por invitación

  Scenario: Join exitoso con cuenta nueva
    Given recibí un link de invitación válido y no tengo cuenta
    When accedo al link e inicio sesión con Google
    Then se crea mi cuenta y quedo asociado al grupo automáticamente

  Scenario: Join con cuenta existente
    Given ya tengo cuenta y recibí un link de invitación
    When accedo al link
    Then quedo asociado al grupo sin crear cuenta nueva

  Scenario: Link expirado o inválido
    Given el link de invitación expiró o fue revocado
    When intento acceder
    Then veo un mensaje claro indicando que el link no es válido y cómo solicitar uno nuevo

  Scenario: Usuario ya miembro del grupo
    Given ya soy miembro del grupo
    When accedo al link de invitación
    Then soy redirigido al panel del grupo sin duplicar mi membresía
```

---

### US-03 — Cerrar sesión

> *Como usuario, quiero cerrar sesión desde cualquier pantalla, para proteger mi cuenta en dispositivos compartidos.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P4 | XS (< 1 día) | El usuario puede cerrar su sesión en cualquier momento desde el menú de perfil. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-03 — Cerrar sesión

  Scenario: Cierre de sesión exitoso
    Given estoy autenticado en la app
    When selecciono "Cerrar sesión" desde el menú de perfil
    Then mi sesión se cierra, el token se invalida y soy redirigido a la pantalla de inicio

  Scenario: Confirmación antes de cerrar
    Given estoy autenticado
    When selecciono "Cerrar sesión"
    Then se muestra un diálogo de confirmación antes de ejecutar el cierre

  Scenario: Datos locales limpios
    Given cerré sesión
    When otro usuario abre la app en el mismo dispositivo
    Then no ve datos ni información de la sesión anterior
```

---

## E02 📅 Panel de evento mensual

### US-05 — Crear evento del mes

> *Como organizador, quiero crear el evento del mes con fecha y lugar tentativo, para que toda la información quede centralizada.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P6 | S (1-2 días) | Primera acción del organizador. Sin evento no hay nada que confirmar ni votar. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-05 — Crear evento del mes

  Scenario: Creación exitosa
    Given soy el organizador del mes
    When completo fecha, lugar tentativo y descripción opcional y confirmo
    Then el evento queda creado con estado "Pendiente" y visible para todos los miembros

  Scenario: Campos obligatorios vacíos
    Given estoy creando el evento
    When intento guardar sin completar la fecha
    Then se muestra un error indicando que la fecha es obligatoria y no se guarda el evento

  Scenario: Evento ya existente en el mes
    Given ya existe un evento creado para este mes
    When intento crear otro
    Then el sistema me avisa que ya hay un evento activo y me ofrece editarlo

  Scenario: Edición posterior
    Given creé un evento y necesito cambiar el lugar
    When edito los datos del evento
    Then los cambios se guardan y todos los miembros ven la información actualizada
```

---

### US-06 — Notificar al grupo

> *Como organizador, quiero notificar al grupo cuando el evento está creado, para que todos sepan que la cena está convocada.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P7 | M (3-4 días) | Sin notificación los miembros no saben que hay un evento. Depende de US-05. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-06 — Notificar al grupo

  Scenario: Notificación enviada al publicar
    Given creé el evento del mes
    When lo publico seleccionando "Notificar al grupo"
    Then todos los miembros reciben una notificación con fecha, lugar y link directo al evento

  Scenario: Miembro sin notificaciones activas
    Given un miembro tiene las notificaciones desactivadas
    When se publica el evento
    Then el evento aparece igual en su panel la próxima vez que abra la app

  Scenario: Re-notificación por cambio de datos
    Given el evento ya fue publicado y modifico el lugar
    When guardo el cambio
    Then el sistema me ofrece notificar al grupo sobre la actualización antes de guardar
```

---

### US-07 — Ver estado del evento en tiempo real

> *Como miembro, quiero ver el estado del evento en tiempo real, para saber cómo está la cena sin preguntar en el chat.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P8 | S (1-2 días) | El panel visible para todos. Depende de US-06. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-07 — Ver estado del evento

  Scenario: Panel con evento activo
    Given hay un evento publicado para el mes
    When ingreso a la app
    Then veo fecha, lugar, organizador y el estado de confirmaciones actualizado

  Scenario: Panel sin evento activo
    Given no hay evento creado para el mes
    When ingreso a la app
    Then veo un estado vacío con el mensaje "La cena de este mes aún no fue convocada"

  Scenario: Actualización en tiempo real
    Given estoy viendo el panel del evento
    When otro miembro confirma su asistencia
    Then el contador de confirmaciones se actualiza sin necesidad de recargar la pantalla
```

---

### US-07b — Estado vacío del dashboard sin eventos

> *Como miembro del grupo, quiero ver un mensaje contextual cuando el grupo no tiene ningún evento creado, para entender en qué estado está el grupo y qué acción corresponde según mi rol.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P8b | S (1-2 días) | Complemento de US-07. Sin este estado el dashboard queda en blanco para grupos nuevos. Depende de US-05 (crear evento) y US-11 (organizador del mes). |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-07b — Estado vacío del dashboard sin eventos

  Scenario: Admin u organizador ve el estado vacío con CTA
    Given soy el admin o el organizador del mes
    And el grupo no tiene ningún evento creado en su historial
    When ingreso al dashboard del grupo
    Then veo el mensaje "Tu clan está listo, pero falta la mesa."
    And veo el mensaje "Has creado el espacio perfecto para los amantes del buen comer. Ahora solo falta coordinar la primera cita para que la magia suceda."
    And veo el botón "Crear primer evento"

  Scenario: Botón redirige a creación de evento
    Given estoy viendo el estado vacío como admin u organizador
    When toco "Crear primer evento"
    Then soy redirigido a la pantalla de creación de evento del mes

  Scenario: Miembro ve mensaje de espera sin CTA
    Given soy un miembro del grupo sin rol de organizador
    And el grupo no tiene ningún evento creado en su historial
    When ingreso al dashboard del grupo
    Then veo el mensaje "Aún no hay eventos. El organizador del mes está preparando la primera cita."
    And no veo el botón "Crear primer evento"

  Scenario: Estado vacío desaparece al crear el primer evento
    Given el admin creó el primer evento del grupo
    When cualquier miembro ingresa al dashboard
    Then ya no se muestra el estado vacío sino el panel del evento activo

  Scenario: Estado vacío no se muestra si hay historial previo
    Given el grupo tiene al menos un evento cerrado en su historial
    And no hay evento activo para el mes actual
    When ingreso al dashboard
    Then no se muestra el estado vacío de "grupo nuevo"
    And se muestra el estado correspondiente al mes sin evento activo
```

---

## E03 🔄 Turno rotativo

### US-11 — Ver organizador del mes

> *Como miembro, quiero ver quién organiza el mes actual, para que no haya confusión sobre el turno.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P5 | S (1-2 días) | Define quién puede actuar como organizador. Prerequisito del panel y del checklist. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-11 — Ver organizador del mes

  Scenario: Organizador visible en el panel
    Given soy miembro del grupo
    When ingreso a la app al inicio del mes
    Then veo claramente el nombre del organizador del mes actual destacado en el panel

  Scenario: El organizador soy yo
    Given me toca organizar este mes
    When ingreso a la app
    Then veo una indicación clara de que soy el organizador y accedo al checklist

  Scenario: Sin organizador asignado
    Given la rotación aún no fue configurada para este mes
    When ingreso a la app
    Then veo un mensaje indicando que el turno aún no fue asignado
```

---

### US-13 — Próximo organizador tras el cierre

> *Como miembro, quiero que el sistema indique quién organiza el próximo mes, para que nadie alegue que no sabía.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Media — P16 | M (3-4 días) | Cierra el ciclo del mes. Depende de que el evento se haya realizado. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-13 — Próximo organizador

  Scenario: Siguiente organizador visible tras el cierre
    Given el evento del mes fue cerrado
    When accedo al panel del grupo
    Then veo el nombre del próximo organizador indicado junto al mes correspondiente

  Scenario: Notificación al próximo organizador
    Given se cerró el evento y se actualizó la rotación
    When el sistema asigna al siguiente organizador
    Then esa persona recibe una notificación avisando que le toca organizar el próximo mes

  Scenario: Rotación completa reinicia el ciclo
    Given todos los miembros del grupo ya organizaron una vez
    When se cierra el último evento del ciclo
    Then la rotación vuelve a empezar desde el primer miembro y todos reciben notificación
```

---

## E04 ✅ Confirmación de asistencia

### US-08 — Recibir notificación de convocatoria

> *Como miembro, quiero recibir una notificación cuando el organizador convoca la cena, para poder decidir si voy sin buscar en el chat.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P9 | M (3-4 días) | Dispara el flujo de confirmación. Depende del evento publicado. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-08 — Notificación de convocatoria

  Scenario: Notificación recibida con acción directa
    Given el organizador publicó el evento
    When recibo la notificación
    Then veo fecha, lugar y un botón para confirmar asistencia directamente desde la notificación

  Scenario: Recordatorio por falta de respuesta
    Given recibí la notificación pero no confirmé
    When pasan 48 horas sin respuesta
    Then recibo un recordatorio único con los datos del evento

  Scenario: Acceso desde notificación
    Given toco la notificación
    When abro la app desde ella
    Then llego directamente al panel del evento, no a la pantalla de inicio
```

---

### US-09 — Confirmar asistencia

> *Como miembro, quiero confirmar mi asistencia con un estado (va / no va / tal vez), para que el organizador lo sepa sin preguntarme.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P10 | S (1-2 días) | Acción central del miembro. Depende de US-08. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-09 — Confirmar asistencia

  Scenario: Confirmación exitosa
    Given hay un evento activo y no confirmé aún
    When selecciono "Voy"
    Then mi estado queda registrado como "Va" y aparezco en el resumen del organizador

  Scenario: Cambio de estado
    Given confirmé que voy pero surgió algo
    When cambio mi estado a "No voy"
    Then el estado se actualiza y el resumen del organizador refleja el cambio en tiempo real

  Scenario: Estado "Tal vez"
    Given no tengo certeza de si puedo ir
    When selecciono "Tal vez"
    Then quedo registrado como pendiente y el organizador me ve en categoría separada

  Scenario: Confirmación después del evento
    Given el evento ya fue marcado como realizado
    When intento cambiar mi estado
    Then el sistema no permite modificaciones y muestra el estado final como solo lectura
```

---

### US-10 — Ver resumen de confirmaciones

> *Como organizador, quiero ver el resumen de confirmaciones en tiempo real, para tomar decisiones sobre la reserva.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P11 | S (1-2 días) | Cierra el flujo de confirmación. Depende de US-09. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-10 — Resumen de confirmaciones

  Scenario: Resumen completo visible
    Given hay confirmaciones registradas
    When accedo al panel del evento
    Then veo el total separado en Van, No van y Sin responder con sus nombres

  Scenario: Todos confirmaron
    Given todos los miembros respondieron
    When accedo al panel
    Then veo el resumen completo sin "Sin responder" e indicación de convocatoria cerrada

  Scenario: Compartir resumen
    Given necesito comunicar quiénes van al restaurante
    When selecciono "Compartir resumen"
    Then se genera un texto listo para copiar con los nombres de los asistentes confirmados
```

---

## E05 🍽️ Historial de restaurantes

### US-14 — Cargar restaurante al cerrar evento

> *Como organizador, quiero cargar el restaurante visitado al cerrar el evento, para que quede en el historial del grupo.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P14 | S (1-2 días) | Se ejecuta después de la cena. Prerequisito del historial visible. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-14 — Cargar restaurante

  Scenario: Restaurante cargado al cerrar evento
    Given voy a cerrar el evento del mes
    When ingreso el nombre del restaurante y confirmo el cierre
    Then el restaurante queda asociado al evento y aparece en el historial con fecha y asistentes

  Scenario: Restaurante ya en el historial
    Given el restaurante que ingreso ya fue visitado antes
    When lo cargo al cerrar el evento
    Then el sistema me avisa que ya fue visitado, muestra la fecha anterior y permite confirmarlo igual

  Scenario: Cierre sin restaurante
    Given voy a cerrar el evento pero no tengo el nombre del restaurante
    When cierro el evento sin completar ese campo
    Then el evento se cierra con estado "Sin restaurante registrado" y puedo agregarlo después
```

---

### US-16 — Consultar historial de restaurantes

> *Como miembro, quiero consultar el historial de restaurantes del grupo, para no proponer lugares ya visitados.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P15 | S (1-2 días) | Consulta del historial. Depende de US-14. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-16 — Historial de restaurantes

  Scenario: Historial con registros
    Given el grupo tiene eventos cerrados con restaurantes registrados
    When accedo al historial
    Then veo la lista ordenada por fecha con nombre, fecha de visita y asistentes

  Scenario: Historial vacío
    Given el grupo no tiene cenas registradas aún
    When accedo al historial
    Then veo un estado vacío con el mensaje "Todavía no hay cenas registradas"

  Scenario: Búsqueda en el historial
    Given hay múltiples restaurantes en el historial
    When busco por nombre de restaurante
    Then veo solo los resultados que coinciden con mi búsqueda
```

---

## E06 🗳️ Votación de restaurantes

### US-17 — Abrir votación de restaurantes

> *Como organizador, quiero abrir una votación con opciones y plazo definido, para que la decisión sea colectiva.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P12 | M (3-4 días) | Va antes del historial porque la votación ocurre antes de la cena, el historial después. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-17 — Abrir votación

  Scenario: Votación creada exitosamente
    Given soy el organizador del mes
    When creo una votación con al menos 2 opciones y una fecha de cierre
    Then la votación queda activa y todos los miembros reciben una notificación

  Scenario: Menos de 2 opciones
    Given estoy creando una votación
    When intento guardarla con solo 1 opción
    Then el sistema indica que se necesitan al menos 2 opciones

  Scenario: Fecha de cierre en el pasado
    Given estoy configurando la votación
    When ingreso una fecha de cierre anterior a hoy
    Then el sistema rechaza la fecha y solicita una fecha futura

  Scenario: Solo una votación activa por evento
    Given ya existe una votación activa para el evento
    When intento crear otra
    Then el sistema me avisa que ya hay una en curso y me ofrece editarla
```

---

### US-18 — Votar por un restaurante

> *Como miembro, quiero votar por un restaurante dentro del plazo, para participar sin debate en el chat.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Alta — P13 | S (1-2 días) | Depende de US-17. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-18 — Votar por restaurante

  Scenario: Voto registrado
    Given hay una votación activa
    When selecciono mi opción preferida
    Then mi voto queda registrado y veo el estado parcial con los porcentajes actualizados

  Scenario: Cambio de voto dentro del plazo
    Given ya voté pero quiero cambiar mi opción
    When selecciono otra opción antes del cierre
    Then mi voto se actualiza y los porcentajes reflejan el cambio

  Scenario: Intento de votar fuera del plazo
    Given la votación ya cerró
    When intento emitir un voto
    Then el sistema indica que la votación cerró y muestra el resultado final

  Scenario: Miembro que no votó antes del cierre
    Given no voté antes de que cerrara la votación
    When accedo a la votación
    Then veo el resultado final con indicación de que no participé en esta votación
```

---

## E07 📋 Checklist del organizador

### US-20 — Acceder al checklist del mes

> *Como organizador, quiero acceder al checklist de tareas del mes al ser asignado, para no olvidar ningún paso.*

| Prioridad | Esfuerzo | Descripción |
|---|---|---|
| Media — P17 | M (3-4 días) | Capa de soporte al organizador. Va al final del MVP porque el flujo funciona sin ella. |

**Acceptance Criteria — Gherkin**

```gherkin
Feature: US-20 — Checklist del organizador

  Scenario: Checklist disponible al ser asignado
    Given fui asignado como organizador del mes
    When ingreso a la app
    Then veo el checklist con todas las tareas del mes ordenadas cronológicamente y el porcentaje de progreso

  Scenario: Tarea completada
    Given tengo tareas pendientes en el checklist
    When marco una tarea como completada
    Then la tarea aparece tachada, el progreso se actualiza y se habilita la siguiente tarea

  Scenario: Checklist no disponible para no organizadores
    Given soy miembro pero no el organizador del mes
    When intento acceder al checklist
    Then veo un mensaje indicando que el checklist solo está disponible para el organizador del mes

  Scenario: Retomar checklist incompleto
    Given empecé el checklist pero no lo terminé
    When vuelvo a ingresar a la app
    Then veo el checklist con el progreso guardado y las tareas pendientes resaltadas
```

---

*Joaquin Fernandez Sinchi — Product Manager · A-CSPO | Buenos Aires, Argentina | Marzo 2026*