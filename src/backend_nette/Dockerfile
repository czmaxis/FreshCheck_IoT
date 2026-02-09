FROM php:8.2-apache

# System dependencies
RUN apt-get update && apt-get install -y \
    libssl-dev \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# MongoDB PHP extension
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Apache: enable mod_rewrite
RUN a2enmod rewrite

# Apache: document root → www/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/www
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Apache: allow .htaccess overrides
RUN sed -ri -e 's/AllowOverride None/AllowOverride All/g' \
    /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Render.com provides PORT env variable (default 10000)
# Apache must listen on that port
RUN sed -ri -e 's/Listen 80/Listen ${PORT}/g' \
    /etc/apache2/ports.conf
RUN sed -ri -e 's/:80/:${PORT}/g' \
    /etc/apache2/sites-available/*.conf

# Copy application
COPY . /var/www/html

# Install PHP dependencies
RUN cd /var/www/html && composer install --no-dev --optimize-autoloader --no-interaction

# Writable directories for Nette
RUN mkdir -p /var/www/html/temp /var/www/html/log \
    && chown -R www-data:www-data /var/www/html/temp /var/www/html/log

EXPOSE ${PORT}
