# 🚀 DEPLOY A PRODUCCIÓN - GUÍA COMPLETA EN 1 HOJA

## ⚡ OPCIÓN RÁPIDA (3 pasos)

```bash
# 1. Local: Pushear cambios
git push origin main

# 2. VPS: Conectar
ssh root@sdrimsac.xyz

# 3. VPS: Ejecutar deploy
cd /var/www/sdrimsacbot
bash deploy.sh
```

---

## 🔧 INSTALACIÓN MANUAL EN EL VPS (Paso a Paso)

### 1. Conectarse al VPS
```bash
ssh root@sdrimsac.xyz
cd /var/www/sdrimsacbot
```

### 2. Crear estructura de directorios
```bash
mkdir -p storage/logs storage/uploads
mkdir -p bootstrap/cache
mkdir -p docker/mysql docker/nginx docker/supervisor
chmod -R 755 storage bootstrap/cache
```

### 3. Crear .env.production
```bash
cat > .env.production << 'EOF'
APP_NAME=sdrimsacbot
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:gURgrvfW8HLNz/GLI2i9Xk0b47+aSzt3GNOLatBqjJ8=
APP_URL=https://sdrimsac.xyz

DB_CONNECTION=mysql
DB_HOST=sdrimsacbot-mysql
DB_PORT=3306
DB_DATABASE=sdrimsacbot
DB_USERNAME=sdrimsac
DB_PASSWORD=Sdrimsac@2026!
DB_ROOT_PASSWORD=root

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=sdrimsacbot-redis
REDIS_PORT=6379

LOG_CHANNEL=stack
LOG_LEVEL=error

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME=sdrimsacbot

WHATSAPP_NODE_URL=http://baileys:3000
EOF
chmod 600 .env.production
```

### 4. Clonar repositorio (si es primera vez)
```bash
cd /var/www/sdrimsacbot
git clone https://github.com/sdrdesing/sdrimsacbot.git .
git checkout main
```

### 5. Detener contenedores anteriores
```bash
docker-compose -f docker-compose.production.yml down 2>/dev/null || true
```

### 6. Construir imagen Docker
```bash
docker-compose -f docker-compose.production.yml build --no-cache
```

### 7. Levantar servicios
```bash
docker-compose -f docker-compose.production.yml up -d
```

### 8. Esperar a que MySQL esté listo (3 minutos)
```bash
echo "⏳ Esperando MySQL..."
for i in {1..60}; do
  docker exec sdrimsacbot-mysql mariadb-admin -uroot -proot ping &>/dev/null && break
  sleep 2
done
echo "✅ MySQL listo"
```

### 9. Instalar dependencias
```bash
# PHP
docker-compose -f docker-compose.production.yml exec -T app composer install --no-dev --optimize-autoloader

# Node.js
docker-compose -f docker-compose.production.yml exec -T app npm ci
docker-compose -f docker-compose.production.yml exec -T app npm run build
```

### 10. Configurar aplicación
```bash
# APP_KEY
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force

# Base de datos
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate --force

# Caché
docker-compose -f docker-compose.production.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.production.yml exec -T app php artisan view:cache

# Permisos
docker-compose -f docker-compose.production.yml exec -T app chown -R www-data:www-data /var/www/storage
```

### 11. Certificado SSL (Primera vez)
```bash
apt install -y certbot python3-certbot-nginx

certbot certonly --standalone \
  -d sdrimsac.xyz \
  -d www.sdrimsac.xyz \
  --email admin@sdrimsac.xyz \
  --agree-tos \
  -n
```

### 12. Reiniciar y verificar
```bash
docker-compose -f docker-compose.production.yml restart nginx

# Ver logs
docker-compose -f docker-compose.production.yml logs -f app

# Probar
curl -I https://sdrimsac.xyz
```

---

## 📋 COMANDOS ÚTILES POST-DEPLOY

### Ver estado
```bash
docker-compose -f docker-compose.production.yml ps
docker stats
```

### Ver logs
```bash
docker-compose -f docker-compose.production.yml logs -f app
docker-compose -f docker-compose.production.yml logs -f mysql
docker-compose -f docker-compose.production.yml logs -f nginx
```

### Entrar a la aplicación
```bash
docker-compose -f docker-compose.production.yml exec app bash
docker-compose -f docker-compose.production.yml exec app php artisan tinker
```

### Ejecutar comandos Laravel
```bash
docker-compose -f docker-compose.production.yml exec app php artisan migrate
docker-compose -f docker-compose.production.yml exec app php artisan cache:clear
docker-compose -f docker-compose.production.yml exec app php artisan queue:work
```

### Hacer backup
```bash
docker-compose -f docker-compose.production.yml exec -T mysql mysqldump \
  -u sdrimsac -pSdrimsac@2026! sdrimsacbot > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Actualizar código
```bash
cd /var/www/sdrimsacbot
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate
```

---

## 🆘 TROUBLESHOOTING

### Error: "unknown flag: --env-file"
**Solución:** No uses `--env-file`, el archivo `.env.production` se lee automáticamente

### App no carga (error 502)
```bash
docker-compose -f docker-compose.production.yml logs app
# Ver si hay errores en PHP
```

### Error de conexión a BD
```bash
docker-compose -f docker-compose.production.yml logs mysql
# Verificar credenciales en .env.production
```

### SSL no funciona
```bash
certbot certificates  # Ver estado
certbot renew --force-renewal  # Renovar
docker-compose -f docker-compose.production.yml restart nginx
```

### Baileys (WhatsApp) no funciona
```bash
docker-compose -f docker-compose.production.yml logs baileys
docker-compose -f docker-compose.production.yml restart baileys
```

---

## 🔐 CREDENCIALES IMPORTANTES

**⚠️ Cambiar ANTES de deploy:**

```env
DB_PASSWORD=Sdrimsac@2026!          # ← Cambiar contraseña
DB_ROOT_PASSWORD=root                # ← Cambiar contraseña
MAIL_HOST=smtp.mailtrap.io          # ← Configurar email real
MAIL_USERNAME=tu_email              # ← Tu email
MAIL_PASSWORD=tu_contraseña         # ← Tu contraseña
```

**Generar contraseñas seguras:**
```bash
openssl rand -base64 32
```

---

## ✅ CHECKLIST FINAL

- [ ] VPS tiene Docker y Docker Compose
- [ ] Dominio apunta al VPS
- [ ] `.env.production` configurado con contraseñas seguras
- [ ] `docker-compose.production.yml` existe
- [ ] `Dockerfile.production` existe
- [ ] Certificado SSL generado
- [ ] Migraciones ejecutadas
- [ ] Assets compilados
- [ ] App carga en HTTPS
- [ ] Email funciona
- [ ] WhatsApp/Baileys funciona

---

## 📞 MONITOREO

```bash
# Ver todo en tiempo real
docker stats
docker-compose -f docker-compose.production.yml logs -f

# Revisar regularmente
df -h           # Espacio en disco
docker ps -a    # Contenedores activos
```

**¡Listo para producción! 🎉**
