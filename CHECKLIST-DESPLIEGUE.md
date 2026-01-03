# ✅ Checklist de Verificación Pre-Despliegue

## 🔍 Antes de Desplegar en Producción

### 📋 Configuración del VPS

- [ ] VPS con Ubuntu 20.04+ y acceso SSH
- [ ] Dominio `sdrimsac.xyz` apuntando a la IP del VPS
- [ ] Docker instalado (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] Certbot instalado para SSL (`certbot --version`)
- [ ] Usuario con privilegios sudo creado
- [ ] Firewall configurado (UFW o iptables)
- [ ] SSH keys configuradas (no contraseñas)

### 📁 Estructura del Proyecto

- [ ] Carpeta `/var/www/sdrimsacbot` creada
- [ ] Repositorio clonado en `/var/www/sdrimsacbot`
- [ ] Rama `main` actualizada
- [ ] Archivo `.env.production` creado y configurado
- [ ] Archivo `.env.production` está en `.gitignore`
- [ ] Archivo `docker-compose.production.yml` existe
- [ ] Archivo `Dockerfile.production` existe
- [ ] Archivo `docker/nginx/production.conf` existe
- [ ] Archivo `docker/mysql/my.cnf` existe

### 🔐 Configuración de Seguridad

- [ ] `APP_KEY` generada en `.env.production`
- [ ] `APP_DEBUG=false` en `.env.production`
- [ ] `APP_ENV=production` en `.env.production`
- [ ] Contraseñas de base de datos generadas y seguras
- [ ] Contraseña de root MySQL generada y segura
- [ ] `SANCTUM_STATEFUL_DOMAINS` configurado correctamente
- [ ] `SESSION_DOMAIN=.sdrimsac.xyz` configurado
- [ ] Dominios permitidos en CORS configurados
- [ ] Permisos de archivos correctos (storage: 755, 777)

### 🌐 Certificados SSL

- [ ] Certificado SSL obtenido con Let's Encrypt
- [ ] Comando: `certbot certonly --standalone -d sdrimsac.xyz -d *.sdrimsac.xyz -d www.sdrimsac.xyz`
- [ ] Certificado verificado: `certbot certificates`
- [ ] Ruta certificado: `/etc/letsencrypt/live/sdrimsac.xyz/`
- [ ] Auto-renovación configurada

### 📦 Dependencias

- [ ] `composer.lock` actualizado
- [ ] `package-lock.json` actualizado
- [ ] Sin cambios locales en `composer.json` o `package.json`
- [ ] `composer install --no-dev` funciona correctamente
- [ ] `npm ci` o `npm install --production` funciona

### 💾 Base de Datos

- [ ] Conexión a BD central configurada en `.env.production`
- [ ] Credenciales de BD son válidas y seguras
- [ ] Puerto 3306 correcto para MySQL
- [ ] Charset UTF8MB4 configurado en `docker/mysql/my.cnf`
- [ ] Replicación binaria configurada si es necesario
- [ ] Backup de BD preexistente realizado (si aplica)

### 📧 Servicios Externos

- [ ] Email (Mailtrap, SendGrid, etc.) configurado
- [ ] `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` correctos
- [ ] `MAIL_FROM_ADDRESS=noreply@sdrimsac.xyz`
- [ ] Prueba de email enviado exitosamente
- [ ] API keys/tokens configurados si hay integraciones

### 🔄 Redis y Cache

- [ ] Redis corriendo en contenedor
- [ ] `CACHE_DRIVER=redis` en `.env.production`
- [ ] `QUEUE_CONNECTION=redis` en `.env.production`
- [ ] `SESSION_DRIVER=cookie` configurado
- [ ] Puerto Redis (6379) no expuesto públicamente

### 🐳 Configuración Docker

- [ ] `docker-compose.production.yml` revisado
- [ ] Todos los servicios están configurados:
  - [ ] `app` (PHP-FPM)
  - [ ] `nginx` (Servidor web)
  - [ ] `mysql` (Base de datos)
  - [ ] `redis` (Cache/Queue)
  - [ ] `scheduler` (Cron)
