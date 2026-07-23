## ADDED Requirements

### Requirement: Inicio de sesión con credenciales
El sistema SHALL permitir que una persona acceda con un email válido y una contraseña, comprobados por la colección de autenticación configurada en PocketBase.

#### Scenario: Credenciales válidas
- **WHEN** la persona envía un email y una contraseña válidos
- **THEN** el sistema crea una sesión y muestra el workspace

#### Scenario: Credenciales inválidas
- **WHEN** la persona envía un email o una contraseña que PocketBase no acepta
- **THEN** el sistema mantiene la pantalla de acceso y muestra un error que no revela cuál credencial falló

#### Scenario: Datos incompletos
- **WHEN** la persona intenta enviar un email inválido o una contraseña vacía
- **THEN** el sistema rechaza el intento sin crear una sesión e indica cómo corregirlo

### Requirement: Sesión segura y persistente
El sistema MUST almacenar la sesión en una cookie inaccesible para JavaScript del navegador, limitada al mismo sitio y con vencimiento.

#### Scenario: Recarga con sesión vigente
- **WHEN** la persona recarga o vuelve a abrir la aplicación con una sesión vigente
- **THEN** el sistema valida la sesión y muestra directamente el workspace

#### Scenario: Sesión ausente o inválida
- **WHEN** la petición no incluye una sesión válida
- **THEN** el sistema no muestra datos del workspace y presenta la pantalla de acceso

### Requirement: Protección de la API del workspace
El sistema MUST comprobar una sesión válida antes de leer o modificar el workspace remoto.

#### Scenario: Lectura no autenticada
- **WHEN** un cliente solicita el workspace sin una sesión válida
- **THEN** la API responde con estado 401 y no devuelve datos del workspace

#### Scenario: Escritura no autenticada
- **WHEN** un cliente intenta guardar el workspace sin una sesión válida
- **THEN** la API responde con estado 401 y no modifica PocketBase

#### Scenario: Operación autenticada
- **WHEN** un cliente con sesión válida lee o guarda el workspace
- **THEN** la API ejecuta la operación existente y devuelve su resultado

### Requirement: Cierre de sesión
El sistema SHALL permitir cerrar la sesión desde el workspace.

#### Scenario: Cierre exitoso
- **WHEN** la persona activa la acción de cerrar sesión
- **THEN** el sistema elimina la cookie de sesión y vuelve a mostrar la pantalla de acceso

### Requirement: Interfaz de acceso accesible
La pantalla de acceso MUST identificar sus campos, exponer estados de error y envío a tecnologías de asistencia y funcionar con teclado y en pantallas móviles.

#### Scenario: Envío en curso
- **WHEN** el sistema está comprobando las credenciales
- **THEN** la acción de acceso indica progreso y evita envíos duplicados

#### Scenario: Navegación por teclado
- **WHEN** una persona recorre y usa el formulario sólo con teclado
- **THEN** los campos y la acción reciben foco visible y se pueden activar sin puntero
