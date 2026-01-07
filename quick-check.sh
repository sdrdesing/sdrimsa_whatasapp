#!/bin/bash
# 🔍 VERIFICACIÓN RÁPIDA PRE-DEPLOY
# Script rápido para verificar todo está listo

set -e

cd "$(dirname "$0")"

echo "🔍 VERIFICACIÓN RÁPIDA PRE-DEPLOY"
echo "=================================="
echo ""

# Check 1: Rama
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Rama actual: $BRANCH"
if [ "$BRANCH" != "main" ]; then
    echo "⚠️ Advertencia: No estás en 'main'"
fi

# Check 2: Status
echo ""
echo "📝 Cambios sin commitear:"
if git diff-index --quiet HEAD --; then
    echo "✓ Todo limpio"
else
    echo "⚠️ Hay cambios sin commitear:"
    git status --short
fi

# Check 3: Archivos críticos
echo ""
echo "📂 Archivos necesarios:"
FILES=(".env.production" "docker-compose.production.yml" "Dockerfile.production" "deploy.sh" "package.json" "composer.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ FALTA: $file"
    fi
done

# Check 4: npm build
echo ""
echo "🔨 Verificando npm build..."
if npm run build > /tmp/build.log 2>&1; then
    echo "✓ npm build exitoso"
else
    echo "✗ Error en npm build"
    tail -10 /tmp/build.log
fi

# Check 5: public/build
echo ""
echo "📦 Assets compilados:"
if [ -d "public/build" ]; then
    echo "✓ public/build/ existe"
    echo "  Archivos: $(find public/build -type f | wc -l)"
else
    echo "✗ FALTA: public/build/"
fi

# Check 6: .env.production
echo ""
echo "⚙️  Configuración .env.production:"
echo -n "  APP_ENV="
grep "^APP_ENV=" .env.production | cut -d= -f2
echo -n "  APP_DEBUG="
grep "^APP_DEBUG=" .env.production | cut -d= -f2
echo -n "  APP_URL="
grep "^APP_URL=" .env.production | cut -d= -f2

echo ""
echo "=================================="
echo "✓ Verificación completada"
echo ""
echo "Próximos pasos:"
echo "1. git push origin main"
echo "2. ssh root@sdrimsac.xyz"
echo "3. cd /var/www/sdrimsacbot && bash deploy.sh"
