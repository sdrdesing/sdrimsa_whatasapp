FROM php:8.1-fpm

# Install system dependencies and PHP extensions required by most Laravel apps
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zlib1g-dev \
    && docker-php-ext-install pdo_mysql zip exif bcmath pcntl

# Install composer (copy from official composer image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy only composer files first to leverage docker cache
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist || true

# Copy remaining application files
COPY . /var/www

# Ensure directories exist and proper permissions (composer may create vendor)
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache || true

EXPOSE 9000

CMD ["php-fpm"]
