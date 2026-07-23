## Why

Epixodo expone actualmente el espacio de trabajo sin comprobar la identidad de quien lo abre. Se necesita un acceso con email y contraseña para que sólo una persona autenticada pueda ver y modificar la información almacenada.

## What Changes

- Incorporar una pantalla de acceso con email, contraseña, estados de envío y errores comprensibles.
- Autenticar credenciales contra la colección de usuarios configurada en PocketBase.
- Mantener la sesión en una cookie segura, `HttpOnly` y de alcance limitado a la aplicación.
- Proteger tanto la página principal como los endpoints de lectura y escritura del workspace.
- Permitir cerrar sesión desde el espacio de trabajo.
- Conservar el workspace remoto actual; este cambio no introduce registro público ni separación multiusuario de datos.

## Capabilities

### New Capabilities

- `email-password-authentication`: Inicio y cierre de sesión con PocketBase, persistencia segura de sesión y protección de la interfaz y de la API del workspace.

### Modified Capabilities

Ninguna.

## Impact

- Nuevas rutas de autenticación y una nueva pantalla de acceso en `app/`.
- Nuevas utilidades de servidor para comunicarse con PocketBase y validar sesiones.
- Protección adicional sobre `app/api/workspace/route.ts`.
- Un control de cierre de sesión en el workspace existente.
- Configuración mediante la colección de autenticación de PocketBase; sin dependencias npm nuevas.
