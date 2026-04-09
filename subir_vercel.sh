#!/bin/bash

echo "Limpiando cachés internas y preparando subida a Git y Vercel..."

# Evitar subidas accidentales de archivos .zip gigantes:
echo "partes-app.zip" >> .gitignore

# Sincronizamos todo
git add .
git commit -m "Deploy: forzar sincronización con Vercel"

# Subir a la rama
echo "🚀 Subiendo cambios a GitHub. Vercel empezará el despliegue automático inmediatamente después..."
git push origin main

echo "✅ ¡Listo! Deberías poder ver la compilación iniciarse en tu panel de Vercel (https://vercel.com/dashboard)."
