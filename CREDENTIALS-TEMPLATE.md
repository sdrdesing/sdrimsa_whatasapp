# 🔐 CREDENCIALES Y CONTRASEÑAS - TEMPLATE

**⚠️ IMPORTANTE: Este archivo es solo una plantilla. Guarda las contraseñas reales en:**
- Password Manager (1Password, Bitwarden, LastPass, etc.)
- Un archivo encriptado
- NO en el repositorio Git

---

## Base de Datos

### MySQL Root
```
Host: sdrimsacbot-mysql (en Docker) / localhost (local)
User: root
Password: [GENERAR PASSWORD SEGURO]
Puerto: 3306
```

### MySQL Aplicación
```
Host: sdrimsacbot-mysql (en Docker) / localhost (local)
User: sdrimsac
Password: [GENERAR PASSWORD SEGURO]
Database: sdrimsacbot
Puerto: 3306
```

---

## Redis

```
Host: sdrimsacbot-redis (en Docker) / localhost (local)
Puerto: 6379
Password: [SI APLICA]
```

---

## Email / SMTP

```
Proveedor: [Mailtrap, SendGrid, Gmail, etc.]
MAIL_HOST: [smtp.ejemplo.com]
MAIL_PORT: [587 o 465]
MAIL_USERNAME: [tu_email@ejemplo.com]
MAIL_PASSWORD: [app_password_o_contraseña]
MAIL_ENCRYPTION: [tls o ssl]
MAIL_FROM_ADDRESS: [noreply@sdrimsac.xyz]
```

---

## AWS S3 (si se usa para uploads)

```
AWS_ACCESS_KEY_ID: [TU_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY: [TU_SECRET_KEY]
AWS_DEFAULT_REGION: [us-east-1]
AWS_BUCKET: [sdrimsacbot-uploads]
```

---

## Pusher / Broadcasting (si se usa)

```
PUSHER_APP_ID: [APP_ID]
PUSHER_APP_KEY: [APP_KEY]
PUSHER_APP_SECRET: [APP_SECRET]
PUSHER_HOST: [api-host.pusher.com]
PUSHER_PORT: [443]
PUSHER_CLUSTER: [mt1]
```

---

## WhatsApp / Baileys

```
WHATSAPP_NODE_URL: http://baileys:3000
```

---

## SSL Certificate

```
Domain: sdrimsac.xyz
Proveedor: Let's Encrypt (Certbot)
Ruta en VPS: /etc/letsencrypt/live/sdrimsac.xyz/
Renovación: Automática cada 90 días
```

---

## VPS Access

```
Dominio: sdrimsac.xyz
IP: [TU_IP_VPS]
Usuario SSH: root o [tu_usuario]
SSH Key: ~/.ssh/id_rsa (o tu ruta de clave privada)
Puerto SSH: 22 (o el que configuraste)
```

---

## Git Repository

```
Repositorio: https://github.com/sdrdesing/sdrimsacbot.git
Rama Principal: main
Deploy Branch: main
```

---

## Checklist de Contraseñas a Generar

- [ ] DB_PASSWORD (MySQL Aplicación)
- [ ] DB_ROOT_PASSWORD (MySQL Root)
- [ ] MAIL_PASSWORD (SMTP)
- [ ] AWS_SECRET_ACCESS_KEY (si aplica)
- [ ] PUSHER_APP_SECRET (si aplica)
- [ ] Redis PASSWORD (si lo configuras)

---

## Generador de Contraseñas Seguras

```bash
# En Linux/Mac, generar contraseña de 32 caracteres
openssl rand -base64 32

# O usar Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Ejemplo de salida:
# 7X9k2m3Lp9jQ4wR5tY2bV8cN6dF1gH4i
```

---

## Configuración en .env.production

Una vez tengas todas las contraseñas, actualiza `.env.production`:

```env
DB_PASSWORD=Tu_Password_Generada
DB_ROOT_PASSWORD=Root_Password_Generada
MAIL_PASSWORD=Tu_SMTP_Password
AWS_SECRET_ACCESS_KEY=Tu_AWS_Secret
```

---

## Seguridad

✓ Nunca commits `.env.production` con contraseñas reales
✓ Usa un `.gitignore` que excluya archivos sensibles
✓ Almacena credenciales en un Password Manager
✓ Rota contraseñas regularmente (cada 6 meses)
✓ Usa contraseñas únicas para cada servicio
✓ Habilita 2FA donde sea posible

