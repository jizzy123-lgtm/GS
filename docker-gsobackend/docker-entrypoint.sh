#!/bin/sh
php artisan storage:link || true

if [ $# -eq 0 ]; then
    exec apache2-foreground
else
    exec "$@"
fi

