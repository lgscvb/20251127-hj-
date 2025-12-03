# Jungle Group 專案

這是 Jungle Group 的主要專案儲存庫，包含多個子專案。

[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4.svg)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20.svg)](https://laravel.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D.svg)](https://vuejs.org/)

## 專案結構

- `AccountingFirm/` - 會計事務所相關系統
- `hourjungle_backend/` - Hour Jungle 後端服務 (Laravel 11)
- `hourjungle_frontend/` - Hour Jungle 前端應用 (Vue 3)
- `jungle_chat_py/` - Jungle Chat AI 聊天服務

## 🔗 Brain AI 整合

Hour Jungle 系統與 Brain AI 客服系統已完成整合，提供以下功能：

### 整合 API 端點
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/brain/customer/{lineUserId}` | 查詢客戶資料 |
| GET | `/api/brain/customer/{lineUserId}/contracts` | 查詢客戶合約 |
| GET | `/api/brain/customer/{lineUserId}/payments` | 查詢繳費記錄 |
| POST | `/api/brain/leads` | 建立潛在客戶 |
| POST | `/api/brain/interactions` | 記錄客戶互動 |

### 認證方式
使用 `X-Brain-Api-Key` Header 進行 API 認證：
```bash
curl -X GET "https://your-domain/api/brain/customer/U1234567890" \
  -H "X-Brain-Api-Key: your-api-key"
```

### 環境變數
```env
# Brain AI Integration
BRAIN_API_KEY=your-api-key-here
```

## ⚠️ 重要提醒：敏感憑證管理

### 環境變數設定

此專案使用 `.env` 檔案管理敏感憑證和環境變數。**所有敏感資訊已從 Git 儲存庫中移除**以確保安全。

#### 首次設定步驟

1. **複製範本檔案**
   ```bash
   cp .env.example .env
   ```

2. **取得 Google Cloud 憑證檔案**
   - 從本機備份中取得 `gifthouse-438703-56f858f70c1f.json`
   - 放置到 `AccountingFirm/` 目錄下

3. **編輯 `.env` 檔案**
   - 開啟 `.env` 檔案
   - 確認 `GOOGLE_APPLICATION_CREDENTIALS` 路徑正確
   - 確認 `GOOGLE_CLOUD_API_KEY` 已填入

4. **驗證設定**
   - `.env` 檔案已在 `.gitignore` 中，不會被提交到 Git
   - 憑證 JSON 檔案也已在 `.gitignore` 中，不會被提交

#### 環境變數說明

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud 服務帳號憑證檔案路徑 | `./AccountingFirm/gifthouse-438703-56f858f70c1f.json` |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud API 金鑰 | `AIzaSy...` |
| `FLASK_ENV` | Flask 執行環境 | `development` 或 `production` |
| `DEBUG` | 除錯模式 | `True` 或 `False` |

**⚠️ 安全提醒**：
- **絕對不要**將 `.env` 檔案或憑證 JSON 檔案提交到 Git
- **絕對不要**在程式碼中硬編碼任何敏感資訊
- 如需分享專案，請使用 `.env.example` 範本檔案

## 環境設定

請參考各子專案的 README.md 了解詳細的環境設定說明。

## 上傳日期

2025-11-27
