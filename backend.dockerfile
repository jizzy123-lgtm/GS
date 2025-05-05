FROM php:8.2-fpm

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    curl zip unzip git \
    libpq-dev libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-install pdo pdo_mysql gd

# Install Composer (PHP dependency manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory in the container
WORKDIR /var/www/html

# Copy Laravel project files into the container
COPY . . 

# Install Laravel dependencies using Composer
RUN composer install

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

# Expose the port the app runs on
EXPOSE 8000

# Command to run the Laravel server
CMD ["sh", "-c", "php artisan migrate && php artisan serve --host=0.0.0.0 --port=8000"]
