# 🌴 Jungle CRM

**Hour Jungle 共享辦公室客戶關係管理系統**

[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4.svg)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20.svg)](https://laravel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📖 目錄

- [功能特色](#-功能特色)
- [技術棧](#-技術棧)
- [快速開始](#-快速開始)
- [API 文件](#-api-文件)
- [Brain AI 整合](#-brain-ai-整合)
- [部署指南](#-部署指南)

---

## ✨ 功能特色

### 👥 **客戶管理**
- 客戶資料 CRUD（含 LINE 綁定）
- 客戶分類與標籤
- 匯入/匯出功能

### 📝 **合約管理**
- 合約建立與追蹤
- 合約狀態管理（草擬、審核中、已核准、已拒絕）
- PDF 合約上傳與下載

### 💰 **繳費管理**
- 繳費記錄追蹤
- 逾期提醒
- 繳費狀態計算

### 🏢 **場館管理**
- 多場館支援
- 業務項目設定

### 🤖 **Brain AI 整合**
- 透過 LINE userId 查詢客戶資料
- 提供合約、繳費資訊給 AI 生成個人化回覆
- 雙向 API 整合

### 📊 **系統管理**
- 權限角色管理
- LINE Bot 設定
- 系統日誌

---

## 🛠 技術棧

- **框架**：Laravel 11 (PHP 8.2)
- **資料庫**：MySQL 8.0
- **認證**：Laravel Sanctum
- **LINE 整合**：LINE Bot SDK

---

## 🚀 快速開始

### 前置需求

- PHP 8.2+
- Composer
- MySQL 8.0+

### 安裝步驟

```bash
# Clone 專案
git clone https://github.com/lgscvb/20251127-hj-.git
cd hourjungle_backend

# 安裝依賴
composer install

# 環境設定
cp .env.example .env
php artisan key:generate

# 編輯 .env 設定資料庫連線

# 資料庫遷移
php artisan migrate

# 啟動開發伺服器
php artisan serve
```

---

## 📚 API 文件

詳細 API 文件請參考 [docs/API.md](docs/API.md)

### 主要端點

| 模組 | 端點前綴 | 說明 |
|------|----------|------|
| 認證 | `/api/login` | 登入/登出 |
| 客戶 | `/api/customers` | 客戶管理 |
| 合約 | `/api/projects` | 合約管理 |
| 繳費 | `/api/payment-history` | 繳費記錄 |
| 場館 | `/api/branches` | 場館管理 |
| 系統 | `/api/config` | 系統設定 |
| **Brain** | `/api/brain/*` | AI 整合 API |

---

## 🔗 Brain AI 整合

Jungle 提供 API 供 Brain AI 系統查詢客戶資料，實現個人化 AI 客服回覆。

### 整合 API 端點

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brain/customer/{lineUserId}` | 查詢客戶資料（含合約、繳費狀態） |
| GET | `/api/brain/customer/{lineUserId}/contracts` | 查詢客戶所有合約 |
| GET | `/api/brain/customer/{lineUserId}/payments` | 查詢客戶繳費記錄 |
| POST | `/api/brain/leads` | 建立潛在客戶（Brain 轉交） |
| POST | `/api/brain/interactions` | 記錄客戶互動 |

### 整合流程

```
LINE 訊息 → Brain AI 系統
                ↓
         查詢 Jungle CRM
         GET /api/brain/customer/{line_id}
                ↓
         取得客戶資料、合約狀態、繳費狀況
                ↓
         AI 生成個人化回覆
```

### 環境設定

Brain 端需設定：
```env
ENABLE_JUNGLE_INTEGRATION=true
JUNGLE_API_URL=https://jungle.yourspace.org/api
JUNGLE_API_KEY=your-api-key
```

---

## 🐳 部署指南

### Docker 部署

```bash
# 建立並啟動容器
docker-compose up -d

# 執行遷移
docker-compose exec app php artisan migrate
```

### 常用指令

```bash
# 清除快取
php artisan route:clear
php artisan config:clear
php artisan cache:clear

# 資料庫種子
php artisan db:seed

# 執行測試
php artisan test
```

---

## 📋 CI/CD

專案使用 GitHub Actions 自動化測試：

- **推送到 main/develop**：自動執行測試
- **Pull Request**：自動執行 lint 和測試

配置檔：`.github/workflows/ci.yml`

---

## 📄 License

MIT License

---

## 📧 聯絡

- **專案**：Hour Jungle CRM
- **開發者**：Hour Jungle Team
