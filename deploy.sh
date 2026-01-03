#!/bin/bash
# Script de inicialización para el despliegue en VPS
# Uso: bash deploy.sh

set -e

DOMAIN="sdrimsac.xyz"
PROJECT_PATH="/var/www/sdrimsacbot"
USER="www-data"

echo "🚀 Iniciando despliegue de SDRimsac Bot..."

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.production.yml"
    echo "Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

# 2. Pull de cambios del repositorio
echo "📥 Obteniendo últimos cambios del repositorio..."
git pull origin main || echo "⚠️ Advertencia: No se pudo hacer pull"

# 3. Construir imagen Docker
echo "🔨 Construyendo imagen Docker..."
docker-compose -f docker-compose.production.yml build --no-cache

# 4. Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.production.yml up -d

# 5. Generar APP_KEY si no existe
echo "🔑 Configurando application key..."
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force

# 6. Ejecutar migraciones
echo "💾 Ejecutando migraciones de base de datos..."
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate --database=central --force

# 7. Limpiar y cachear configuración
echo "⚙️ Optimizando aplicación..."
docker-compose -f docker-compose.production.yml exec -T app php artisan config:clear
docker-compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan view:cache

# 8. Establecer permisos correctos
echo "🔒 Estableciendo permisos..."
docker-compose -f docker-compose.production.yml exec -T app chown -R www-data:www-data /var/www/storage
docker-compose -f docker-compose.production.yml exec -T app chmod -R 775 /var/www/storage
docker-compose -f docker-compose.production.yml exec -T app chmod -R 775 /var/www/bootstrap/cache

# 9. Verificar estado
echo ""
echo "✅ Despliegue completado exitosamente!"
echo ""
echo "Estado de servicios:"
docker-compose -f docker-compose.production.yml ps
echo ""
echo "📍 Tu aplicación está disponible en: https://$DOMAIN"
echo ""
echo "ℹ️ Próximos pasos:"
echo "   1. Verificar logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   2. Crear primer tenant: docker-compose -f docker-compose.production.yml exec app php artisan tinker"
echo "   3. Configurar dominios para tenants"
