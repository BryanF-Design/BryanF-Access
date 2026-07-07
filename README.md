# BryanF Access

Portal privado para BryanF Design. La app final vive aqui y combina la marca/tutoriales de BryanF Access con la base segura de BryanF Clients: Supabase Auth por magic link, panel admin, panel cliente, entregables, pagos, milestones, recursos y archivos privados.

## Setup

1. Copia `.env.local.example` como `.env.local`.
2. Llena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Ejecuta `supabase/schema.sql` en el SQL editor de Supabase.
4. Crea usuarios desde Supabase Auth y vincula cada uno a `admins.auth_user_id` o `clients.auth_user_id`.
5. Configura el redirect de Auth a `http://localhost:3000/auth/callback` y al dominio final en produccion.
6. En produccion, configura Turnstile y Upstash Redis.

## Modelo De Acceso

- No hay registro abierto.
- El login usa magic link con `shouldCreateUser: false`.
- Un cliente solo ve sus propios proyectos, pagos, milestones, entregables y recursos por RLS.
- El admin se reconoce por una fila en `admins`, no por password en env.
- La service role solo se usa en Server Actions y rutas server-only.

## Archivos Y Tutoriales

- Los entregables se suben al bucket privado `deliverables` y se descargan con signed URLs cortas.
- Los tutoriales heredados de Access viven en `protected/tutorials`, fuera de `public`.
- `/api/tutorial-assets/[...path]` solo sirve videos/imagenes si hay sesion y fila vinculada en `clients` o `admins`.

## Comandos

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Pruebas Manuales Criticas

- Cliente A no puede abrir `/proyecto/[id]` ni entregables del cliente B.
- Un cliente autenticado no puede entrar a `/admin`.
- Un usuario autenticado sin fila en `clients` o `admins` no ve datos.
- Login con correo inexistente muestra la misma respuesta generica.
- Descarga sin sesion redirige a `/login`; archivo ajeno responde 404.
- Revisar responsive en 375, 768, 1024 y 1440 px sin overflow horizontal.
