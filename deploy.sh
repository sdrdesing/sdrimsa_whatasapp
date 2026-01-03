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

# 1.5. Crear .env.production si no existe
if [ ! -f ".env.production" ]; then
    echo "📝 Creando archivo .env.production..."
    cp .env.example .env.production
    
    # Actualizar valores para producción
    sed -i 's/APP_ENV=local/APP_ENV=production/' .env.production
    sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env.production
    sed -i 's|APP_URL=http://localhost|APP_URL=https://sdrimsac.xyz|' .env.production
    sed -i 's/DB_HOST=127.0.0.1/DB_HOST=sdrimsacbot-mysql/' .env.production
    sed -i 's/DB_USERNAME=root/DB_USERNAME=sdrimsac/' .env.production
    sed -i 's/DB_PASSWORD=/DB_PASSWORD=Sdrimsac@2025!/' .env.production
    sed -i 's/DB_DATABASE=laravel/DB_DATABASE=sdrimsacbot_central/' .env.production
    sed -i 's/REDIS_HOST=127.0.0.1/REDIS_HOST=sdrimsacbot-redis/' .env.production
    sed -i 's/CACHE_DRIVER=file/CACHE_DRIVER=redis/' .env.production
    sed -i 's/QUEUE_CONNECTION=sync/QUEUE_CONNECTION=redis/' .env.production
    
    # Agregar DB_ROOT_PASSWORD si no existe
    if ! grep -q "DB_ROOT_PASSWORD" .env.production; then
        echo "DB_ROOT_PASSWORD=root" >> .env.production
    fi
    
    echo "⚠️ IMPORTANTE: Edita .env.production con contraseñas seguras:"
    echo "   nano .env.production"
    echo "   Especialmente: DB_PASSWORD, DB_ROOT_PASSWORD, MAIL_USERNAME, MAIL_PASSWORD"
    echo ""
    echo "⏸️ Pausando 30 segundos para que puedas editar el archivo..."
    sleep 30
fi

# 2. Pull de cambios del repositorio
echo "📥 Obteniendo últimos cambios del repositorio..."
git pull origin main || echo "⚠️ Advertencia: No se pudo hacer pull"

# 2.5. Instalar dependencias PHP
echo "📦 Instalando dependencias PHP con Composer..."
composer install --no-dev --optimize-autoloader

# 3. Construir imagen Docker
echo "🔨 Construyendo imagen Docker..."
docker-compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.production.yml build --no-cache

# 4. Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.production.yml up -d

# 5. Generar APP_KEY si no existe
echo "🔑 Configurando application key..."
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force

# 6. Compilar assets frontend
echo "📦 Compilando assets frontend..."
docker-compose -f docker-compose.production.yml exec -T app npm install --legacy-peer-deps
docker-compose -f docker-compose.production.yml exec -T app npm run build

# 7. Ejecutar migraciones
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
echo "   1. Verificar logs: docker compose -f docker-compose.production.yml logs -f"
echo "   2. Crear primer tenant: docker compose -f docker-compose.production.yml exec app php artisan tinker"
echo "   3. Configurar dominios para tenants"
