#!/bin/bash
# 🚀 DEPLOY SDRIMSACBOT A PRODUCCIÓN
# Uso: bash deploy.sh

set -e

DOMAIN="sdrimsac.xyz"
CONTAINER_PREFIX="sdrimsacbot"

echo "=================================================="
echo "   🚀 DEPLOY SDRIMSACBOT A PRODUCCIÓN"
echo "=================================================="
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.production.yml"
    exit 1
fi

# 2. Crear .env.production si no existe
if [ ! -f ".env.production" ]; then
    echo "📝 Creando .env.production..."
    cp .env.example .env.production
    sed -i 's/APP_ENV=local/APP_ENV=production/' .env.production
    sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env.production
    sed -i 's|APP_URL=.*|APP_URL=https://sdrimsac.xyz|' .env.production
    echo "✅ .env.production creado (verifica las contraseñas)"
fi

# 3. Obtener cambios del repositorio
echo "📥 Obteniendo cambios de Git..."
git pull origin main || true

# 4. Detener contenedores anteriores
echo "� Deteniendo contenedores..."
docker-compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true

# 5. Construir imagen Docker
echo "🔨 Construyendo imagen Docker (esto toma 2-5 minutos)..."
docker-compose -f docker-compose.production.yml build --no-cache

# 6. Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.production.yml up -d

# 7. Esperar a que MySQL esté listo
echo "⏳ Esperando MySQL..."
MYSQL_CONTAINER="${CONTAINER_PREFIX}-mysql"
for i in {1..60}; do
    if docker exec $MYSQL_CONTAINER mariadb-admin -uroot -proot ping &>/dev/null 2>&1; then
        echo "✅ MySQL listo"
        break
    fi
    if [ $((i % 10)) -eq 0 ]; then
        echo "   Intento $i/60..."
    fi
    sleep 2
done

if [ $i -eq 60 ]; then
    echo "❌ MySQL no respondió después de 2 minutos"
    docker-compose -f docker-compose.production.yml logs mysql
    exit 1
fi

# 8. Instalar dependencias PHP
echo "📦 Instalando dependencias PHP..."
docker-compose -f docker-compose.production.yml exec -T app composer install --no-dev --optimize-autoloader

# 9. Instalar y compilar assets Node.js
echo "📦 Instalando dependencias Node.js..."
docker-compose -f docker-compose.production.yml exec -T app npm ci

echo "🔨 Compilando assets (Vite)..."
docker-compose -f docker-compose.production.yml exec -T app npm run build

# 10. Configurar aplicación
echo "🔑 Configurando aplicación..."
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force

# 11. Base de datos
echo "💾 Ejecutando migraciones..."
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate --force

# 12. Caché
echo "⚙️  Optimizando..."
docker-compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan view:cache

# 13. Permisos
echo "🔒 Ajustando permisos..."
docker-compose -f docker-compose.production.yml exec -T app chown -R www-data:www-data /var/www/storage
docker-compose -f docker-compose.production.yml exec -T app chmod -R 755 /var/www/storage

# 14. Resumen
echo ""
echo "=================================================="
echo "✅ ¡DEPLOY COMPLETADO EXITOSAMENTE!"
echo "=================================================="
echo ""
echo "📊 Estado de servicios:"
docker-compose -f docker-compose.production.yml ps
echo ""
echo "🌐 Aplicación: https://$DOMAIN"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker-compose -f docker-compose.production.yml logs -f app"
echo "   Entrar app:   docker-compose -f docker-compose.production.yml exec app bash"
echo "   Ver recursos: docker stats"
echo ""
echo "⚠️  Si hay errores, revisa: docker-compose -f docker-compose.production.yml logs"
