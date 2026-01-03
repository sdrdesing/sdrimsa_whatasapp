# 📁 Estructura del Proyecto en Producción

## Árbol de Directorios del VPS

```
/var/www/sdrimsacbot/
├── app/                              # Código de la aplicación
│   ├── Console/
│   ├── Exceptions/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Kernel.php
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   │   ├── Tenant.php
│   │   ├── User.php
│   │   └── tenant/
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   ├── AuthServiceProvider.php
│   │   ├── BroadcastServiceProvider.php
│   │   ├── EventServiceProvider.php
│   │   ├── RouteServiceProvider.php
│   │   └── TenancyServiceProvider.php
│   └── View/
│
├── bootstrap/
│   └── cache/                       # Cache de la aplicación (debe ser escribible)
│
├── config/                          # Archivos de configuración
│   ├── tenancy.php                  # ⭐ CRÍTICO para multi-tenancy
│   ├── database.php                 # Conexiones de BD
│   ├── cache.php                    # Cache config
│   ├── auth.php                     # Autenticación
│   └── ...
│
├── database/
│   ├── factories/
│   ├── migrations/
│   │   └── tenant/                  # Migraciones específicas de tenants
│   └── seeders/
│       └── tenant/
│
├── docker/                          # Configuración Docker para producción
│   ├── nginx/
│   │   ├── production.conf          # ⭐ Configuración Nginx HTTPS
│   │   └── nginx-standalone.conf    # Alternativa Nginx sin Docker
│   ├── mysql/
│   │   └── my.cnf                   # Optimización MySQL
│   └── supervisor/
│       └── laravel-worker.conf      # Workers de cola
│
├── modules/                         # Módulos personalizados
│   └── whatsapp/
│
├── public/                          # Archivos públicos (raíz web)
│   ├── index.php                    # Entry point
│   ├── .htaccess
│   ├── images/
│   ├── logos/
│   └── build/                       # Assets compilados (Vite)
│
├── resources/
│   ├── css/                         # Estilos (Tailwind)
│   ├── js/                          # JavaScript
│   └── views/                       # Vistas Blade
│
├── routes/
│   ├── api.php                      # Rutas API
│   ├── auth.php                     # Rutas autenticación
│   ├── tenant.php                   # ⭐ Rutas de tenants
│   ├── tenant-auth.php              # Auth de tenants
│   ├── web.php                      # Rutas web
│   └── console.php
│
├── storage/                         # ⭐ Debe ser escribible (777)
│   ├── app/                         # Almacenamiento de aplicación
│   ├── framework/
│   │   ├── cache/
│   │   ├── sessions/
│   │   └── views/
│   ├── logs/                        # Logs de la aplicación
│   │   └── laravel.log
│   └── uploads/                     # Cargas de usuarios (si aplica)
│
├── tests/
│   ├── Feature/
│   └── Unit/
│
├── vendor/                          # Dependencias Composer (no versionar)
│
├── node_modules/                    # Dependencias npm (no versionar)
│
├── .git/                            # Control de versiones
│
├── .gitignore                       # Archivos ignorados por git
├── .env.production                  # ⭐ Variables de entorno (NO versionar)
├── .env.example                     # Template de variables
├── .editorconfig
│
├── artisan                          # CLI de Laravel
├── composer.json                    # Dependencias PHP
├── composer.lock                    # Lock file de Composer
├── package.json                     # Dependencias Node
├── package-lock.json                # Lock file de npm
│
├── docker-compose.production.yml    # ⭐ Docker Compose para producción
├── Dockerfile.production            # ⭐ Imagen Docker para producción
├── jsconfig.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
│
├── phpunit.xml                      # Configuración tests
├── README.md
│
├── deploy.sh                        # ⭐ Script de despliegue
├── backup.sh                        # ⭐ Script de backup
├── restore.sh                       # ⭐ Script de restauración
├── monitor.sh                       # ⭐ Script de monitoreo
├── create-tenant.sh                 # ⭐ Script crear tenant
│
├── DEPLOYMENT.md                    # ⭐ Guía completa despliegue
├── COMANDOS-RAPIDOS.md              # ⭐ Referencia rápida
└── crontab-setup.txt                # ⭐ Tareas programadas
```

---

## 🐳 Estructura Docker

### Contenedores que corren

```
sdrimsacbot-app (PHP 8.2-FPM)
├── Puerto: 9000 (interno)
├── Volumen: /var/www
├── Conexión BD: mysql:3306
└── Cache: redis:6379

sdrimsacbot-nginx (Nginx Alpine)
├── Puerto: 80 (HTTP)
├── Puerto: 443 (HTTPS)
├── Volumen: /var/www (lectura)
└── SSL: /etc/letsencrypt

sdrimsacbot-mysql (MariaDB 10.6)
├── Puerto: 3306 (solo interno)
├── BD Central: sdrimsacbot_central
├── BD Tenants: tenant_{tenant_id}
└── Volumen: mysql_data

sdrimsacbot-redis (Redis Alpine)
├── Puerto: 6379 (solo interno)
├── Uso: Cache, Queue, Sessions
└── Volumen: redis_data

sdrimsacbot-scheduler (PHP 8.2-FPM)
├── Cron: php artisan schedule:work
└── Ejecución: Tiempo real
```

---

## 📊 Volúmenes de Datos

### Volúmenes Docker

```bash
# Verificar volúmenes
docker volume ls

# Detalles de un volumen
docker volume inspect sdrimsacbot_mysql_data
docker volume inspect sdrimsacbot_redis_data
```

### Punto de montaje en host

