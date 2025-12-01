#!/bin/bash
# Hour Jungle CRM - 部署腳本
# 在 GCP VM 上執行

set -e

PROJECT_DIR="/var/www/hourjungle"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "========================================="
echo "Hour Jungle CRM - Deploy"
echo "========================================="

# 後端部署
echo "[1/4] 部署後端..."
cd $BACKEND_DIR
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
chown -R www-data:www-data storage bootstrap/cache

# 前端建置
echo "[2/4] 建置前端..."
cd $FRONTEND_DIR
npm ci
npm run build

# 設定權限
echo "[3/4] 設定權限..."
chown -R www-data:www-data $PROJECT_DIR

# 重啟服務
echo "[4/4] 重啟服務..."
systemctl restart php8.3-fpm
systemctl restart nginx

echo "========================================="
echo "部署完成！"
echo ""
echo "請確認："
echo "1. 已設定 $BACKEND_DIR/.env"
echo "2. 已設定 Nginx server_name"
echo "3. 防火牆已開放 80/443 port"
echo "========================================="
