#!/bin/bash
# Script de backup automatizado
# Uso: bash backup.sh o agregar a crontab

BACKUP_DIR="/backups/sdrimsacbot"
PROJECT_PATH="/var/www/sdrimsacbot"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

echo "⏱️ Iniciando backup en $(date)"

cd $PROJECT_PATH

# 1. Backup de base de datos central
echo "📦 Backup de base de datos central..."
docker compose -f docker-compose.production.yml exec -T mysql mysqldump \
  -u sdrimsac_user -p${DB_PASSWORD} sdrimsacbot_central \
  > $BACKUP_DIR/central_db_$DATE.sql 2>/dev/null

if [ $? -eq 0 ]; then
    gzip $BACKUP_DIR/central_db_$DATE.sql
    echo "✅ Backup de base de datos exitoso: central_db_$DATE.sql.gz"
else
    echo "❌ Error en backup de base de datos"
fi

# 2. Backup de volúmenes MySQL
echo "📦 Backup de volúmenes..."
docker run --rm \
  -v sdrimsacbot_mysql_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/mysql_volume_$DATE.tar.gz -C /data . 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Backup de volúmenes exitoso: mysql_volume_$DATE.tar.gz"
else
    echo "❌ Error en backup de volúmenes"
fi

# 3. Limpiar backups antiguos
echo "🧹 Limpiando backups más antiguos de $RETENTION_DAYS días..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# 4. Mostrar resumen
echo ""
echo "📊 Resumen de backups:"
du -sh $BACKUP_DIR/*
echo ""
echo "✅ Backup completado en $(date)"