- [ ] Volúmenes correctamente mapeados
- [ ] Networks correctamente configuradas
- [ ] Límites de recursos definidos (si es necesario)
- [ ] Logs mapeados a `/var/log/nginx/` y `storage/logs/`

### 📝 Logs y Monitoreo

- [ ] Directorio `storage/logs/` es escribible
- [ ] `LOG_CHANNEL=stack` configurado
- [ ] `LOG_LEVEL=notice` en producción
- [ ] Rotación de logs configurada
- [ ] Acceso a logs documentado para soporte

### 🚀 Scripts de Despliegue

- [ ] Script `deploy.sh` revisado y probado
- [ ] Script `backup.sh` revisado y probado
- [ ] Script `restore.sh` revisado y probado
- [ ] Script `monitor.sh` revisado y probado
- [ ] Script `create-tenant.sh` revisado y probado
- [ ] Scripts tienen permisos de ejecución: `chmod +x *.sh`

### ⏰ Tareas Programadas (Cron)

- [ ] Backup diario configurado: `0 2 * * * cd /var/www/sdrimsacbot && bash backup.sh`
- [ ] Monitoreo cada 5 minutos: `*/5 * * * * cd /var/www/sdrimsacbot && bash monitor.sh`
- [ ] Renovación SSL automática configurada
- [ ] Limpieza de logs diaria programada
- [ ] Limpieza de cache programada
- [ ] Crontab verificado: `crontab -l`

### 🧪 Pruebas Previas

- [ ] `docker-compose -f docker-compose.production.yml build` exitoso
- [ ] `docker-compose -f docker-compose.production.yml up -d` sin errores
- [ ] `docker-compose -f docker-compose.production.yml ps` muestra todos los servicios
- [ ] Base de datos central accesible y funcional
- [ ] Migraciones se pueden ejecutar sin errores
- [ ] `php artisan migrate --database=central` exitoso
- [ ] `php artisan config:cache` funciona
- [ ] `php artisan route:cache` funciona
- [ ] `php artisan view:cache` funciona

### 🌐 Pruebas de Conectividad

- [ ] `https://sdrimsac.xyz` carga correctamente
- [ ] `https://www.sdrimsac.xyz` redirige correctamente
- [ ] Certificado SSL válido (navegador no muestra errores)
- [ ] HTTP (`http://sdrimsac.xyz`) redirige a HTTPS
- [ ] Headers de seguridad presentes:
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Content-Type-Options`
  - [ ] `X-Frame-Options`
- [ ] CORS funciona correctamente si hay API
- [ ] Static files cargan rápidamente (minificados)

### 📊 Rendimiento

- [ ] Gzip compression habilitado en Nginx
- [ ] Cache de archivos estáticos configurado (1 año)
- [ ] Database slow query log configurado
- [ ] Índices de BD optimizados
- [ ] Memoria asignada a PHP FPM: 512MB
- [ ] Timeout PHP: 300s
- [ ] Buffer Nginx configurado

### 🔒 Seguridad Adicional

- [ ] `.env.production` no está en el repositorio
- [ ] Archivos sensibles no son públicos (`.env`, `config/`)
- [ ] `public/` es la única carpeta accesible
- [ ] `/vendor`, `/storage` no accesibles directamente
- [ ] HTTPS obligatorio (redireccionamientos en Nginx)
- [ ] CORS configurado solo para dominios permitidos
- [ ] Headers de seguridad completos
- [ ] CSRF protection habilitado
- [ ] Rate limiting considerado si aplica

### 📞 Documentación y Soporte

- [ ] `DEPLOYMENT.md` completado y accesible
- [ ] `COMANDOS-RAPIDOS.md` disponible para equipo
- [ ] `ESTRUCTURA-PRODUCCION.md` documentado
- [ ] Contactos de soporte documentados
- [ ] Procedure de emergencia documentada
- [ ] Logs de acceso al servidor disponibles
- [ ] Plan de rollback documentado

### 🎯 Migraciones y Seeds

- [ ] Todas las migraciones pendientes ejecutadas
- [ ] Seeders ejecutados si es necesario
- [ ] Datos de ejemplo limpios en producción
- [ ] Usuario admin creado y funcionando
- [ ] Credenciales de admin guardadas de forma segura

### 🚨 Checklist Final (30 min antes)

- [ ] Último commit pusheado a `main`
- [ ] Repositorio sin cambios locales sin commit
- [ ] Backup de BD actual realizado
- [ ] Snapshot/backup del VPS realizado
- [ ] Team notificado del despliegue
- [ ] Ventana de mantenimiento planificada si aplica
- [ ] Rollback plan documentado y probado
- [ ] Monitoring activo durante el despliegue

---

## 📋 Checklist de Verificación POST-Despliegue

Una vez desplegado, verificar:

### ✅ Servicios Activos

```bash
docker-compose -f docker-compose.production.yml ps
```

- [ ] Todos los contenedores muestran `Up`
- [ ] No hay contenedores en estado `Exit` o `Error`

### ✅ Base de Datos

```bash
docker-compose -f docker-compose.production.yml exec app \
  php artisan tinker -c "DB::connection('central')->getPdo()"
