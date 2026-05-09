#!/bin/sh

# Install dependencies if vendor folder is missing
if [ ! -d "vendor" ]; then
    echo "Vendor folder missing. Installing dependencies..."
    composer install --no-interaction --optimize-autoloader
fi

echo "Starting Apache..."
exec apache2-foreground
