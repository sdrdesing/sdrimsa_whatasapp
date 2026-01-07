# 🚀 DEPLOY A PRODUCCIÓN - GUÍA ÚNICA

## 📋 PASO 1: VERIFICACIONES LOCALES

```bash
# 1.1 Asegúrate de estar en la rama main
git status

# 1.2 Compilar assets
npm install --legacy-peer-deps
npm run build

# 1.3 Backup de base de datos
bash backup.sh

# 1.4 Commitear cambios
git add .
git commit -m "Preparación para producción"
git push origin main
```

---

## 🖥️ PASO 2: EN EL VPS

### 2.1 Conectarse al VPS
```bash
ssh root@sdrimsac.xyz
```

### 2.2 Preparar directorio
```bash
mkdir -p /var/www/sdrimsacbot
cd /var/www/sdrimsacbot
```

### 2.3 Clonar repositorio
```bash
git clone https://github.com/sdrdesing/sdrimsacbot.git .
git checkout main
```

### 2.4 Generar certificado SSL (SOLO PRIMERA VEZ)
```bash
apt install -y certbot
certbot certonly --standalone \
  -d sdrimsac.xyz \
  -d www.sdrimsac.xyz \
  --email admin@sdrimsac.xyz \
  --agree-tos -n
```

### 2.5 Crear .env.production en el VPS
```bash
cp .env.production .env.production.vps

# Editar con contraseñas seguras
nano .env.production.vps

# Cambiar estos valores:
# DB_PASSWORD=Contraseña_Segura_123
# DB_ROOT_PASSWORD=Root_Contraseña_456
# MAIL_HOST=tu_servidor_smtp.com
# MAIL_USERNAME=tu_email@ejemplo.com
# MAIL_PASSWORD=tu_contraseña
```

### 2.6 Ejecutar deploy (AUTOMÁTICO)
```bash
chmod +x deploy.sh
bash deploy.sh
```

El script hace automáticamente:
- ✅ Pull de Git
- ✅ Build de Docker
- ✅ Levanta contenedores
- ✅ Instala dependencias
- ✅ Compila assets
- ✅ Migraciones de BD
- ✅ Caché de configuración

---

## ✅ VERIFICAR QUE FUNCIONA

```bash
# Ver que todo está corriendo
docker-compose -f docker-compose.production.yml ps

# Prueba rápida
curl -I https://sdrimsac.xyz

# Ver logs
docker-compose -f docker-compose.production.yml logs -f app
```

---

## 🔧 CONFIGURACIÓN CRÍTICA EN .env.production

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sdrimsac.xyz

# Base de datos (CAMBIAR)
DB_HOST=sdrimsacbot-mysql
DB_PASSWORD=GenerarPassword123!
DB_ROOT_PASSWORD=GenerarRootPassword456!

# Cache y Queue (optimizados)
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis

# Email (si usas)
MAIL_MAILER=smtp
MAIL_HOST=tu_servidor_smtp.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@ejemplo.com
MAIL_PASSWORD=tu_contraseña

# WhatsApp
WHATSAPP_NODE_URL=http://baileys:3000
```

### Generar contraseñas seguras:
```bash
openssl rand -base64 32
```

---

## 🆘 PROBLEMAS COMUNES

| Problema | Comando |
|----------|---------|
| La app no carga | `docker-compose logs app` |
| Error de BD | `docker-compose logs mysql` |
| SSL no funciona | `certbot certificates` |
| Reiniciar todo | `docker-compose down && docker-compose up -d` |

---

## 📊 MONITOREO

```bash
# Estado de servicios
docker-compose -f docker-compose.production.yml ps

# Logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f

# Uso de recursos
docker stats

# Espacio en disco
df -h
```

---

## 🔄 ACTUALIZACIONES FUTURAS

```bash
# Local
git commit -m "Cambios"
git push origin main

# En VPS
cd /var/www/sdrimsacbot
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build

# Si hay cambios en BD
docker-compose -f docker-compose.production.yml exec app php artisan migrate
```

---

## ⚡ RESUMEN RÁPIDO

1. **Local**: `npm run build` → `git push`
2. **VPS**: `git clone` → `bash deploy.sh`
3. **Verificar**: `curl -I https://sdrimsac.xyz` ✅

**¡LISTO!**
