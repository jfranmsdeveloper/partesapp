# Cómo se guardan los datos en PartesApp (Técnica Feynman)

Imagina que esta aplicación es como un **restaurante bien organizado**. Para entender cómo se guardan los datos, vamos a ver qué función cumple cada parte del restaurante:

## 1. El Cliente y el Camarero (Frontend y API)
Cuando tú (el usuario) haces algo en la pantalla, como crear un parte o actualizar tu perfil, es como si le hicieras un pedido al camarero.
- **Tú (Frontend/React):** Ves el menú (la interfaz), rellenas un formulario y pulsas "Guardar".
- **El Camarero (localClient):** Toma tu nota. En lugar de llevarla a una oficina central lejos en otra ciudad (la Nube), camina hacia la cocina que está justo ahí detrás.

## 2. La Cocina y el Chef (El Servidor Local)
Detrás de las cortinas hay una cocina que trabaja sin parar. Esta "cocina" es un pequeño servidor que vive en tu propio ordenador (o donde esté instalada la app).
- **El Chef (server.js):** Recibe la nota del camarero. Lee la orden ("Guardar nuevo parte") y decide qué hacer. No necesita pedir permiso a nadie de fuera; él tiene el control total.

## 3. El Gran Libro de Cuentas (La Base de Datos)
El Chef no guarda la información en su cabeza. Tiene un **Gran Libro Maestro** donde anota absolutamente todo.
- **El Libro (data.json):** Es un único archivo de texto. Sí, solo uno.
    - Cuando llega un usuario nuevo, el Chef lo escribe en la página de "Usuarios".
    - Cuando se crea un parte, lo anota en la página de "Partes".
    - Si borras algo, el Chef usa su goma de borrar y lo elimina de la página.
    - **Ventaja:** Es súper simple. Todo está en un solo sitio.
    - **Desventaja:** Si el restaurante se vuelve gigantesco (millones de pedidos), el libro pesaría demasiado. Pero para este restaurante, es perfecto.

## 4. El Archivador (Archivos Adjuntos)
A veces, los clientes traen cosas que no caben en el libro, como una foto de su DNI o un documento firmado (PDFs).
- **El Archivador (carpeta `uploads`):** El Chef no puede pegar el documento dentro del libro porque se rompería.
- Lo que hace es:
    1. Toma el documento real (el PDF o la imagen).
    2. Lo guarda en un cajón físico etiquetado (la carpeta `server/uploads`).
    3. En el **Gran Libro (data.json)**, escribe una nota pequeña: *"La foto de Juan está en el cajón 3, carpeta uploads"*.

---

### Resumen en 3 pasos:
1. **Pides algo:** La app le dice al servidor local "Guarda esto".
2. **El Servidor escribe:** Abre el archivo `data.json` y escribe los datos (texto).
3. **Archiva lo pesado:** Si hay fotos o PDFs, los guarda como archivos normales en una carpeta y anota dónde los dejó.

**En conclusión:** No dependes de internet ni de bases de datos complejas en la nube. Todo vive contigo, en archivos simples y ordenados dentro de tu propia "cocina".