```
/var/www/sdrimsacbot/     ← Código del proyecto
├── storage/              ← Datos persisten aquí
└── bootstrap/cache/      ← Cache local

/etc/letsencrypt/live/sdrimsac.xyz/
├── privkey.pem
├── fullchain.pem
└── chain.pem
```

---

## 🔐 Permisos de Directorios

```bash
# Directorios que deben ser escribibles (www-data:www-data)
/var/www/sdrimsacbot/storage/       (755)
/var/www/sdrimsacbot/bootstrap/cache/ (755)
/var/www/sdrimsacbot/public/uploads/ (755 si aplica)

# El propietario debe ser www-data
chown -R www-data:www-data /var/www/sdrimsacbot/storage
chown -R www-data:www-data /var/www/sdrimsacbot/bootstrap/cache

# Permisos
chmod -R 755 /var/www/sdrimsacbot/storage
chmod -R 755 /var/www/sdrimsacbot/bootstrap/cache
```

---

## 📂 Directorios Temporales

### Logs

```
/var/www/sdrimsacbot/storage/logs/
├── laravel.log              # Log principal de Laravel
└── {laravel-YYYY-MM-DD}.log # Logs diarios (si está configurado)

# También:
/var/log/nginx/
├── sdrimsac.xyz_access.log
└── sdrimsac.xyz_error.log
```

### Cache y Sesiones (en Redis)

```
Redis:6379
├── laravel_cache:          # Cache general
├── laravel_session:        # Sesiones
└── laravel_queue:          # Cola de trabajos
```

### Backups

```
/backups/sdrimsacbot/
├── central_db_20260103_120000.sql.gz
├── mysql_volume_20260103_120000.tar.gz
└── [mantiene últimos 7 días]
```

---

## 🌐 Dominios y Tenants

### Estructura de Dominios

```
sdrimsac.xyz                    # Dominio principal (central)
├── Aplicación central
└── Gestión de tenants

cliente1.sdrimsac.xyz           # Primer tenant
├── BD: tenant_cliente1
└── Archivos: storage/tenant_cliente1

cliente2.sdrimsac.xyz           # Segundo tenant
├── BD: tenant_cliente2
└── Archivos: storage/tenant_cliente2

subdomain.sdrimsac.xyz          # N-ésimo tenant
├── BD: tenant_subdomain
└── Archivos: storage/tenant_subdomain
```

### Base de Datos

```
MySQL
├── sdrimsacbot_central         # ⭐ Base de datos central
│   ├── users
│   ├── tenants
│   ├── domains
│   └── [tablas centrales]
│
├── tenant_cliente1             # ⭐ BD del tenant 1
│   ├── users
│   ├── posts
│   └── [tablas del tenant]
│
├── tenant_cliente2             # ⭐ BD del tenant 2
│   ├── users
│   ├── posts
│   └── [tablas del tenant]
│
└── tenant_subdomain            # ⭐ BD del tenant N
    ├── users
    ├── posts
    └── [tablas del tenant]
```

---

## 🔧 Configuración Crítica

### Archivos que DEBEN existir en producción

```
✅ .env.production          # Variables de entorno
✅ docker-compose.production.yml  # Docker compose
✅ Dockerfile.production    # Imagen Docker
✅ docker/nginx/production.conf   # Nginx config
✅ docker/mysql/my.cnf      # MySQL optimizado
✅ storage/logs/            # Directorio logs (escribible)
✅ bootstrap/cache/         # Cache (escribible)
✅ /etc/letsencrypt/        # Certificados SSL
```

### Archivos que NO deben estar en producción

```
❌ .env (usar .env.production)
❌ .env.local
❌ .git/ (no es necesario, pero puedes tenerlo)
❌ node_modules/ (compilar assets en build)
❌ .env.example (no es secreto, puedes tenerlo)
```

---

## 🚀 Flujo de Despliegue

```
1. Git Pull (últimos cambios)
   └── docker-compose build

2. Construir Imagen Docker
   └── docker-compose up -d

3. Migraciones
   ├── php artisan migrate --database=central
   └── php artisan migrate --tenants

4. Cachear Configuración
   ├── php artisan config:cache
   ├── php artisan route:cache
   └── php artisan view:cache

5. Permisos y Ownership
   └── chown -R www-data:www-data storage/

6. Verificación
   ├── Health Check
   └── Test conexiones
```

---

## 📈 Escalabilidad Futura

### Para crecer a múltiples servidores

```
                    Load Balancer (Nginx)
                            |
        ____________________|____________________
        |                   |                   |
    Servidor 1          Servidor 2          Servidor 3
    (App + Nginx)       (App + Nginx)       (App + Nginx)
        |                   |                   |
        └───────────────────┼───────────────────┘
                            |
                    Servidor BD Central
                   (MySQL con replicación)
                            |
                    Servidor Redis Central
                   (Sessions compartidas)
                            |
                    NFS/S3 Compartido
                   (Almacenamiento)
```

---

## 📞 Diagnóstico Rápido

```bash
# Estructura actual
tree -L 2 /var/www/sdrimsacbot/

# Espacio usado
du -sh /var/www/sdrimsacbot/*

# Permisos
ls -la /var/www/sdrimsacbot/storage/
ls -la /var/www/sdrimsacbot/bootstrap/

# Propietario
ls -la /var/www/ | grep sdrimsacbot

# Volúmenes
docker volume ls | grep sdrimsacbot

# Contenedores
docker ps | grep sdrimsacbot
```

---

**Última actualización**: 2026-01-03
**Versión**: 1.0