```

- [ ] Conexión a BD central exitosa
- [ ] Tablas creadas correctamente
- [ ] Datos iniciales presentes si aplica

### ✅ Aplicación Web

```bash
curl -I https://sdrimsac.xyz
```

- [ ] Responde con HTTP 200
- [ ] Headers HTTPS correctos
- [ ] Certificado válido
- [ ] Sin errores de aplicación en logs

### ✅ Logs

```bash
docker-compose -f docker-compose.production.yml logs --tail=100
```

- [ ] Sin errores críticos
- [ ] Sin warnings relacionados con configuración
- [ ] Paths correctos en logs

### ✅ Performance

- [ ] Página carga en menos de 3 segundos
- [ ] Assets (CSS, JS, imágenes) cargan rápido
- [ ] Sin N+1 queries en BD
- [ ] Logs no muestran slow queries

### ✅ Seguridad

```bash
curl -I https://sdrimsac.xyz | grep -i "strict-transport\|x-content\|x-frame"
```

- [ ] Headers de seguridad presentes
- [ ] HTTPS funciona sin advertencias
- [ ] Certificado válido sin errores

### ✅ Backups

```bash
ls -lh /backups/sdrimsacbot/
```

- [ ] Backup automático se ejecutó correctamente
- [ ] Archivos de backup tienen tamaño razonable
- [ ] Fecha de backup es reciente

### 📧 Email

- [ ] Prueba de email enviado exitosamente
- [ ] Email llega sin problemas
- [ ] Formato y contenido correcto

### 🎯 Tenants (si aplica)

```bash
docker-compose -f docker-compose.production.yml exec app \
  php artisan tinker -c "\App\Models\Tenant::all()"
```

- [ ] Tenants creados correctamente si es necesario
- [ ] Dominios asignados correctamente
- [ ] BDs de tenants creadas

### 📊 Monitoreo

- [ ] Scripts de monitoreo ejecutándose correctamente
- [ ] Alertas configuradas y funcionando
- [ ] Disk space monitoreado
- [ ] CPU/Memory dentro de límites

### 🔄 Queue Workers (si aplica)

```bash
docker-compose -f docker-compose.production.yml logs scheduler
```

- [ ] Scheduler ejecutándose
- [ ] Queue workers procesando trabajos
- [ ] Sin trabajos en backlog

---

## 🆘 Rollback Plan

Si algo falla durante el despliegue:

1. **Detener servicios**
   ```bash
   docker-compose -f docker-compose.production.yml down
   ```

2. **Revertir código**
   ```bash
   git reset --hard HEAD~1
   ```

3. **Restaurar base de datos**
   ```bash
   bash restore.sh /backups/sdrimsacbot/central_db_BACKUP_DATE.sql.gz
   ```

4. **Relanzar servicios**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

5. **Verificar estado**
   ```bash
   docker-compose -f docker-compose.production.yml ps
   curl https://sdrimsac.xyz
   ```

---

**Versión**: 1.0  
**Última actualización**: 2026-01-03  
**Autor**: SDRimsac Team
