cd /var/www/sdrimsacbot || exit 1

# 0. Descargar últimos cambios
echo "📡 Descargando últimos cambios desde Git..."
# Intentamos con main, si falla con master, y si falla mostramos advertencia
git pull origin main || git pull origin master || echo "⚠️ Advertencia: No se pudo hacer git pull automático. Verifica que no haya cambios locales en el VPS."

set -e

# 1. Crear .env.production si no existe
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
APP_NAME=sdrimsacbot
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:gURgrvfW8HLNz/GLI2i9Xk0b47+aSzt3GNOLatBqjJ8=
APP_URL=https://sdrimsac.xyz

DB_HOST=mysql
DB_DATABASE=sdrimsacbot
DB_USERNAME=sdrimsac
DB_PASSWORD=Sdrimsac@2026!
DB_ROOT_PASSWORD=root

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=redis
LOG_LEVEL=error
WHATSAPP_NODE_URL=http://baileys:3000
EOF
fi

# 2. Cargar variables del .env.production para usarlas en el script
set -a
source .env.production
set +a

# 3. Detener contenedores
echo "🛑 Deteniendo contenedores antiguos..."
docker compose -f docker-compose.production.yml down --remove-orphans

# 4. Construir
echo "🔨 Construyendo nuevas imágenes (sin caché para asegurar frescura)..."
docker compose -f docker-compose.production.yml build --no-cache

# 5. Levantar servicios
echo "🚀 Levantando servicios..."
docker compose -f docker-compose.production.yml up -d

# 5.5 Esperar a que los servicios inicien
echo "⏳ Esperando que los servicios inicien (30 segundos)..."
sleep 30

# 6. Esperar MySQL completamente listo
echo "⏳ Esperando MySQL..."
MYSQL_READY=false

for i in {1..150}; do
    if docker compose -f docker-compose.production.yml exec -T mysql sh -lc \
      "mariadb -h 127.0.0.1 -uroot -p\"$DB_ROOT_PASSWORD\" -e 'SELECT 1;'" \
      >/dev/null 2>&1; then
        echo "✅ MySQL responde"
        MYSQL_READY=true
        break
    fi

    if [ $((i % 20)) -eq 0 ]; then
        echo "  Intento $i/150..."
    fi
    sleep 2
done

if [ "$MYSQL_READY" = false ]; then
    echo "❌ Error: BD no está lista después de 150 intentos"
    echo "💡 Verificando logs:"
    docker compose -f docker-compose.production.yml logs mysql | tail -50
    exit 1
fi

# Esperar más segundos adicionales para estabilidad
echo "⏳ Esperando estabilidad (20 segundos más)..."
sleep 20

# 7. Instalar dependencias
echo "📦 Instalando dependencias PHP..."
docker compose -f docker-compose.production.yml exec -T app composer install --no-dev --optimize-autoloader

# --- LIMPIEZA DE CACHÉ ---
echo "🧹 Limpiando caché de Laravel para evitar versiones antiguas..."
docker compose -f docker-compose.production.yml exec -T app php artisan optimize:clear

echo "📦 Instalando dependencias Node.js..."
docker compose -f docker-compose.production.yml exec -T app npm install --legacy-peer-deps

echo "🔨 Compilando assets con Vite para producción..."
docker compose -f docker-compose.production.yml exec -T app npm run build

# 8. Configurar BD
echo "🔑 Verificando APP_KEY..."
docker compose -f docker-compose.production.yml exec -T app php artisan key:generate --force

echo "⏳ Verificando conexión a BD antes de migraciones..."
for i in {1..30}; do
    if docker compose -f docker-compose.production.yml exec -T app php artisan tinker <<< "DB::connection()->getPdo();" \
      >/dev/null 2>&1; then
        echo "✅ Conexión a BD verificada"
        break
    fi
    echo "  Intento $i/30 de conectar a BD..."
    sleep 2
done

echo "💾 Ejecutando migraciones de base de datos..."
docker compose -f docker-compose.production.yml exec -T app php artisan migrate --force

# 9. Cachear config para máximo rendimiento
echo "🚀 Optimizando caché de Laravel..."
docker compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker compose -f docker-compose.production.yml exec -T app php artisan view:cache

# 10. Permisos
echo "🔒 Ajustando permisos de carpetas..."
docker compose -f docker-compose.production.yml exec -T app chown -R www-data:www-data /var/www/storage

# 11. Verificar
echo "✅ Estado final de los servicios:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "=================================================="
echo "✅ ¡DEPLOY COMPLETADO Y ACTUALIZADO CON ÉXITO!"
echo "=================================================="
echo ""
echo "🌐 URL: https://sdrimsac.xyz"
echo ""
echo "📋 RECOMENDACIÓN:"
echo "   Si los cambios no se ven en el navegador,"
echo "   presiona Ctrl + F5 para limpiar la caché local."
echo "=================================================="
