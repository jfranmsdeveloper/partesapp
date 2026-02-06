# Guía de Limpieza del Proyecto

Debido a la migración completa al nuevo backend PHP (localizado en `php-backend/`) y el uso de Docker, los siguientes archivos y carpetas relacionados con la arquitectura anterior (Node.js/Express y almacenamiento local plano) ya no son necesarios y pueden ser eliminados para mantener el proyecto limpio.

## 🗑️ Carpetas para Eliminar

- **`server/`**
    - Contiene toda la lógica del antiguo servidor Node.js/Express (`server.js`, rutas, controladores).
    - **Razón:** Ha sido reemplazado totalmente por `php-backend/index.php`.

## 📄 Archivos para Eliminar

- **`start-app.command`**
    - Script de arranque antiguo que ejecutaba `npm run dev` (Node + Vite).
    - **Razón:** Ahora utilizas `start-docker.command` para levantar el entorno PHP + Frontend.

- **`verify-supabase.js`**
    - Script de utilidad para verificar conexión con Supabase Cloud.
    - **Razón:** El proyecto ahora usa un cliente local (`src/utils/localClient.ts`) que simula Supabase contra tu PHP local.

- **Archivos SQL Legados (Opcionales)**
    - `clients_setup.sql`
    - `supabase_setup.sql`
    - `update_partes_schema.sql`
    - **Razón:** La estructura de base de datos actual y válida está en `php-backend/database.sql`. Estos archivos son remanentes de versiones anteriores o para la nube.

## ⚠️ Notas Adicionales

- **`package.json`**: Aunque seguiremos usándolo para el frontend (`vite`, `tailwindcss`), contiene dependencias del backend antiguo (`express`, `body-parser`, `nodemailer`) que podrías desinstalar más adelante si quieres limpiar el `node_modules`, pero dejarlos ahí no rompe nada.
