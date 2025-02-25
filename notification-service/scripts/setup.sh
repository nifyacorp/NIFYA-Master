#!/bin/bash

# Script de configuración inicial para el servicio de notificaciones

# Crear la estructura de directorios si no existe
mkdir -p logs

# Copiar el archivo .env.example a .env si no existe
if [ ! -f .env ]; then
  echo "Creando archivo .env a partir de .env.example..."
  cp .env.example .env
  echo "Por favor, edita el archivo .env con tus credenciales reales"
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
  echo "Node.js no está instalado. Por favor, instala Node.js v18 o superior."
  exit 1
fi

# Instalar dependencias
echo "Instalando dependencias..."
npm install

echo "-------------------------------------"
echo "Configuración completada con éxito"
echo "Para iniciar el servicio, ejecuta:"
echo "npm start"
echo "-------------------------------------" 