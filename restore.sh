#!/bin/bash
# Script para restaurar desde backup

BACKUP_DIR="/backups/sdrimsacbot"
PROJECT_PATH="/var/www/sdrimsacbot"

if [ $# -eq 0 ]; then
    echo "❌ Uso: bash restore.sh <archivo_backup.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "No hay backups disponibles"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo $BACKUP_FILE"
    exit 1
fi

echo "⚠️ ADVERTENCIA: Esta operación reemplazará la base de datos actual"
echo "Archivo a restaurar: $BACKUP_FILE"
read -p "¿Continuar? (s/n): " confirm

if [ "$confirm" != "s" ]; then
    echo "Operación cancelada"
    exit 0
fi

cd $PROJECT_PATH

echo "📥 Restaurando base de datos..."

# Descomprimir si es necesario
if [[ $BACKUP_FILE == *.gz ]]; then
    TEMP_FILE="/tmp/backup_temp.sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# Restaurar base de datos
docker-compose -f docker-compose.production.yml exec -T mysql mysql \
  -u sdrimsac_user -p${DB_PASSWORD} sdrimsacbot_central < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restauración completada exitosamente"
    # Limpiar archivo temporal
    rm -f /tmp/backup_temp.sql
else
    echo "❌ Error durante la restauración"
    rm -f /tmp/backup_temp.sql
    exit 1
fi

# Limpiar caché
echo "Limpiando caché..."
docker-compose -f docker-compose.production.yml exec -T app php artisan cache:clear
docker-compose -f docker-compose.production.yml exec -T app php artisan view:clear

echo "✅ Proceso completado"
