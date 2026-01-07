# 🚀 Guía Completa: Preparación para Producción y Deploy a VPS

## 📋 Pre-Deploy Checklist

### ✅ Verificaciones Locales (Antes de enviar al VPS)

- [x] `.env.production` creado y configurado
- [ ] Compilar assets: `npm run build`
- [ ] Verificar que no hay errores en la compilación
- [ ] Base de datos: Backup realizado
- [ ] Código: Todos los cambios commiteados a `main`
- [ ] Dependencias: `composer install` y `npm install` funcionan correctamente

---

## 🔧 Pasos de Preparación Local

### 1. Compilar Assets de Vue.js para Producción

```bash
# En la raíz del proyecto
npm install --legacy-peer-deps
npm run build
```

Esto generará los archivos optimizados en `public/build/`.

### 2. Limpiar y Preparar Entorno

```bash
# Limpiar caché local
docker-compose down
rm -rf node_modules
rm -rf public/build

# Reinstalar dependencias limpias
npm install --legacy-peer-deps
npm run build

# Instalar dependencias PHP
composer install --no-dev --optimize-autoloader
```

### 3. Hacer Backup de Base de Datos Local

```bash
# Crear backup MySQL
docker-compose exec mysql mysqldump -u sdrimsac -p sdrimsacbot > backup-$(date +%Y%m%d-%H%M%S).sql

# O usar el script incluido
bash backup.sh
```

### 4. Commitear Cambios

```bash
git add .
git commit -m "Preparación para producción"
git push origin main
```

---

## 🖥️ Instalación en el VPS

### Requisitos en el VPS

