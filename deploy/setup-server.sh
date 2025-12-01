#!/bin/bash
# GCP VM 初始化腳本 - Ubuntu 24.04
# 執行方式: sudo bash setup-server.sh

set -e

echo "========================================="
echo "Hour Jungle CRM - Server Setup"
echo "========================================="

# 更新系統
echo "[1/7] 更新系統套件..."
apt update && apt upgrade -y

# 安裝基本工具
echo "[2/7] 安裝基本工具..."
apt install -y curl git unzip software-properties-common

# 安裝 PHP 8.3 + 擴展
echo "[3/7] 安裝 PHP 8.3..."
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.3 php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-bcmath php8.3-curl php8.3-zip php8.3-gd php8.3-intl

# 安裝 Composer
echo "[4/7] 安裝 Composer..."
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# 安裝 Node.js 20
echo "[5/7] 安裝 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安裝 MySQL 8.0
echo "[6/7] 安裝 MySQL 8.0..."
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 安裝 Nginx
echo "[7/7] 安裝 Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 建立專案目錄
mkdir -p /var/www/hourjungle
chown -R www-data:www-data /var/www/hourjungle

echo "========================================="
echo "基本環境安裝完成！"
echo ""
echo "接下來請執行："
echo "1. 設定 MySQL: sudo mysql_secure_installation"
echo "2. 建立資料庫: sudo mysql -e \"CREATE DATABASE hourjungle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
echo "3. 上傳專案程式碼到 /var/www/hourjungle"
echo "4. 執行 deploy.sh 部署腳本"
echo "========================================="
