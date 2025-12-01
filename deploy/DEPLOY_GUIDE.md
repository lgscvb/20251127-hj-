# Hour Jungle CRM - GCP 部署指南

## 伺服器資訊
- **IP**: 136.118.197.78
- **OS**: Ubuntu 24.04
- **規格**: e2-small (2 vCPU, 2GB RAM)

---

## 步驟 1: SSH 連線到 VM

```bash
gcloud compute ssh instance-20251201-132636 --zone=us-west1-b
# 或使用 SSH
ssh your_username@136.118.197.78
```

---

## 步驟 2: 初始化伺服器環境

```bash
# 切換到 root
sudo -i

# 更新系統
apt update && apt upgrade -y

# 安裝基本工具
apt install -y curl git unzip software-properties-common

# 安裝 PHP 8.3
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.3 php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-bcmath php8.3-curl php8.3-zip php8.3-gd php8.3-intl

# 安裝 Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# 安裝 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安裝 MySQL
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 安裝 Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

## 步驟 3: 設定 MySQL

```bash
# 設定 root 密碼
mysql_secure_installation

# 建立資料庫和使用者
mysql -u root -p
```

在 MySQL 中執行：
```sql
CREATE DATABASE hourjungle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hourjungle'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON hourjungle.* TO 'hourjungle'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 步驟 4: 上傳程式碼

**方法 A: 使用 Git (推薦)**
```bash
cd /var/www
git clone YOUR_REPO_URL hourjungle
```

**方法 B: 使用 SCP**
```bash
# 在本機執行
scp -r hourjungle_backend user@136.118.197.78:/var/www/hourjungle/backend
scp -r hourjungle_frontend user@136.118.197.78:/var/www/hourjungle/frontend
```

---

## 步驟 5: 設定後端

```bash
cd /var/www/hourjungle/backend

# 安裝依賴
composer install --no-dev --optimize-autoloader

# 複製並編輯 .env
cp .env.example .env
nano .env
```

**修改 .env 中的設定：**
```env
APP_NAME=HourJungle
APP_ENV=production
APP_DEBUG=false
APP_URL=http://136.118.197.78

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hourjungle
DB_USERNAME=hourjungle
DB_PASSWORD=YOUR_SECURE_PASSWORD

LINE_CHANNEL_ACCESS_TOKEN=你的LINE_TOKEN
LINE_CHANNEL_SECRET=你的LINE_SECRET
```

```bash
# 產生金鑰
php artisan key:generate

# 執行資料庫遷移
php artisan migrate --force

# 執行 Seeder (可選，建立測試資料)
php artisan db:seed

# 快取設定
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 設定權限
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

---

## 步驟 6: 設定前端

```bash
cd /var/www/hourjungle/frontend

# 安裝依賴
npm ci

# 修改 API 網址 (如有需要)
# nano src/config.js 或 .env

# 建置
npm run build
```

---

## 步驟 7: 設定 Nginx

```bash
# 複製設定檔
nano /etc/nginx/sites-available/hourjungle
```

貼上以下內容：
```nginx
server {
    listen 80;
    server_name 136.118.197.78;

    client_max_body_size 20M;

    # 後端 API
    location ^~ /api {
        root /var/www/hourjungle/backend/public;
        try_files $uri /index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME /var/www/hourjungle/backend/public/index.php;
            include fastcgi_params;
        }
    }

    # LINE Webhook
    location ^~ /webhook {
        root /var/www/hourjungle/backend/public;
        try_files $uri /index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME /var/www/hourjungle/backend/public/index.php;
            include fastcgi_params;
        }
    }

    # 前端
    location / {
        root /var/www/hourjungle/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 日誌
    access_log /var/log/nginx/hourjungle_access.log;
    error_log /var/log/nginx/hourjungle_error.log;
}
```

```bash
# 啟用設定
ln -s /etc/nginx/sites-available/hourjungle /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# 測試設定
nginx -t

# 重啟服務
systemctl restart nginx
systemctl restart php8.3-fpm
```

---

## 步驟 8: 設定防火牆

```bash
# 開放 HTTP
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

**GCP 防火牆規則** (在 GCP Console):
1. VPC network → Firewall
2. 確保 `default-allow-http` 規則存在

---

## 步驟 9: 測試

```bash
# 測試後端 API
curl http://136.118.197.78/api/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin"}'
```

瀏覽器訪問：http://136.118.197.78

---

## 測試帳號

| Email | 密碼 |
|-------|------|
| admin@example.com | admin |
| aa1111@example.com | aa1111 |

---

## DNS 設定完成後

1. 更新 Nginx `server_name` 為你的網域
2. 安裝 SSL：
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## LINE Webhook 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 設定 Webhook URL: `https://yourdomain.com/webhook` (需要 HTTPS)
3. 或臨時用 ngrok 測試

---

## 常見問題

**502 Bad Gateway**
```bash
systemctl status php8.3-fpm
tail -f /var/log/nginx/hourjungle_error.log
```

**Permission denied**
```bash
chown -R www-data:www-data /var/www/hourjungle
chmod -R 775 /var/www/hourjungle/backend/storage
```

**資料庫連線失敗**
```bash
php artisan config:clear
php artisan cache:clear
```
