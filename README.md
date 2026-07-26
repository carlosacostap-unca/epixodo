This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication and PocketBase

Epixodo requires an authenticated PocketBase user before showing or synchronizing
the workspace. Create the user from the PocketBase administration UI and configure:

```bash
POCKETBASE_URL=https://your-pocketbase.example
POCKETBASE_USERS_COLLECTION=users
```

`POCKETBASE_USERS_COLLECTION` is optional and defaults to `users`. Domain data is
stored in normalized PocketBase collections and every server query is scoped to
the authenticated user ID. Validate the remote schema with:

```bash
npm run schema:normalized:validate
```

Normalized reads and writes are enabled by default after the verified migration.
The legacy `workspaces/default` document remains available for rollback. To return
temporarily to it for the migrated owner, configure:

```bash
POCKETBASE_NORMALIZED_READS=false
POCKETBASE_NORMALIZED_WRITES=false
POCKETBASE_LEGACY_FALLBACK=true
```

Set `POCKETBASE_LEGACY_FALLBACK=false` after the stabilization period. Do not
delete the legacy record until a separate archival change has been approved.

## Ingreso con IA

El módulo Ingreso acepta texto o una nota de voz, la procesa del lado servidor y
crea una tarea pendiente, sin asunto ni fechas, dentro de Bandeja. Configurá la
clave únicamente en `.env.local` o en las variables del entorno de despliegue:

```bash
OPENAI_API_KEY=sk-...
OPENAI_CAPTURE_MODEL=gpt-5.6-luna
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

Los dos nombres de modelo son opcionales: esos son sus valores predeterminados.
No uses el prefijo `NEXT_PUBLIC_` para la clave, porque la expondría al navegador.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
