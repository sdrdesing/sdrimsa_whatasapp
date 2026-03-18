# Guía de Despliegue en VPS - SDRimsac Bot

## 📋 Requisitos Previos

### En tu máquina local:
- Git instalado
- SSH configurado (clave pública agregada al servidor)

### En el VPS:
- Ubuntu 20.04 LTS o superior
- Docker instalado
- Docker Compose instalado
- Dominio `sdrimsac.site` apuntando al VPS
- Acceso root o usuario con privilegios sudo

---

## 🚀 Instalación en el VPS

### 1. Preparar el Servidor

```bash
# Conectarse al VPS
ssh root@sdrimsac.xyz
# o
ssh user@sdrimsac.zyz

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
bash get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Crear usuario para Docker (opcional pero recomendado)
usermod -aG docker $USER
newgrp docker

# Instalar certbot para SSL
apt install -y certbot python3-certbot-nginx
```

### 2. Preparar Directorios

```bash
# Crear directorio del proyecto
mkdir -p /var/www/sdrimsacbot
cd /var/www/sdrimsacbot

# Crear directorios necesarios
mkdir -p storage/logs
mkdir -p docker/mysql
mkdir -p docker/nginx
mkdir -p docker/supervisor
chmod -R 775 storage bootstrap/cache
```

### 3. Clonar el Repositorio

```bash
# Navegar al directorio
cd /var/www/sdrimsacbot

# Clonar el repositorio
git clone https://github.com/sdrdesing/sdrimsacbot.git .

# Cambiar rama si es necesario
git checkout main
```

### 4. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.production

# Editar configuración
nano .env.production
```

**Valores importantes a configurar:**

```env
APP_KEY=                    # Generar con: php artisan key:generate
APP_URL=https://sdrimsac.xyz

# Base de datos (generar contraseña segura)
DB_PASSWORD=Tu_Contraseña_Segura_Aqui
DB_ROOT_PASSWORD=Root_Contraseña_Segura_Aqui
DB_USERNAME=sdrimsac_user

# Email (usar servicio como Mailtrap, SendGrid, etc.)
MAIL_HOST=smtp.mailtrap.io
MAIL_USERNAME=tu_usuario
MAIL_PASSWORD=tu_contraseña
```

### 5. Crear Archivo de Entorno para Docker

```bash
# Crear archivo .env para Docker Compose
cat > /var/www/sdrimsacbot/.env.docker << 'EOF'
DB_ROOT_PASSWORD=Generar_Contraseña_Segura
DB_USERNAME=sdrimsac_user
DB_PASSWORD=Generar_Contraseña_Segura
EOF

chmod 600 /var/www/sdrimsacbot/.env.docker
```

### 6. Obtener Certificado SSL

```bash
# Detener nginx temporalmente si está corriendo
docker compose -f docker-compose.production.yml down 2>/dev/null || true

# Generar certificado Let's Encrypt
certbot certonly --standalone \
  -d sdrimsac.xyz \
  -d www.sdrimsac.xyz \
  -d *.sdrimsac.xyz \
  --email admin@sdrimsac.xyz \
  --agree-tos \
  -n
```

### 7. Levantar los Contenedores

```bash
cd /var/www/sdrimsacbot

# Construir imagen personalizada
docker compose -f docker-compose.production.yml build

# Iniciar servicios
docker compose -f docker-compose.production.yml up -d

# Ver logs
docker compose -f docker-compose.production.yml logs -f
```

### 8. Ejecutar Migraciones

```bash
# Generar aplicación key
docker compose -f docker-compose.production.yml exec app php artisan key:generate

# Ejecutar migraciones de base de datos central
docker compose -f docker-compose.production.yml exec app php artisan migrate --database=central

# Crear cache de configuración
docker compose -f docker-compose.production.yml exec app php artisan config:cache
docker compose -f docker-compose.production.yml exec app php artisan route:cache
docker compose -f docker-compose.production.yml exec app php artisan view:cache
```

### 9. Configurar Auto-renovación de SSL

```bash
# Crear script de renovación
cat > /etc/letsencrypt/renewal-hooks/post/docker-reload.sh << 'EOF'
#!/bin/bash
cd /var/www/sdrimsacbot
docker compose -f docker-compose.production.yml exec -T nginx nginx -s reload
EOF

chmod +x /etc/letsencrypt/renewal-hooks/post/docker-reload.sh

# Configurar cron para renovación automática
certbot renew --dry-run  # Probar primero
```

---

## 📦 Estructura de Directorios en el VPS

```
/var/www/sdrimsacbot/
├── app/
├── bootstrap/
├── config/
├── database/
├── docker/
│   ├── nginx/
│   │   └── production.conf
│   ├── mysql/
│   │   └── my.cnf
│   └── supervisor/
├── docker-compose.production.yml
├── Dockerfile.production
├── .env.production
├── storage/
│   ├── logs/
│   └── ...
└── ...
```

---

## 🔐 Configuración de Tenants

### Crear Primer Tenant

```bash
# Ejecutar desde dentro del contenedor
docker compose -f docker-compose.production.yml exec app php artisan tinker

