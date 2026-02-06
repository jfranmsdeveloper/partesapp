FROM php:8.2-apache

# Install extensions
RUN docker-php-ext-install pdo pdo_mysql

# Enable apache mod_rewrite
RUN a2enmod rewrite

# Update access permissions for uploads
RUN chown -R www-data:www-data /var/www/html
