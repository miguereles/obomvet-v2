# 1. Base: Imagem PHP oficial com Apache
FROM php:8.2-apache

# 2. Instalar Ferramentas e Extensões
# Instala extensões PHP, Node.js e NPM
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    git \
    nodejs \
    npm \
    && docker-php-ext-install pdo pdo_mysql opcache \
    && a2enmod rewrite

# 3. Definir o Diretório de Trabalho (onde o código vai)
WORKDIR /var/www/html/

# 4. Copiar o Código
# Copia a pasta 'api' (Laravel)
COPY api /var/www/html/

# 5. Build/Instalação de Dependências
# Instala PHP, Node e compila assets
RUN composer install --no-dev --prefer-dist \
    && npm install \
    && npm run prod

# 6. Rodar Migrações do Banco de Dados (durante o Build)
# A migração é executada assim que as dependências estiverem prontas.
# Se a conexão com o DB não estiver disponível durante o build, isso pode falhar.
# Verifique se suas variáveis de ambiente DB_... estão disponíveis para o Build.
RUN php artisan migrate --force

# 7. Configurar Permissões
# Garante que o Apache possa escrever nos logs e cache.
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Comando de Start (Inicia o Apache, que serve o Laravel)
# O comando padrão do `php:8.2-apache` é o Apache em foreground.
CMD ["apache2-foreground"]