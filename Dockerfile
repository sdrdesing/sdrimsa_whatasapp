FROM php:8.2-fpm

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    git unzip libpng-dev libonig-dev libxml2-dev \
    libzip-dev zip curl \
    && docker-php-ext-install pdo_mysql mbstring zip exif pcntl

# Instalar Redis
RUN pecl install redis && \
    docker-php-ext-enable redis

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copiar código
COPY . .

# Instalar dependencias PHP
RUN composer install --no-dev --optimize-autoloader

# Optimizar Laravel
RUN php artisan key:generate \
 && php artisan config:clear \
 && php artisan config:cache \
 && php artisan route:cache \
 && php artisan view:cache

RUN chown -R www-data:www-data /var/www

EXPOSE 9000
CMD ["php-fpm"]