# Dentro de tinker:
$tenant = \App\Models\Tenant::create(['id' => 'tu-primer-tenant']);
$tenant->domains()->create(['domain' => 'tenant1.sdrimsac.xyz']);
exit;
```

O crear mediante script artisan si lo tienes:

```bash
docker compose -f docker-compose.production.yml exec app php artisan tenant:create tu-primer-tenant tenant1.sdrimsac.xyz
```

---

## 🛠️ Comandos Útiles

### Gestionar Contenedores

```bash
cd /var/www/sdrimsacbot

# Ver estado de servicios
docker compose -f docker-compose.production.yml ps

# Ver logs
docker compose -f docker-compose.production.yml logs -f app
docker compose -f docker-compose.production.yml logs -f nginx
docker compose -f docker-compose.production.yml logs -f mysql

# Acceder a consola artisan
docker compose -f docker-compose.production.yml exec app php artisan tinker

# Restart de servicios
docker compose -f docker-compose.production.yml restart app
docker compose -f docker-compose.production.yml restart nginx

# Detener servicios
docker compose -f docker-compose.production.yml down
```

### Copias de Seguridad

```bash
# Backup de base de datos
docker compose -f docker-compose.production.yml exec mysql mysqldump \
  -u sdrimsac_user -p sdrimsacbot_central > /backups/db_$(date +%Y%m%d_%H%M%S).sql

# Backup de volúmenes
docker run --rm -v sdrimsacbot_mysql_data:/data \
  -v /backups:/backup \
  alpine tar czf /backup/mysql_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### Monitoreo

```bash
# Ver uso de recursos
docker stats

# Ver eventos
docker events

# Logs del sistema
docker-compose -f docker-compose.production.yml logs --tail=100 -f
```

---

## ⚠️ Consideraciones Importantes

### Seguridad

1. **Variables de Entorno**: Nunca commits `.env.production` al repositorio
2. **SSH Keys**: Usa SSH keys en lugar de contraseñas
3. **Firewall**: Configura iptables o ufw:

```bash
# Permitir puertos esenciales
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

4. **HTTPS**: Siempre usa HTTPS en producción ✓ (configurado)

### Performance

1. **Redis Caching**: Configurado para mejorar rendimiento
2. **Database Optimization**: Ver `docker/mysql/my.cnf`
3. **Queue Workers**: Ejecutados en contenedor separado
4. **Nginx Compression**: GZIP habilitado

### Backup & Restore

```bash
# Crear script de backup diario
cat > /usr/local/bin/sdrimsacbot-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/sdrimsacbot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

cd /var/www/sdrimsacbot

# Backup de DB
docker-compose -f docker-compose.production.yml exec -T mysql \
  mysqldump -u sdrimsac_user -p${DB_PASSWORD} sdrimsacbot_central \
  > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/sdrimsacbot-backup.sh

# Agregar a crontab
crontab -e
# Añadir: 0 2 * * * /usr/local/bin/sdrimsacbot-backup.sh
```

---

## 🐛 Troubleshooting

### Contenedor app no inicia

```bash
# Ver logs
docker-compose -f docker-compose.production.yml logs app

# Problemas comunes:
# - APP_KEY no definida: php artisan key:generate
# - Permisos: chmod -R 775 storage bootstrap/cache
```

### Nginx retorna 502

```bash
# Verificar que app está corriendo
docker-compose -f docker-compose.production.yml ps

# Ver logs de app
docker-compose -f docker-compose.production.yml logs app

# Reiniciar
docker-compose -f docker-compose.production.yml restart app nginx
```

### Base de datos no conecta

```bash
# Verificar credenciales en .env.production
# Verificar que mysql está corriendo
docker-compose -f docker-compose.production.yml ps mysql

# Ver logs mysql
docker-compose -f docker-compose.production.yml logs mysql

# Reiniciar
docker-compose -f docker-compose.production.yml restart mysql
```

### SSL/HTTPS problemas

```bash
# Verificar certificado
certbot certificates

# Renovar manualmente
certbot renew --force-renewal

# Ver logs
docker-compose -f docker-compose.production.yml logs nginx
```

---

## 📞 Soporte

Para problemas específicos:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica la configuración en `.env.production`
3. Consulta la documentación oficial de Laravel y Spatie Tenancy

---

## 📅 Mantenimiento Regular

### Diariamente
- Monitorear logs
- Verificar estado de servicios

### Semanalmente
- Revisar copias de seguridad
- Actualizar paquetes de seguridad: `apt update && apt upgrade`

### Mensualmente
- Limpiar logs antiguos
- Revisar uso de disco
- Actualizar dependencias de PHP

```bash
# Limpiar logs antiguos
docker-compose -f docker-compose.production.yml exec app php artisan cache:clear
docker-compose -f docker-compose.production.yml exec app php artisan view:clear
```

---

**Última actualización**: 2026-01-03
**Versión**: 1.0
