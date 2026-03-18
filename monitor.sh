#!/bin/bash
# Script de monitoreo del sistema
# Ejecutar periódicamente para verificar estado

PROJECT_PATH="/var/www/sdrimsacbot"
LOG_FILE="/var/log/sdrimsacbot-monitor.log"

cd $PROJECT_PATH

echo "[$(date)] Verificando estado de servicios..." >> $LOG_FILE

# Función para escribir en log
log_message() {
    echo "[$(date)] $1" >> $LOG_FILE
}

# Verificar cada servicio
check_service() {
    local service=$1
    local status=$(docker compose -f docker-compose.production.yml ps $service | grep -E "Up|Exit")
    
    if [ -z "$status" ]; then
        log_message "❌ ALERTA: Servicio $service no está corriendo"
        return 1
    else
        log_message "✅ Servicio $service activo"
        return 0
    fi
}

# Verificar servicios críticos
check_service "app"
check_service "nginx"
check_service "mysql"
check_service "redis"

# Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log_message "⚠️ ALERTA: Uso de disco alto: ${DISK_USAGE}%"
else
    log_message "✅ Espacio en disco OK: ${DISK_USAGE}%"
fi

# Verificar memoria
MEMORY_USAGE=$(free | awk 'NR==2 {printf("%.0f", $3/$2 * 100)}')
if [ $MEMORY_USAGE -gt 80 ]; then
    log_message "⚠️ ALERTA: Uso de memoria alto: ${MEMORY_USAGE}%"
else
    log_message "✅ Memoria OK: ${MEMORY_USAGE}%"
fi

# Verificar conectividad a base de datos
DB_CHECK=$(docker compose -f docker-compose.production.yml exec -T mysql mysql -u sdrimsac_user -p${DB_PASSWORD} -e "SELECT 1" 2>/dev/null)
if [ $? -eq 0 ]; then
    log_message "✅ Conexión a base de datos OK"
else
    log_message "❌ ALERTA: No se puede conectar a la base de datos"
fi

# Verificar certificado SSL
CERT_DATE=$(date -d "$(openssl x509 -in /etc/letsencrypt/live/sdrimsac.xyz/cert.pem -noout -enddate | cut -d= -f 2)" +%s 2>/dev/null)
TODAY=$(date +%s)
DAYS_LEFT=$(( ($CERT_DATE - $TODAY) / 86400 ))

if [ $DAYS_LEFT -lt 0 ]; then
    log_message "❌ ALERTA: Certificado SSL expirado"
elif [ $DAYS_LEFT -lt 7 ]; then
    log_message "⚠️ ALERTA: Certificado SSL vence en $DAYS_LEFT días"
else
    log_message "✅ Certificado SSL OK (vence en $DAYS_LEFT días)"
fi

log_message "Verificación completada"
echo ""
