# 1. Base: Começamos com uma imagem PHP que já inclui o Composer.
# Estamos usando uma imagem oficial do PHP com Apache. Ajuste a versão do PHP conforme necessário.
FROM php:8.2-apache

# 2. Instalar Ferramentas Necessárias
# Instala extensões PHP (pdo_mysql é comum para Laravel), Node.js (para NPM) e outras ferramentas úteis.
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    git \
    nodejs \
    npm \
    && docker-php-ext-install pdo pdo_mysql opcache \
    && a2enmod rewrite

# 3. Definir o Diretório de Trabalho
# Define o diretório de trabalho dentro do contêiner. O seu código estará aqui.
WORKDIR /var/www/html/

# 4. Copiar o Código
# Copia todo o código da sua pasta 'api' (Laravel) para o diretório de trabalho do Docker.
COPY api /var/www/html/

# 5. Configurar Permissões
# Garante que o Apache/Laravel possa escrever nas pastas de cache e logs.
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 6. Build/Instalação de Dependências (O que estava no Build Command do Render)
# Instala dependências PHP, Node e compila assets.
RUN composer install --no-dev --prefer-dist \
    && npm install \
    && npm run prod

# 7. Configuração do Laravel
# Gera a chave da aplicação (Importante: em produção, use variáveis de ambiente no Render).
# O Laravel não deve rodar com essa chave em ambiente público, ela deve vir do Render.
# Se você já tem a APP_KEY no Render, pode pular este passo.
# RUN php artisan key:generate

# 8. Comandos de Inicialização (O que estava no Start Command do Render)
# Expõe a porta 80, padrão do Apache.
EXPOSE 80

# Comando para iniciar o servidor web (Apache).
# Se o seu entry point for diferente (ex: usando php artisan serve ou FPM), ajuste este comando.
# Para esta base (php:8.2-apache), o comando padrão do Dockerfile é suficiente.
# Se você precisa de migração no Start Command, adicione um script de entrada.

# Exemplo de Script de Entrada (entrypoint.sh) para migração:
# Crie um arquivo 'entrypoint.sh' na raiz do seu repo com este conteúdo:
# #!/bin/bash
# php artisan migrate --force
# exec apache2-foreground

# E no Dockerfile:
# COPY entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/entrypoint.sh
# ENTRYPOINT ["entrypoint.sh"]
# CMD ["apache2-foreground"]