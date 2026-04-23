FROM php:8.2-fpm

WORKDIR /var/www

# Instalar dependencias del sistema y Node.js/NPM
RUN apt-get update && apt-get install -y \
    git curl unzip libpng-dev libonig-dev libxml2-dev \
    libzip-dev zip supervisor gnupg libpq-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql pgsql mbstring zip exif pcntl bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Redis
RUN pecl install redis && \
    docker-php-ext-enable redis

# Copiar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar código del proyecto
COPY . .

# Instalar dependencias de Composer
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Configurar permisos
RUN chown -R www-data:www-data /var/www && \
    chmod -R 755 /var/www/storage && \
    chmod -R 755 /var/www/bootstrap/cache

# Generar clave de aplicación (con || true para evitar error si ya existe)
RUN php artisan key:generate --force || true

# Limpiar caché
RUN php artisan config:clear || true && \
    php artisan cache:clear || true

EXPOSE 9000

CMD ["php-fpm"]
