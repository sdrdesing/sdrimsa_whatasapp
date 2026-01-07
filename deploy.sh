cd /var/www/sdrimsacbot

# 1. Crear .env.production si no existe
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
APP_NAME=sdrimsacbot
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:gURgrvfW8HLNz/GLI2i9Xk0b47+aSzt3GNOLatBqjJ8=
APP_URL=https://sdrimsac.xyz
DB_HOST=sdrimsacbot-mysql
DB_DATABASE=sdrimsacbot
DB_USERNAME=sdrimsac
DB_PASSWORD=Sdrimsac@2026!
DB_ROOT_PASSWORD=root
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=sdrimsacbot-redis
LOG_LEVEL=error
WHATSAPP_NODE_URL=http://baileys:3000
EOF
fi

# 2. Detener contenedores
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# 3. Construir
docker-compose -f docker-compose.production.yml build --no-cache

# 4. Levantar servicios
docker-compose -f docker-compose.production.yml up -d

# 4.5 Esperar a que los servicios inicien
echo "⏳ Esperando que los servicios inicien (30 segundos)..."
sleep 30

# 5. Esperar MySQL completamente listo
echo "⏳ Esperando MySQL..."
for i in {1..150}; do
    if docker exec sdrimsacbot-mysql mariadb-admin -uroot -proot ping &>/dev/null 2>&1; then
        echo "✅ MySQL responde"
        break
    fi
    if [ $((i % 20)) -eq 0 ]; then
        echo "  Intento $i/150..."
    fi
    sleep 2
done

# Esperar a que la BD esté realmente lista (importante)
echo "⏳ Esperando que la base de datos esté completamente lista..."
for i in {1..60}; do
    if docker exec sdrimsacbot-mysql mariadb -uroot -proot -e "SELECT 1" &>/dev/null 2>&1; then
        echo "✅ Base de datos lista"
        break
    fi
    echo "  Esperando BD... ($i/60)"
    sleep 2
done

if [ $i -eq 60 ]; then
    echo "❌ Error: BD no está lista"
    exit 1
fi

# Esperar más segundos adicionales para estabilidad
echo "⏳ Esperando estabilidad (20 segundos más)..."
sleep 20

# 6. Instalar dependencias
echo "📦 Instalando dependencias PHP..."
docker-compose -f docker-compose.production.yml exec -T app composer install --no-dev --optimize-autoloader

echo "📦 Instalando dependencias Node.js (npm install)..."
docker-compose -f docker-compose.production.yml exec -T app npm install --legacy-peer-deps

echo "🔨 Compilando assets con Vite..."
docker-compose -f docker-compose.production.yml exec -T app npm run build

# 7. Configurar BD
echo "🔑 Generando APP_KEY..."
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force

echo "⏳ Verificando conexión a BD antes de migraciones..."
for i in {1..30}; do
    if docker-compose -f docker-compose.production.yml exec -T app php artisan tinker <<< "DB::connection()->getPdo();" &>/dev/null 2>&1; then
        echo "✅ Conexión a BD verificada"
        break
    fi
    echo "  Intento $i/30 de conectar a BD..."
    sleep 2
done

echo "💾 Ejecutando migraciones de base de datos..."
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate --force

# 8. Cachear config
docker-compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan view:cache

# 9. Permisos
docker-compose -f docker-compose.production.yml exec -T app chown -R www-data:www-data /var/www/storage

# 10. Verificar
docker-compose -f docker-compose.production.yml ps

echo ""
echo "=================================================="
echo "✅ ¡DEPLOY COMPLETADO!"
echo "=================================================="
echo ""
echo "Estado de servicios:"
docker-compose -f docker-compose.production.yml ps
echo ""
echo "🌐 Acceso:"
echo "   URL: https://sdrimsac.xyz"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker-compose -f docker-compose.production.yml logs -f app"
echo "   BD shell:     docker-compose -f docker-compose.production.yml exec mysql bash"
echo "   App shell:    docker-compose -f docker-compose.production.yml exec app bash"
echo "   Estado:       docker-compose -f docker-compose.production.yml ps"