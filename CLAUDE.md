# CLAUDE.md

本檔案為 Claude Code (claude.ai/code) 在此專案中的操作指南。

## 專案概覽

Jungle Group 是一個 monorepo，包含多個子專案，服務於辦公室租賃與會計師事務所業務：

| 子專案 | 說明 | 技術棧 | 完成度 |
|--------|------|--------|--------|
| `hourjungle_backend/` | 後端 API 服務 | Laravel / PHP | 85% |
| `hourjungle_frontend/` | Dashboard 前端應用 | React / Vite / Material Tailwind | 70% |
| `AccountingFirm/` | 發票 OCR 辨識與解析服務 | Flask / Python | 90% |
| `jungle_chat_py/` | AI 智能客服聊天機器人 | FastAPI / Gemini / Pinecone | 80% |

---

## MVP 上線進度

### 已完成
- [x] 修復 LINE 簽名驗證安全漏洞 (2024-12-01)
- [x] 確認本地運行環境 (2024-12-01)

### 待完成
- [ ] 準備 GCP VM 部署配置
- [ ] 設定 Nginx + SSL (等 DNS 通過)
- [ ] 部署 Laravel 後端
- [ ] 部署 React 前端
- [ ] 設定 LINE Webhook

---

## 本地開發測試帳號

| Email | 密碼 | 角色 |
|-------|------|------|
| `admin@example.com` | `admin` | 管理員 |
| `aa1111@example.com` | `aa1111` | 一般使用者 |
| `demo01@example.com` | `123456` | Demo |

**本地服務網址：**
- 後端 API：http://localhost:8000
- 前端 Dashboard：http://localhost:3000

### 已知問題
1. **前端 Excel 匯入** - `hourjungle_frontend/src/pages/dashboard/cust.jsx` 有 TODO 未完成
2. **Email 通知** - 資料庫有欄位但未實作發送服務

---

## 外部服務整合

| 服務 | 狀態 | 環境變數 |
|------|------|----------|
| LINE Bot | ✅ 已整合 | `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` |
| Google Cloud Vision | ✅ 已整合 | `GOOGLE_CLOUD_API_KEY` |
| Pinecone | ✅ 已整合 | `PINECONE_API_KEY`, `PINECONE_HOST` |
| Google Gemini | ✅ 已整合 | `GOOGLE_API_KEY` |
| Email (SMTP) | ❌ 未整合 | - |
| 金流 (ECPay) | ❌ 未整合 | - |

## 開發指令

### AccountingFirm (Flask OCR 服務)
```bash
cd AccountingFirm
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py  # 執行於 port 5001
```

### jungle_chat_py (AI 聊天服務)
```bash
cd jungle_chat_py
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
API 文件：http://localhost:8001/docs

### hourjungle_backend (Laravel)
```bash
cd hourjungle_backend
composer install
php artisan key:generate
php artisan migrate:fresh
php artisan serve
```

### hourjungle_frontend (React)
```bash
cd hourjungle_frontend
npm install
npm run dev          # 開發伺服器
npm run build        # 正式環境建置
npm run server       # JSON mock 伺服器 (port 3001)
```

## 環境設定

1. 複製 `.env.example` 至專案根目錄的 `.env`
2. 必要的 API 金鑰：

| 環境變數 | 用途 |
|----------|------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud 服務帳號憑證 JSON 路徑 |
| `GOOGLE_CLOUD_API_KEY` | AccountingFirm OCR 服務 |
| `PINECONE_API_KEY`, `PINECONE_ENV`, `PINECONE_HOST` | jungle_chat_py 向量資料庫 |
| `GOOGLE_API_KEY` | jungle_chat_py Gemini AI |

## 架構說明

### AccountingFirm
| 檔案 | 功能 |
|------|------|
| `app.py` | Flask 伺服器，提供 `/api/upload` 發票處理端點 |
| `ocr_service.py` | Google Cloud Vision OCR 整合 |
| `image_processor.py` | 圖片預處理（adaptive、deskew 方法） |
| `invoice_parser.py` | 從 OCR 文字擷取結構化發票資料 |
| `continuous_learning.py` | 反饋資料收集，用於模型改進 |

### jungle_chat_py
| 檔案 | 功能 |
|------|------|
| `app/api/routes.py` | FastAPI 路由定義 |
| `app/services/ai_service.py` | Gemini AI 聊天回覆整合 |
| `app/services/vector_store.py` | Pinecone 向量資料庫（RAG 模式） |

- 向量維度：1024（使用 `paraphrase-multilingual-mpnet-base-v2` 模型）

### hourjungle_frontend
- React 18 + Vite + Material Tailwind + Redux Toolkit
- Dashboard 風格 UI，側邊欄導航
- 主要功能：記帳管理、報稅管理、客戶資料管理、憑證管理
