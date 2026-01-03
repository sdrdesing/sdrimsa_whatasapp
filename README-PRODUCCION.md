# 🤖 SDRimsac Bot - Laravel Multi-Tenant SaaS

Aplicación **Laravel 11** con arquitectura **multi-tenant** usando **Spatie Tenancy**, preparada para despliegue en producción con **Docker** y **Nginx**.

---

## 🎯 Características

✅ **Multi-tenancy** - Sistema de múltiples tenants con bases de datos aisladas  
✅ **Laravel 11** - Framework moderno y poderoso  
✅ **Spatie Tenancy** - Librería profesional para multi-tenancy  
✅ **Docker** - Containerización completa (PHP, Nginx, MySQL, Redis)  
✅ **HTTPS/SSL** - Let's Encrypt con auto-renovación  
✅ **Redis** - Cache y cola de trabajos  
✅ **Tailwind CSS** - Styling moderno  
✅ **Vite** - Build tool rápido  
✅ **API RESTful** - Sanctum para autenticación  
✅ **Scheduled Tasks** - Cron jobs con scheduler  
✅ **Queue Workers** - Procesamiento asíncrono  
✅ **Backups** - Automatizados diariamente  

---

## 📋 Requisitos

### Local (Desarrollo)

- PHP 8.2+
- Composer
- Node.js 20+
- npm o yarn
- Docker (opcional, para simular producción)

### VPS (Producción)

- Ubuntu 20.04 LTS o superior
- Docker
- Docker Compose
- Certbot (para SSL)
- Mínimo 2GB RAM, 1 vCPU
- 20GB almacenamiento libre

---

## 🚀 Instalación Local (Desarrollo)

### 1. Clonar el repositorio

```bash
git clone https://github.com/sdrdesing/sdrimsacbot.git
cd sdrimsacbot
```

### 2. Instalar dependencias

```bash
# PHP
composer install

# Node
npm install
```

### 3. Configurar ambiente

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Generar clave de aplicación
php artisan key:generate

# Configurar base de datos en .env
DB_DATABASE=sdrimsacbot_dev
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Base de datos

```bash
# Ejecutar migraciones
php artisan migrate

# (Opcional) Ejecutar seeders
php artisan db:seed
```

### 5. Compilar assets

```bash
npm run dev
# o para producción:
npm run build
```

### 6. Iniciar servidor

```bash
php artisan serve
```

Acceso: `http://localhost:8000`

---

## 🐳 Despliegue en VPS

Para una guía **completa y detallada** de despliegue en producción, consulta:

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía paso a paso de despliegue en VPS

### Resumen Rápido

```bash
# En el VPS
cd /var/www/sdrimsacbot

# 1. Preparar servidor (Docker, SSL, etc.)
# Ver DEPLOYMENT.md

# 2. Desplegar aplicación
bash deploy.sh

# 3. Crear primer tenant
bash create-tenant.sh cliente1 cliente1.sdrimsac.xyz

# Acceso: https://sdrimsac.xyz
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|------------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Guía completa de despliegue paso a paso |
| **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)** | Referencia rápida de comandos útiles |
| **[ESTRUCTURA-PRODUCCION.md](./ESTRUCTURA-PRODUCCION.md)** | Estructura de directorios y arquitectura |
| **[CHECKLIST-DESPLIEGUE.md](./CHECKLIST-DESPLIEGUE.md)** | Checklist pre y post-despliegue |

---

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Servidor de desarrollo
php artisan serve

# Compilar assets en tiempo real
npm run dev

# Consola interactiva PHP
php artisan tinker

# Ver rutas disponibles
php artisan route:list

# Migraciones
php artisan migrate
php artisan migrate:rollback
```

### Producción (VPS)

```bash
# Ver estado de servicios
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f app

# Ejecutar comandos artisan
docker-compose -f docker-compose.production.yml exec app php artisan tinker

# Backup
bash backup.sh

# Restaurar backup
bash restore.sh /backups/sdrimsacbot/db_backup.sql.gz

# Crear tenant
bash create-tenant.sh nombreTenant dominio.sdrimsac.xyz
```

Más comandos en **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)**

---

## 📊 Arquitectura

### Componentes

```
┌─────────────────────────────────────────────┐
│          NGINX (Reverse Proxy)              │
│    - HTTPS/SSL (Let's Encrypt)              │
│    - Compresión GZIP                        │
│    - Cache de archivos estáticos            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│          PHP-FPM (Aplicación)               │
│    - Laravel 11                             │
│    - Spatie Tenancy                         │
│    - Sanctum API                            │
└──────────────────┬──────────────────────────┘
        ┌─────────┼─────────┐
        │         │         │
    ┌───┴──┐  ┌──┴──┐  ┌───┴──┐
    │MySQL │  │Redis│  │Files │
    └──────┘  └─────┘  └──────┘
```

### Base de Datos

