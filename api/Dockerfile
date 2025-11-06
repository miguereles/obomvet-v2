# 1. Base: Imagem PHP oficial com Apache
FROM php:8.2-apache

# 2. Instalar Ferramentas e Extensões
# BLOCO NOVO (CORRIGIDO)
# BLOCO CORRIGIDO (VERSÃO FINAL)
RUN apt-get update && \
    apt-get install -y \
     libzip-dev \
     unzip \
     git \
     nodejs \
     npm \
     libpq-dev \
  && docker-php-ext-install pdo pdo_pgsql opcache \
  && a2enmod rewrite
# 3. Instalar Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# 4. Definir o Diretório de Trabalho
WORKDIR /var/www/html/

# 5. Copiar o Código
# CORREÇÃO: Copia o conteúdo do diretório atual (api/)
# ... (outras coisas acima)

# 4. Copiar código-fonte
COPY . /var/www/html

# NOVO: Copia a configuração do Apache para apontar para /public
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf

# 5. Instalar dependências (PHP e Node)
# ... (o resto do arquivo) ...

# 6. Copiar o Script de Entrada (Entrypoint)
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# 7. Build/Instalação de Dependências
# CORREÇÃO: Mudado para 'npm run build'
# BLOCO CORRIGIDO
RUN composer install --no-dev --prefer-dist \
     && rm -f package-lock.json \
     && npm install \
     && npm run build

# 8. Configurar Permissões (o entrypoint.sh cuidará da pasta 'database')
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 9. Define o Entrypoint para rodar migrações e iniciar o servidor
ENTRYPOINT ["entrypoint.sh"]

# O CMD ["apache2-foreground"] foi movido para o entrypoint.sh