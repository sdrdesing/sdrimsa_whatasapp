#!/bin/bash
# Script para crear un nuevo tenant
# Uso: bash create-tenant.sh nombreTenant dominio.sdrimsac.xyz

if [ $# -lt 2 ]; then
    echo "❌ Uso: bash create-tenant.sh <nombre_tenant> <dominio>"
    echo "Ejemplo: bash create-tenant.sh cliente1 cliente1.sdrimsac.xyz"
    exit 1
fi

TENANT_NAME=$1
TENANT_DOMAIN=$2
PROJECT_PATH="/var/www/sdrimsacbot"

cd $PROJECT_PATH

echo "🔧 Creando nuevo tenant..."
echo "Nombre: $TENANT_NAME"
echo "Dominio: $TENANT_DOMAIN"

# Crear tenant usando tinker
docker compose -f docker-compose.production.yml exec -T app php artisan tinker << EOF
\$tenant = \App\Models\Tenant::create(['id' => '$TENANT_NAME']);
\$tenant->domains()->create(['domain' => '$TENANT_DOMAIN']);
echo "✅ Tenant creado exitosamente\n";
exit;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tenant '$TENANT_NAME' creado en dominio '$TENANT_DOMAIN'"
    echo ""
    echo "📝 Próximos pasos:"
    echo "1. Ejecutar migraciones del tenant:"
    echo "   docker compose -f docker-compose.production.yml exec app php artisan migrate --tenants=$TENANT_NAME"
    echo ""
    echo "2. Agregar dominio al DNS:"
    echo "   $TENANT_DOMAIN -> IP_DEL_VPS"
    echo ""
    echo "3. Configurar SSL para el dominio"
else
    echo "❌ Error creando tenant"
    exit 1
fi