- **BD Central**: `sdrimsacbot_central` - Usuarios, tenants, dominios
- **BD Tenants**: `tenant_{tenant_id}` - Datos específicos de cada tenant
- Cada tenant tiene su propia BD completamente aislada

### Multi-Tenancy

Identificación de tenants por **dominio**:

```
sdrimsac.xyz                    → Aplicación Central
cliente1.sdrimsac.xyz           → Tenant 1
cliente2.sdrimsac.xyz           → Tenant 2
subdomain.sdrimsac.xyz          → Tenant N
```

---

## 👥 Gestión de Tenants

### Crear tenant

```bash
# Método 1: Script automatizado
bash create-tenant.sh cliente1 cliente1.sdrimsac.xyz

# Método 2: Consola Tinker
docker-compose -f docker-compose.production.yml exec app php artisan tinker
$tenant = \App\Models\Tenant::create(['id' => 'cliente1']);
$tenant->domains()->create(['domain' => 'cliente1.sdrimsac.xyz']);
exit;
```

### Listar tenants

```bash
docker-compose -f docker-compose.production.yml exec app php artisan tinker
\App\Models\Tenant::all();
exit;
```

### Ejecutar comandos para tenant

```bash
# Migraciones de tenant específico
docker-compose -f docker-compose.production.yml exec app \
  php artisan migrate --tenants=cliente1

# Todos los tenants
docker-compose -f docker-compose.production.yml exec app \
  php artisan migrate --tenants
```

---

## 📦 Stack Tecnológico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **PHP** | 8.2 | Backend |
| **Laravel** | 11.x | Framework web |
| **Spatie Tenancy** | 3.x | Multi-tenancy |
| **MySQL/MariaDB** | 10.6 | Base de datos |
| **Redis** | Alpine | Cache y Queue |
| **Nginx** | Alpine | Servidor web |
| **Docker** | Latest | Containerización |
| **Node.js** | 20 | Assets y herramientas |
| **Tailwind CSS** | 3.x | Styling |
| **Vite** | 5.x | Build tool |

---

## 🔐 Seguridad

✅ HTTPS/SSL obligatorio  
✅ Headers de seguridad (HSTS, X-Frame-Options, etc.)  
✅ CSRF protection  
✅ Rate limiting  
✅ SQL injection prevention (Eloquent)  
✅ XSS protection  
✅ Authentication con Sanctum  
✅ Environment variables no versionadas  
✅ Backups automáticos  
✅ Monitoreo continuo  

---

## 📈 Performance

| Métrica | Valor |
|---------|-------|
| **Cache Driver** | Redis |
| **Database Connection** | Connection Pooling |
| **Static File Compression** | GZIP |
| **Cache Headers** | 1 año para assets |
| **PHP Memory Limit** | 512MB |
| **DB Query Timeout** | 5min |
| **Queue Workers** | 4 procesos |

---

## 🆘 Troubleshooting

### Problema: Sitio no carga

```bash
# Verificar servicios
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f app
```

Ver **[COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md)** para más soluciones.

### Problema: Error 502 (Bad Gateway)

Nginx no puede conectar a PHP. Solución:

```bash
docker-compose -f docker-compose.production.yml restart app
```

### Problema: Base de datos no conecta

```bash
# Verificar credenciales en .env.production
# Reiniciar MySQL
docker-compose -f docker-compose.production.yml restart mysql

# Ver logs
docker-compose -f docker-compose.production.yml logs mysql
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -am 'Agrega mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia **MIT**. Ver [LICENSE](./LICENSE) para más detalles.

---

## 📞 Contacto y Soporte

- **Email**: [Tu email]
- **Issues**: Usar GitHub Issues para reportar bugs
- **Documentación**: Ver archivos .md en el repositorio

---

## 🎉 Próximas Mejoras

- [ ] CI/CD pipeline con GitHub Actions
- [ ] Monitoring con Sentry
- [ ] Analytics con Plausible
- [ ] Integración WhatsApp API
- [ ] Dashboard de admin mejorado
- [ ] Tests automatizados
- [ ] Documentación API con Swagger

---

## 📚 Recursos Útiles

- [Laravel Documentation](https://laravel.com/docs)
- [Spatie Tenancy Docs](https://spatie.be/docs/laravel-tenancy)
- [Docker Docs](https://docs.docker.com)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Redis Documentation](https://redis.io/docs)

---

**Versión**: 1.0.0  
**Última actualización**: 2026-01-03  
**Autor**: SDRimsac Team  
**Estado**: ✅ Production Ready

---

## ⭐ Estadísticas del Proyecto

- **Total de commits**: [Ver en GitHub]
- **Última actualización**: 2026-01-03
- **Licencia**: MIT
- **PHP Version**: 8.2+
- **Laravel Version**: 11.x

---

¿Necesitas ayuda? Consulta la [documentación completa](./DEPLOYMENT.md) o abre un [issue](https://github.com/sdrdesing/sdrimsacbot/issues).
