## Context

La aplicación es un App Router de Next.js 16.2 que persiste un único workspace en PocketBase mediante credenciales administrativas del servidor. La página principal y `/api/workspace` son públicos. PocketBase ya ofrece autenticación de colecciones mediante email y contraseña, por lo que puede actuar como proveedor de identidad sin sumar una biblioteca ni almacenar contraseñas en Epixodo.

La interfaz existente usa una identidad azul noche, tipografía Geist y controles compactos. El acceso debe sentirse como la entrada al mismo producto, no como una plantilla independiente.

## Goals / Non-Goals

**Goals:**

- Comprobar email y contraseña exclusivamente en el servidor contra PocketBase.
- Persistir el token de PocketBase en una cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción y con vencimiento acotado.
- Validar la sesión antes de renderizar el workspace y antes de cada lectura o escritura de su API.
- Ofrecer errores accionables, estado de envío y cierre de sesión.
- Mantener intacto el workspace remoto existente.

**Non-Goals:**

- Registro, recuperación de contraseña, verificación de email o autenticación multifactor.
- Roles, permisos o separación del workspace por usuario.
- Exponer el token de PocketBase a JavaScript del navegador.

## Decisions

### PocketBase como proveedor de identidad

El servidor enviará las credenciales a `/api/collections/{collection}/auth-with-password`, con `users` como colección predeterminada y una variable de entorno para sobreescribirla. Se prefiere este mecanismo a una tabla o librería adicional porque PocketBase ya gestiona hash de contraseñas, bloqueo y emisión de tokens.

### Token de proveedor en cookie de servidor

La sesión será el token emitido por PocketBase, guardado en una cookie `HttpOnly`. En cada límite protegido se comprobará mediante `auth-refresh`, que verifica el token en PocketBase y devuelve el usuario actual. Se evita confiar únicamente en decodificar el JWT localmente, ya que la decodificación no demuestra vigencia ni revocación.

### Autorización en página y API

`app/page.tsx` decidirá en el servidor entre la pantalla de acceso y `TaskManager`. `/api/workspace` repetirá la verificación antes de tocar datos. Esta defensa en profundidad evita que un cliente omita la interfaz y consulte el endpoint directamente.

### Acceso visual integrado

La pantalla usará los tokens azul noche existentes. En escritorio, un panel editorial breve presentará una línea de jornada con nodos luminosos —la firma visual, inspirada en la organización temporal del producto— junto a una tarjeta de acceso contenida. En móvil se priorizará el formulario. Se conservarán contraste, foco visible y movimiento reducido.

### Continuidad del workspace

La identidad autoriza el acceso al workspace único configurado por `POCKETBASE_WORKSPACE_KEY`; no se cambia la clave ni el esquema de la colección. La separación multiusuario queda explícitamente fuera de alcance para evitar una migración de datos implícita.

## Risks / Trade-offs

- [Una validación remota por request agrega latencia y depende de PocketBase] → Usar una única llamada pequeña de `auth-refresh` por límite protegido y respuestas sin caché.
- [Guardar el token del proveedor en cookie amplía el impacto de una filtración del token] → Cookie inaccesible a JavaScript, segura en producción, `SameSite=Lax`, prioridad alta y expiración alineada con el JWT.
- [Una colección de usuarios con otro nombre impediría el acceso] → Variable `POCKETBASE_USERS_COLLECTION` y error de configuración distinguible en el servidor.
- [Varios usuarios autenticados compartirían datos] → Documentar que el alcance es acceso protegido a un workspace único; diseñar una migración separada si se requiere multiusuario.

## Migration Plan

1. Desplegar las nuevas rutas y utilidades con la variable opcional de colección.
2. Verificar que exista al menos un usuario autenticable en PocketBase.
3. Probar inicio, recarga, acceso directo a `/api/workspace` y cierre de sesión.
4. Para revertir, retirar la protección y las rutas de autenticación; el esquema y el contenido del workspace no requieren rollback.

## Open Questions

Ninguna para este alcance. La creación y administración de cuentas permanece en PocketBase.
