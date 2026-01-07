# 🚀 INSTRUCCIONES RÁPIDAS: DEPLOY A PRODUCCIÓN

## En Local (Tu Máquina)

### Paso 1: Ejecutar Checklist
```bash
bash pre-deploy-checklist.sh
```
Asegúrate de que todo está ✓ (verde)

### Paso 2: Compilar Assets
```bash
npm install --legacy-peer-deps
npm run build
```

### Paso 3: Hacer Backup
```bash
bash backup.sh
# O manualmente:
docker-compose exec mysql mysqldump -u sdrimsac -p sdrimsacbot > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Paso 4: Commitear y Pushear
```bash
git add .
git commit -m "Preparación para producción"
git push origin main
```

---

## En el VPS

### Paso 1: Conectarse
```bash
ssh root@sdrimsac.xyz
cd /var/www/sdrimsacbot
```

### Paso 2: Ejecutar Deploy
```bash
bash deploy.sh
```

El script hará **automáticamente**:
- ✓ Pull de cambios de Git
- ✓ Construcción de imágenes Docker
- ✓ Levantamiento de contenedores
- ✓ Instalación de dependencias (Composer + NPM)
- ✓ Compilación de assets (Vite)
- ✓ Generación de APP_KEY
- ✓ Ejecución de migraciones
- ✓ Cache de configuración

### Paso 3: Verificar Estado
```bash
# Ver que todo está corriendo
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f

# Prueba rápida
curl -I https://sdrimsac.xyz
```

---

## 🔒 Primer Deploy - Configuración SSL

Si es **PRIMERA VEZ** en el VPS, generar certificado SSL:

```bash
# 1. Conectarse al VPS
ssh root@sdrimsac.xyz

# 2. Instalar certbot
apt update && apt install -y certbot python3-certbot-nginx

# 3. Generar certificado
certbot certonly --standalone \
  -d sdrimsac.xyz \
  -d www.sdrimsac.xyz \
  --email admin@sdrimsac.xyz \
  --agree-tos \
  -n

# 4. Verificar que se creó
ls -la /etc/letsencrypt/live/sdrimsac.xyz/
```

---

## 🔄 Actualizaciones Posteriores

Cuando haya cambios nuevos:

```bash
# Local:
git commit -m "Cambios..."
git push origin main

# En VPS:
cd /var/www/sdrimsacbot
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build

# Si hay cambios en BD:
docker-compose -f docker-compose.production.yml exec app php artisan migrate
```

---

## 📊 Monitoreo Rápido

```bash
# Estado de contenedores
docker-compose -f docker-compose.production.yml ps

# Logs de la app
docker-compose -f docker-compose.production.yml logs app

# Uso de recursos
docker stats

# Espacio en disco
df -h
```

---

## 🆘 Si Algo Falla

### La app no carga
```bash
docker-compose -f docker-compose.production.yml logs app | tail -50
```

### Error de base de datos
```bash
docker-compose -f docker-compose.production.yml logs mysql
docker-compose -f docker-compose.production.yml exec app php artisan tinker
# >>> DB::connection()->getPdo();
# >>> quit
```

### SSL no funciona
```bash
certbot certificates
certbot renew --force-renewal
```

### Reiniciar todo
```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

---

## 🎯 Checklist Final

- [ ] Corriste `pre-deploy-checklist.sh` localmente ✓
- [ ] Compilaste assets (`npm run build`) ✓
- [ ] Hiciste backup de la BD ✓
- [ ] Pusheaste cambios a `main` ✓
- [ ] Ejecutaste `bash deploy.sh` en el VPS ✓
- [ ] Verificaste que la app carga (`https://sdrimsac.xyz`) ✓
- [ ] Certificado SSL funciona ✓
- [ ] Emails se envían correctamente ✓
- [ ] WhatsApp/Baileys funciona ✓

---

**¡Listo para producción! 🎉**
