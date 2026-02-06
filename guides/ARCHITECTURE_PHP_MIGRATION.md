# Migración a Arquitectura LAMP (Linux, Apache, MySQL, PHP)

Has decidido mover la capa de persistencia de datos (donde se guarda la información) de un sistema de archivos local (Node.js + JSON) a una base de datos real (MySQL) gestionada por PHP.

Aquí te explico cómo funciona este nuevo sistema de manera sencilla.

## 1. El Nuevo "Chef": PHP
Antes tenías un servidor Node.js (`server.js`) que actuaba como chef en tu cocina local. Ahora hemos contratado a un nuevo chef mucho más compatible con los restaurantes estándar (hostings compartidos, servidores legacy, etc.): **PHP**.

Este nuevo chef vive en la carpeta `php-backend/`.

### ¿Qué hace el archivo `index.php`?
Es el **Jefe de Cocina**. Recibe todas las comandas (peticiones) del camarero (tu aplicación React).
- Si le piden "Dame los usuarios", él traduce esa orden a lenguaje SQL.
- Si le piden "Guarda este parte", él prepara la sentencia SQL `INSERT`.
- También sabe manejar archivos (subida de avatares y PDFs), guardándolos en `uploads/`.

## 2. El Nuevo "Libro Maestro": MySQL
El archivo de texto `data.json` se ha jubilado. Ahora usamos una **Base de Datos Relacional (MySQL)**.
- Imagina que en lugar de un cuaderno de notas, ahora tienes una sala de archivos con archivadores metálicos indestructibles.
- Hemos creado un plano de esta sala en el archivo `database.sql`.
- **Ventajas:**
    - Es mucho más rápido.
    - Pueden entrar 100 camareros a la vez y no se bloquea.
    - Es el estándar mundial: cualquier hosting barato soporta esto.

## 3. ¿Cómo conectamos todo?
Tu aplicación React (el FrontEnd) sigue siendo igual. La única diferencia es que le hemos cambiado la dirección del "restaurante" en su agenda.

- **Antes:** `src/utils/localClient.ts` llamaba a `/api` (que era Node.js).
- **Ahora:** Llama a `http://localhost:8000` (donde vivirá tu PHP).

### Pasos para ponerlo en marcha:

1.  **En Producción (Tu Hosting):**
    -   Sube la carpeta `php-backend` a tu servidor (por ejemplo, a `/public_html/api`).
    -   Crea una base de datos MySQL e importa el archivo `database.sql`.
    -   Edita el archivo `index.php` (al principio) y pon tus contraseñas reales de la base de datos (`$host`, `$username`, `$password`).
    -   Asegúrate de que la carpeta `uploads` tenga permisos de escritura (777 o 755).

2.  **En Local (Tu ordenador ahora mismo):**
    -   Necesitas tener PHP y MySQL instalados (XAMPP, MAMP, o Docker).
    -   Arranca el servidor PHP en la carpeta backend:
        ```bash
        php -S localhost:8000 -t php-backend
        ```
    -   Asegúrate de que tu React apunte a esa dirección (ya lo he configurado en `localClient.ts`).

## Resumen del Flujo
1. **Usuario** crea un parte en React.
2. **React** envía un JSON a `http://tuservidor.com/api/partes`.
3. **Apache** recibe la petición y despierta a **PHP** (`index.php`).
4. **PHP** lee el JSON, se conecta a **MySQL** y ejecuta: `INSERT INTO partes ...`.
5. **MySQL** guarda el dato de forma segura y devuelve "OK".
6. **PHP** le dice a **React** "Todo listo".

¡Ahora tu aplicación es profesional y compatible con el 99% de los servidores del mundo!
