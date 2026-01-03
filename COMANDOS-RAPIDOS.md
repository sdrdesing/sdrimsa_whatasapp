# 📚 Guía Rápida de Comandos - SDRimsac Bot en VPS

## 🔌 Conectar al VPS

```bash
ssh root@sdrimsac.xyz
# o si tienes usuario específico:
ssh usuario@sdrimsac.xyz

# Cambiar a directorio del proyecto
cd /var/www/sdrimsacbot
```

---

## 🚀 Operaciones Básicas

### Iniciar servicios

```bash
docker-compose -f docker-compose.production.yml up -d
```

### Detener servicios

```bash
docker-compose -f docker-compose.production.yml down
```

### Reiniciar servicios

```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml restart

# Servicio específico
docker-compose -f docker-compose.production.yml restart app
docker-compose -f docker-compose.production.yml restart nginx
docker-compose -f docker-compose.production.yml restart mysql
docker-compose -f docker-compose.production.yml restart redis
```

### Ver estado de servicios

```bash
docker-compose -f docker-compose.production.yml ps
```

---

## 📝 Logs

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml logs -f

# Servicio específico
docker-compose -f docker-compose.production.yml logs -f app
docker-compose -f docker-compose.production.yml logs -f nginx
docker-compose -f docker-compose.production.yml logs -f mysql

# Últimas 50 líneas
docker-compose -f docker-compose.production.yml logs --tail=50 app

# Últimas 100 líneas de error
docker-compose -f docker-compose.production.yml logs --tail=100 app | grep -i error
```

---

## 💾 Base de Datos

### Acceder a consola MySQL

```bash
docker-compose -f docker-compose.production.yml exec mysql mysql -u sdrimsac_user -p sdrimsacbot_central
# Ingresa la contraseña cuando se pida
```

### Ejecutar migraciones

```bash
# Base de datos central
docker-compose -f docker-compose.production.yml exec app php artisan migrate --database=central

# Todos los tenants
docker-compose -f docker-compose.production.yml exec app php artisan migrate --tenants
```

### Hacer backup de BD

```bash
docker-compose -f docker-compose.production.yml exec mysql mysqldump \
  -u sdrimsac_user -p sdrimsacbot_central > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🎯 Artisan Comandos

### Acceder a Tinker (consola interactiva)

```bash
docker-compose -f docker-compose.production.yml exec app php artisan tinker
```

### Limpiar caché

```bash
# Limpiar todo
docker-compose -f docker-compose.production.yml exec app php artisan cache:clear
docker-compose -f docker-compose.production.yml exec app php artisan view:clear
docker-compose -f docker-compose.production.yml exec app php artisan route:clear
docker-compose -f docker-compose.production.yml exec app php artisan config:clear

# Cachear para producción
docker-compose -f docker-compose.production.yml exec app php artisan config:cache
docker-compose -f docker-compose.production.yml exec app php artisan route:cache
docker-compose -f docker-compose.production.yml exec app php artisan view:cache
```

### Listar rutas

```bash
docker-compose -f docker-compose.production.yml exec app php artisan route:list
```

### Ver variables de entorno

```bash
docker-compose -f docker-compose.production.yml exec app php artisan config:show app
```

---

## 👥 Gestión de Tenants

### Crear nuevo tenant

```bash
# Opción 1: Usando script
bash create-tenant.sh cliente1 cliente1.sdrimsac.xyz

# Opción 2: Manualmente con Tinker
docker-compose -f docker-compose.production.yml exec app php artisan tinker
# Dentro de Tinker:
$t = \App\Models\Tenant::create(['id' => 'cliente1']);
$t->domains()->create(['domain' => 'cliente1.sdrimsac.xyz']);
exit;
```

### Listar tenants

```bash
docker-compose -f docker-compose.production.yml exec app php artisan tinker
# Dentro de Tinker:
\App\Models\Tenant::all()->toArray();
exit;
```

### Ejecutar comando para tenant específico

```bash
docker-compose -f docker-compose.production.yml exec app php artisan migrate --tenants=cliente1
```

### Eliminar tenant

```bash
docker-compose -f docker-compose.production.yml exec app php artisan tinker
# Dentro de Tinker:
$t = \App\Models\Tenant::find('cliente1');
$t->delete(); // Esto eliminará el tenant y su BD
exit;
```

---

## 🔐 SSL/HTTPS

### Ver certificados disponibles

```bash
certbot certificates
```

### Renovar certificado manualmente

```bash
certbot renew --force-renewal --dry-run  # Prueba primero
certbot renew --force-renewal             # Real
```

### Agregar nuevo dominio a certificado

```bash
certbot certonly --webroot \
  -w /var/www/sdrimsacbot/public \
  -d nuevodominio.sdrimsac.xyz
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
# Estadísticas en tiempo real
docker stats

# Solo memoria y CPU de app
docker stats sdrimsacbot-app
```

