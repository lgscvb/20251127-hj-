# Jungle Group 專案

這是 Jungle Group 的主要專案儲存庫，包含多個子專案。

## 專案結構

- `AccountingFirm/` - 會計事務所相關系統
- `hourjungle_backend/` - Hour Jungle 後端服務
- `hourjungle_frontend/` - Hour Jungle 前端應用
- `jungle_chat_py/` - Jungle Chat AI 聊天服務

## ⚠️ 重要提醒：敏感憑證管理

### Google Cloud 憑證檔案
此專案需要 Google Cloud Service Account 憑證才能正常運作，但**憑證檔案已從 Git 儲存庫中移除**以確保安全。

**本地開發時**，請從本機備份中取得以下檔案並放置到對應位置：
- `AccountingFirm/gifthouse-438703-56f858f70c1f.json`

**請勿**將憑證檔案提交到 Git！`.gitignore` 已設定排除所有 `*.json` 憑證檔案。

## 環境設定

請參考各子專案的 README.md 了解詳細的環境設定說明。

## 上傳日期

2025-11-27
