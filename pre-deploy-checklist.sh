#!/bin/bash
# 📋 CHECKLIST PRE-DEPLOY A PRODUCCIÓN
# Ejecutar en orden para asegurar que todo está listo

echo "=================================================="
echo "   🚀 CHECKLIST PRE-DEPLOY A PRODUCCIÓN"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark="✓"
x_mark="✗"

echo -e "${YELLOW}=== VERIFICACIONES LOCALES ===${NC}\n"

# 1. Verificar que estamos en la rama main
echo -n "1. Verificar rama (debe ser 'main'): "
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${GREEN}${check_mark} $CURRENT_BRANCH${NC}"
else
    echo -e "${RED}${x_mark} Estás en '$CURRENT_BRANCH', debes estar en 'main'${NC}"
fi

# 2. Verificar que no hay cambios sin commitear
echo -n "2. Cambios sin commitear: "
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}${check_mark} Todo commiteado${NC}"
else
    echo -e "${RED}${x_mark} Hay cambios sin commitear${NC}"
    git status --short
fi

# 3. Verificar .env.production existe
echo -n "3. Archivo .env.production: "
if [ -f ".env.production" ]; then
    echo -e "${GREEN}${check_mark} Existe${NC}"
else
    echo -e "${RED}${x_mark} No existe${NC}"
fi

# 4. Verificar docker-compose.production.yml
echo -n "4. docker-compose.production.yml: "
if [ -f "docker-compose.production.yml" ]; then
    echo -e "${GREEN}${check_mark} Existe${NC}"
else
    echo -e "${RED}${x_mark} No existe${NC}"
fi

# 5. Verificar Dockerfile.production
echo -n "5. Dockerfile.production: "
if [ -f "Dockerfile.production" ]; then
    echo -e "${GREEN}${check_mark} Existe${NC}"
else
    echo -e "${RED}${x_mark} No existe${NC}"
fi

# 6. Verificar deploy.sh existe
echo -n "6. Script deploy.sh: "
if [ -f "deploy.sh" ]; then
    echo -e "${GREEN}${check_mark} Existe${NC}"
else
    echo -e "${RED}${x_mark} No existe${NC}"
fi

# 7. Verificar que package.json existe y tiene build script
echo -n "7. npm build script: "
if grep -q '"build"' package.json; then
    echo -e "${GREEN}${check_mark} Definido${NC}"
else
    echo -e "${RED}${x_mark} No definido en package.json${NC}"
fi

# 8. Verificar Composer
echo -n "8. Archivo composer.json: "
if [ -f "composer.json" ]; then
    echo -e "${GREEN}${check_mark} Existe${NC}"
else
    echo -e "${RED}${x_mark} No existe${NC}"
fi

echo ""
echo -e "${YELLOW}=== PRUEBAS DE COMPILACIÓN ===${NC}\n"

# 9. Intentar compilar assets
echo "9. Compilando assets (npm run build)..."
if npm run build > /tmp/npm-build.log 2>&1; then
    echo -e "${GREEN}${check_mark} Build exitoso${NC}"
else
    echo -e "${RED}${x_mark} Error en build${NC}"
    echo "Errores:"
    tail -20 /tmp/npm-build.log
fi

# 10. Verificar que se creó public/build
echo -n "10. Directorio public/build creado: "
if [ -d "public/build" ]; then
    echo -e "${GREEN}${check_mark} Existe${NC}"
else
    echo -e "${RED}${x_mark} No existe${NC}"
fi

echo ""
echo -e "${YELLOW}=== VERIFICACIONES DE DEPENDENCIAS ===${NC}\n"

# 11. Verificar que Composer dependencies están instaladas
echo -n "11. Dependencias PHP instaladas (vendor/): "
if [ -d "vendor" ]; then
    echo -e "${GREEN}${check_mark} Sí${NC}"
else
    echo -e "${RED}${x_mark} No. Ejecutar: composer install${NC}"
fi

# 12. Verificar que npm dependencies están instaladas
echo -n "12. Dependencias Node.js instaladas (node_modules/): "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}${check_mark} Sí${NC}"
else
    echo -e "${YELLOW}⚠ No. Se instalarán en Docker${NC}"
fi

echo ""
echo -e "${YELLOW}=== CONFIGURACIÓN CRÍTICA ===${NC}\n"

# 13. Verificar APP_KEY en .env.production
echo -n "13. APP_KEY en .env.production: "
if grep -q "^APP_KEY=" .env.production && grep -v "^APP_KEY=$" .env.production | grep -q "APP_KEY"; then
    echo -e "${GREEN}${check_mark} Configurado${NC}"
else
    echo -e "${RED}${x_mark} No está configurado${NC}"
fi

# 14. Verificar APP_ENV es 'production'
echo -n "14. APP_ENV=production: "
if grep -q "^APP_ENV=production" .env.production; then
    echo -e "${GREEN}${check_mark} Correcto${NC}"
else
    echo -e "${RED}${x_mark} No está en producción${NC}"
fi

# 15. Verificar APP_DEBUG es 'false'
echo -n "15. APP_DEBUG=false: "
if grep -q "^APP_DEBUG=false" .env.production; then
    echo -e "${GREEN}${check_mark} Correcto${NC}"
else
    echo -e "${RED}${x_mark} Debug aún activado${NC}"
fi

# 16. Verificar CACHE_DRIVER
echo -n "16. CACHE_DRIVER=redis: "
if grep -q "^CACHE_DRIVER=redis" .env.production; then
    echo -e "${GREEN}${check_mark} Optimizado${NC}"
else
    echo -e "${YELLOW}⚠ No está en redis (revisar si es intencional)${NC}"
fi

# 17. Verificar QUEUE_CONNECTION
echo -n "17. QUEUE_CONNECTION=redis: "
if grep -q "^QUEUE_CONNECTION=redis" .env.production; then
    echo -e "${GREEN}${check_mark} Optimizado${NC}"
else
    echo -e "${YELLOW}⚠ No está en redis (revisar si es intencional)${NC}"
fi

echo ""
echo -e "${YELLOW}=== RESUMEN ===${NC}\n"
echo "✓ Si todas las verificaciones están en verde (${GREEN}✓${NC}), está listo para deploy"
echo "⚠ Revisar las advertencias (${YELLOW}⚠${NC}) si crees que deberían ser verdes"
echo "✗ Solucionar los errores (${RED}✗${NC}) antes de hacer deploy"
echo ""
echo "=================================================="
echo "   Próximos pasos:"
echo "   1. git push origin main"
echo "   2. Conectar al VPS: ssh root@sdrimsac.xyz"
echo "   3. Ejecutar: bash deploy.sh"
echo "=================================================="