### Espacio en disco

```bash
df -h                                    # Sistema de archivos
du -sh /var/www/sdrimsacbot/*           # Directorio del proyecto
du -sh /var/lib/docker/volumes/*        # Volúmenes Docker
```

### Procesos PHP

```bash
docker-compose -f docker-compose.production.yml exec app ps aux | grep php
```

---

## 🔄 Despliegues y Actualizaciones

### Desplegar nuevos cambios

```bash
cd /var/www/sdrimsacbot
bash deploy.sh
```

### Actualizar solo código (sin rebuildar Docker)

```bash
cd /var/www/sdrimsacbot
git pull origin main
docker-compose -f docker-compose.production.yml exec app composer install --no-dev --optimize-autoloader
docker-compose -f docker-compose.production.yml exec app php artisan migrate
docker-compose -f docker-compose.production.yml exec app php artisan cache:clear
```

### Rebuildar imagen Docker

```bash
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml restart app
```

---

## 💾 Backups y Restauración

### Crear backup

```bash
bash backup.sh
```

### Listar backups

```bash
ls -lh /backups/sdrimsacbot/
```

### Restaurar desde backup

```bash
bash restore.sh /backups/sdrimsacbot/central_db_20260103_120000.sql.gz
```

---

## 🧹 Mantenimiento

### Limpiar logs antiguos

```bash
# Logs del sistema
docker-compose -f docker-compose.production.yml exec app php artisan logs:clear

# Logs de nginx
docker-compose -f docker-compose.production.yml exec nginx sh -c "rm -f /var/log/nginx/*old*"
```

### Limpiar espacio sin usar (CUIDADO)

```bash
# Imágenes sin usar
docker image prune

# Contenedores sin usar
docker container prune

# Volúmenes sin usar
docker volume prune

# Todo lo anterior
docker system prune
```

### Ver versiones de servicios

```bash
docker-compose -f docker-compose.production.yml exec app php -v
docker-compose -f docker-compose.production.yml exec app php artisan --version
docker-compose -f docker-compose.production.yml exec mysql mysql --version
```

---

## 🐛 Troubleshooting Rápido

### El sitio no carga

```bash
# 1. Verificar servicios están corriendo
docker-compose -f docker-compose.production.yml ps

# 2. Ver logs
docker-compose -f docker-compose.production.yml logs app | tail -50

# 3. Reiniciar
docker-compose -f docker-compose.production.yml restart app nginx
```

### Error 502 Bad Gateway

```bash
# Significa que Nginx no puede conectar a PHP
docker-compose -f docker-compose.production.yml logs app
docker-compose -f docker-compose.production.yml restart app
```

### Error de base de datos

```bash
# Verificar MySQL está corriendo
docker-compose -f docker-compose.production.yml logs mysql

# Reiniciar MySQL
docker-compose -f docker-compose.production.yml restart mysql

# Verificar conexión
docker-compose -f docker-compose.production.yml exec app \
  php artisan tinker -c "DB::connection()->getPdo()"
```

### Problema de permisos

```bash
# Arreglar permisos de almacenamiento
docker-compose -f docker-compose.production.yml exec app \
  chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

docker-compose -f docker-compose.production.yml exec app \
  chmod -R 775 /var/www/storage /var/www/bootstrap/cache
```

### Cola de trabajos sin procesar

```bash
# Ver cola
docker-compose -f docker-compose.production.yml exec app php artisan queue:failed

# Procesar queue
docker-compose -f docker-compose.production.yml exec app php artisan queue:work redis --timeout=0
```

---

## 📱 Accesos Útiles

| Descripción | URL/Comando |
|---|---|
| Sitio principal | https://sdrimsac.xyz |
| Admin (si aplica) | https://admin.sdrimsac.xyz |
| API | https://api.sdrimsac.xyz |
| Ver logs en vivo | `docker-compose -f docker-compose.production.yml logs -f` |
| Consola PHP | `docker-compose -f docker-compose.production.yml exec app php artisan tinker` |
| Base de datos | `mysql -h localhost -u sdrimsac_user -p sdrimsacbot_central` |

---

## ⚙️ Archivos Importantes

```
/var/www/sdrimsacbot/
├── .env.production          ← Variables de entorno (NO VERSIONAR)
├── docker-compose.production.yml
├── docker-compose.production.yml
├── storage/logs/            ← Logs de Laravel
├── docker/nginx/production.conf
├── docker/mysql/my.cnf
└── storage/logs/laravel.log ← Log principal
```

---

## 🔗 Links Rápidos

- **Documentación Laravel**: https://laravel.com/docs
- **Documentación Spatie Tenancy**: https://spatie.be/docs/laravel-tenancy
- **Docker Docs**: https://docs.docker.com
- **Nginx Docs**: https://nginx.org/en/docs/

---

**Última actualización**: 2026-01-03
**Versión**: 1.0