- Ubuntu 20.04+ o Debian 11+
- Docker y Docker Compose instalados
- Dominio apuntando al VPS (sdrimsac.xyz)
- SSH key configurada
- Certbot para SSL (Let's Encrypt)

### Paso 1: Conectarse al VPS

```bash
ssh root@sdrimsac.xyz
```

### Paso 2: Preparar el Servidor

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Crear directorio del proyecto
mkdir -p /var/www/sdrimsacbot
cd /var/www/sdrimsacbot

# Crear directorios necesarios
mkdir -p storage/logs
mkdir -p storage/uploads
mkdir -p bootstrap/cache
mkdir -p docker/mysql
mkdir -p docker/nginx
mkdir -p docker/supervisor

# Permisos adecuados
chmod -R 755 storage bootstrap/cache
```

### Paso 3: Clonar Repositorio

```bash
cd /var/www/sdrimsacbot
git clone https://github.com/sdrdesing/sdrimsacbot.git .
git checkout main
```

### Paso 4: Generar Certificado SSL

```bash
# Instalar certbot si no está
apt install -y certbot python3-certbot-nginx

# Generar certificado Let's Encrypt
certbot certonly --standalone \
  -d sdrimsac.xyz \
  -d www.sdrimsac.xyz \
  --email admin@sdrimsac.xyz \
  --agree-tos \
  -n
```

El certificado se guardará en `/etc/letsencrypt/live/sdrimsac.xyz/`

### Paso 5: Crear .env.production en el VPS

```bash
cd /var/www/sdrimsacbot

# Copiar el archivo de producción
cp .env.production .env.production.vps

# Editar con valores seguros del VPS
nano .env.production.vps
```

**Valores a revisar/cambiar:**

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sdrimsac.xyz

DB_HOST=sdrimsacbot-mysql
DB_PASSWORD=GenerarContraseñaSegura123!
DB_ROOT_PASSWORD=GenerarContraseñaSegura456!

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis

MAIL_MAILER=smtp
MAIL_HOST=tu_servidor_smtp.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@ejemplo.com
MAIL_PASSWORD=tu_contraseña_app

WHATSAPP_NODE_URL=http://baileys:3000
```

### Paso 6: Ejecutar Deploy

```bash
cd /var/www/sdrimsacbot

# Dar permisos al script de deploy
chmod +x deploy.sh

# Ejecutar deploy
bash deploy.sh
```

El script hará:
- ✓ Pull de cambios
- ✓ Construcción de imágenes Docker
- ✓ Levantamiento de contenedores
- ✓ Instalación de dependencias
- ✓ Migraciones de BD
- ✓ Compilación de assets

### Paso 7: Configurar Nginx para SSL

```bash
# Editar configuración Nginx
nano /var/www/sdrimsacbot/docker/nginx/production.conf

# Agregar redireccionamiento a HTTPS y configurar SSL:
```

**Ejemplo de configuración `/docker/nginx/production.conf`:**

```nginx
upstream app {
    server app:9000;
}

server {
    listen 80;
    listen [::]:80;
    server_name sdrimsac.xyz www.sdrimsac.xyz;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sdrimsac.xyz www.sdrimsac.xyz;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/sdrimsac.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sdrimsac.xyz/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/public;
    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass app;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Denegar acceso a archivos sensibles
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache estático
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Paso 8: Reiniciar Nginx y Verificar

```bash
# Reiniciar contenedor Nginx
docker-compose -f docker-compose.production.yml restart nginx

# Ver logs
docker-compose -f docker-compose.production.yml logs -f nginx

# Probar SSL
curl -I https://sdrimsac.xyz
```

### Paso 9: Configurar Auto-renovación de Certificados SSL

```bash
# Crear script de renovación
sudo bash -c 'cat > /etc/letsencrypt/renewal-hooks/post/docker-reload.sh << "EOF"
#!/bin/bash
cd /var/www/sdrimsacbot
docker-compose -f docker-compose.production.yml exec -T nginx nginx -s reload
EOF'

chmod +x /etc/letsencrypt/renewal-hooks/post/docker-reload.sh

# Probar renovación
sudo certbot renew --dry-run

# Configurar cron (ya viene por defecto con certbot)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verificar estado
sudo systemctl status certbot.timer
```

---

## 📊 Monitoreo Post-Deploy

### Verificar Estado de Servicios

```bash
# Ver estado de todos los contenedores
docker-compose -f docker-compose.production.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f

# Ver logs específicos
docker-compose -f docker-compose.production.yml logs -f app
docker-compose -f docker-compose.production.yml logs -f nginx
docker-compose -f docker-compose.production.yml logs -f mysql
```

### Verificar Salud de la Aplicación

```bash
# Acceder a la aplicación
curl -I https://sdrimsac.xyz

# Verificar que Laravel funciona
curl https://sdrimsac.xyz/api/health 2>/dev/null | jq .

# Verificar base de datos
docker-compose -f docker-compose.production.yml exec app php artisan tinker
>>> DB::connection()->getPdo();
>>> quit
```

### Monitorear Recursos

```bash
# Uso de CPU y memoria
docker stats

# Tamaño de volúmenes
docker volume ls
docker volume inspect sdrimsacbot_mysql_data

# Espacio en disco
df -h
du -sh /var/www/sdrimsacbot
```

---

## 🔄 Actualizaciones y Mantenimiento

### Actualizar a Nueva Versión

```bash
cd /var/www/sdrimsacbot

# Traer cambios
git pull origin main

# Reconstruir imagen
docker-compose -f docker-compose.production.yml build --no-cache

# Reiniciar servicios
docker-compose -f docker-compose.production.yml up -d

# Ejecutar migraciones si hay cambios en BD
docker-compose -f docker-compose.production.yml exec app php artisan migrate

# Limpiar caché
docker-compose -f docker-compose.production.yml exec app php artisan cache:clear
docker-compose -f docker-compose.production.yml exec app php artisan config:cache
docker-compose -f docker-compose.production.yml exec app php artisan route:cache
```

### Backup Automático

```bash
# Crear script de backup diario
sudo bash -c 'cat > /usr/local/bin/sdrimsacbot-backup.sh << "EOF"
#!/bin/bash
BACKUP_DIR="/var/backups/sdrimsacbot"
mkdir -p $BACKUP_DIR

# Backup base de datos
docker-compose -f /var/www/sdrimsacbot/docker-compose.production.yml exec -T mysql mysqldump -u sdrimsac -pTu_Contraseña sdrimsacbot | gzip > $BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql.gz

# Mantener solo últimas 7 días
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +7 -delete
EOF'

sudo chmod +x /usr/local/bin/sdrimsacbot-backup.sh

# Agregar a crontab (ejecutar diariamente a las 2 AM)
# sudo crontab -e
# 0 2 * * * /usr/local/bin/sdrimsacbot-backup.sh
```

---

## 🚨 Troubleshooting

### La aplicación no carga

```bash
# Ver logs de la aplicación
docker-compose -f docker-compose.production.yml logs app

# Verificar que PHP-FPM está corriendo
docker-compose -f docker-compose.production.yml exec app ps aux

# Verificar permisos
docker-compose -f docker-compose.production.yml exec app ls -la /var/www/storage
```

### Problemas de base de datos

```bash
# Verificar que MySQL está corriendo
docker-compose -f docker-compose.production.yml logs mysql

# Probar conexión
docker-compose -f docker-compose.production.yml exec app php artisan tinker
>>> DB::connection()->getPdo();

# Resetear base de datos (¡CUIDADO!)
docker-compose -f docker-compose.production.yml exec app php artisan migrate:refresh
```

### Certificado SSL no funciona

```bash
# Verificar estado del certificado
certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Ver logs de certbot
sudo journalctl -u certbot.timer -n 50
```

### WhatsApp/Baileys no responde

```bash
# Verificar contenedor Baileys
docker-compose -f docker-compose.production.yml logs baileys

# Reiniciar Baileys
docker-compose -f docker-compose.production.yml restart baileys

# Verificar conexión Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

---

## 📝 Notas Importantes

1. **Contraseñas**: Nunca commitees `.env.production` con contraseñas reales. Úsalo solo localmente o en el VPS.

2. **Backups**: Realiza backups regulares de la base de datos.

3. **Logs**: Monitorea regularmente los logs de la aplicación para detectar errores.

4. **SSL**: El certificado se renueva automáticamente cada 90 días.

5. **Performance**: Usa `redis` para cache y queue en producción.

6. **Emails**: Configura un servicio SMTP real (SendGrid, Mailtrap, etc.) en lugar de Mailpit.

7. **Seguridad**:
   - Cambia todas las contraseñas por defecto
   - Usa HTTPS siempre
   - Mantén Docker actualizado
   - Configura firewall

---

## 📞 Contacto y Soporte

Para problemas en el VPS, revisa:
- Logs de Docker
- Logs de Laravel en `storage/logs/`
- Logs de Nginx en Docker
- Estados de los contenedores

