#!/bin/bash

# Este script executa as migrações do Laravel
echo "Running migrations..."
php artisan migrate --force

# Em seguida, inicia o servidor Apache (o processo principal)
echo "Starting Apache..."
exec apache2-foreground