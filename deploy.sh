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

# 5. Esperar MySQL
echo "⏳ Esperando MySQL..."
for i in {1..60}; do
    docker exec sdrimsacbot-mysql mariadb-admin -uroot -proot ping &>/dev/null && break
    sleep 2
done

# 6. Instalar dependencias
docker-compose -f docker-compose.production.yml exec -T app composer install --no-dev --optimize-autoloader
docker-compose -f docker-compose.production.yml exec -T app npm ci
docker-compose -f docker-compose.production.yml exec -T app npm run build

# 7. Configurar BD
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate --force

# 8. Cachear config
docker-compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan view:cache

# 9. Permisos
docker-compose -f docker-compose.production.yml exec -T app chown -R www-data:www-data /var/www/storage

# 10. Verificar
docker-compose -f docker-compose.production.yml ps