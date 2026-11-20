## Purpose

Dar a las personas una portada para elegir un módulo de Epixodo y rutas estables para volver a cada área.

## ADDED Requirements

### Requirement: Authenticated module launcher

Al iniciar sesión desde `/`, Epixodo SHALL mostrar una portada de Inicio con accesos identificados por nombre, ícono y descripción breve. «Ver mi día» SHALL aparecer como acceso destacado a `/hoy`.

#### Scenario: Elegir un área desde Inicio

- **WHEN** la persona inicia sesión desde la raíz
- **THEN** Inicio muestra accesos a Captura, Planificación, Agenda personal, Esperas, Finanzas, Nutrición y Compañía
- **AND THEN** «Ver mi día» abre la pantalla de resumen diario en `/hoy`

### Requirement: Addressable module destinations

La aplicación SHALL servir las áreas en `/captura`, `/planificacion`, `/agenda`, `/esperas`, `/finanzas`, `/nutricion` y `/compania`. Desde cada área y desde «Hoy», la persona SHALL poder volver a Inicio y abrir otro módulo mediante un selector común disponible en escritorio y móvil.

#### Scenario: Volver a un módulo con el historial

- **WHEN** una persona abre Finanzas y luego Nutrición con el selector
- **THEN** el historial del navegador permite regresar a Finanzas y la recarga de `/finanzas` vuelve a abrir esa área

#### Scenario: Abrir un enlace con la sesión cerrada

- **WHEN** una persona con la sesión cerrada abre una ruta de módulo o `/hoy`
- **THEN** la aplicación solicita iniciar sesión antes de mostrar el área y sus datos

#### Scenario: Encontrar las vistas agrupadas

- **WHEN** una persona entra a Captura, Planificación o Agenda personal
- **THEN** puede acceder desde Captura a la entrada por texto o voz y a Bandeja, desde Planificación a las vistas de tareas y asuntos y al calendario, y desde Agenda personal a «Mi día ideal» y Ubicaciones

#### Scenario: Cambiar de módulo con un guardado pendiente

- **WHEN** una persona edita un registro y cambia de módulo antes de que termine la sincronización
- **THEN** la edición sigue disponible al volver y se sincroniza con el mismo mecanismo del espacio de trabajo
