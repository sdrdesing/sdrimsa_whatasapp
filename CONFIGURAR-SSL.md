# Configurar SSL con Let's Encrypt

## Cuando el sitio esté en producción

Una vez que tengas tu dominio apuntando correctamente al servidor, sigue estos pasos:

### 1. Instalar Certbot en el servidor

```bash
apt-get update
apt-get install certbot python3-certbot-nginx -y
```

### 2. Generar certificados para tu dominio

```bash
certbot certonly --standalone -d sdrimsac.xyz -d www.sdrimsac.xyz -d *.sdrimsac.xyz
```

Los certificados se guardarán en: `/etc/letsencrypt/live/sdrimsac.xyz/`

### 3. Descomentar la configuración HTTPS en Nginx

Edita `docker/nginx/production.conf` y descomenta el bloque:

```nginx
# HTTPS Configuration (descomentar cuando tengas certificados de Let's Encrypt)
# server {
#     listen 443 ssl http2;
#     ...
# }
```

### 4. Descomentar el mount en docker-compose

Edita `docker-compose.production.yml` y descomenta:

```yaml
# - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 5. Recargar Nginx

```bash
docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

### 6. Renovación automática

Los certificados de Let's Encrypt expiran cada 90 días. Crea un cron job:

```bash
crontab -e
```

Agrega:

```
0 3 * * * certbot renew --quiet && docker compose -f /var/www/sdrimsacbot/docker-compose.production.yml exec nginx nginx -s reload
```

## Estado actual

- ✅ HTTP configurado (puerto 8080)
- ⏳ HTTPS deshabilitado (esperando certificados reales)

No hay certificados self-signed porque se renuevan constantemente en desarrollo. Espera a tener Let's Encrypt configurado en producción.
