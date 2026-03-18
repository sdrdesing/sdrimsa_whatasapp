#!/bin/bash
# Script de Actualización Rápida
# Úsalo para cambios pequeños en lógica, vistas o controladores de Laravel.

cd /var/www/sdrimsacbot || exit 1

echo "📡 Descargando cambios desde Git..."
# Intentamos con main, si falla con master
git pull origin main || git pull origin master || echo "⚠️ Advertencia: No se pudo hacer git pull automático."

set -e

# Solo limpiamos y optimizamos Laravel (Tarda segundos)
echo "🧹 Limpiando caché de Laravel y optimizando..."
docker compose -f docker-compose.production.yml exec -T app php artisan optimize:clear
docker compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker compose -f docker-compose.production.yml exec -T app php artisan view:cache

# (OPCIONAL) Si cambiaste archivos JS o CSS (Vite), descomenta estas líneas:
# echo "🔨 Re-compilando assets (Vite)..."
# docker compose -f docker-compose.production.yml exec -T app npm run build

# Si cambiaste dependencias de Composer:
# echo "📦 Actualizando dependencias de Composer..."
# docker compose -f docker-compose.production.yml exec -T app composer install --no-dev --optimize-autoloader

echo ""
echo "=================================================="
echo "⚡ ACTUALIZACIÓN RÁPIDA COMPLETADA"
echo "=================================================="
echo "🌐 URL: https://sdrimsac.site"
echo ""
echo "Nota: Si los cambios no se ven en el navegador,"
echo "prueba recargar con Ctrl + F5."
echo "=================================================="
