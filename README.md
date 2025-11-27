# Jungle Group 專案

這是 Jungle Group 的主要專案儲存庫，包含多個子專案。

## 專案結構

- `AccountingFirm/` - 會計事務所相關系統
- `hourjungle_backend/` - Hour Jungle 後端服務
- `hourjungle_frontend/` - Hour Jungle 前端應用
- `jungle_chat_py/` - Jungle Chat AI 聊天服務

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
