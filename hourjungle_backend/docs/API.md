# Jungle CRM API Documentation

> Base URL: `https://your-domain.com/api`

## Authentication

使用 Token 認證：
- Header: `Authorization: Bearer <token>`
- Token 在登入成功後返回

---

## Auth (認證)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | 後台登入 |
| POST | `/logout` | 登出 |
| POST | `/member/register` | 前端會員註冊 |
| POST | `/member/forgot-password` | 忘記密碼 |
| POST | `/member/reset-password` | 重設密碼 |
| POST | `/member/update-password` | 修改密碼 |

### POST /login
```json
{
  "account": "admin",
  "password": "123456"
}
```

### Response
```json
{
  "status": true,
  "message": "登入成功",
  "data": {
    "id": 1,
    "account": "admin",
    "token": "xxx",
    "permissions": [...]
  }
}
```

---

## Members (用戶管理)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-all-members` | 取得所有用戶 |
| GET | `/create-member-info` | 取得建立用戶所需資訊 |
| POST | `/create-member` | 建立用戶 |
| POST | `/update-member` | 更新用戶 |
| POST | `/delete-member` | 刪除用戶 |
| POST | `/get-memberinfo` | 取得用戶詳情 |
| POST | `/update-member-password` | 修改用戶密碼 |
| POST | `/reset-member-password` | 重設用戶密碼 |

---

## Permissions & Roles (權限/角色)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/permissions` | 取得所有權限 |
| GET | `/roles` | 取得所有角色 |
| POST | `/create-permission` | 建立權限 |
| POST | `/create-role` | 建立角色 |
| POST | `/delete-permission` | 刪除權限 |
| POST | `/delete-role` | 刪除角色 |
| POST | `/modify-role` | 修改角色 |
| POST | `/create-or-update-role-permission` | 設定角色權限 |

---

## Branches (場館管理)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-branch-list` | 取得場館列表 |
| POST | `/get-branch-info` | 取得場館詳情 |
| POST | `/create-branch` | 建立場館 |
| POST | `/update-branch` | 更新場館 |
| POST | `/delete-branch` | 刪除場館 |

---

## Customers (客戶管理)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-customers-list` | 取得客戶列表 |
| POST | `/create-customer` | 建立客戶 |
| POST | `/update-customer` | 更新客戶 |
| POST | `/delete-customer` | 刪除客戶 |
| POST | `/get-customer-info` | 取得客戶詳情 |
| GET | `/export-customers` | 匯出客戶 |
| GET | `/export-customers-example` | 匯出客戶範例 |
| POST | `/import-customers` | 匯入客戶 |

### Query Parameters (GET /get-customers-list)
- `per_page`: 每頁筆數 (default: 10)
- `keyword`: 搜尋關鍵字
- `branch_id`: 場館 ID

---

## Business Items (業務項目)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-business-item-list` | 取得業務項目列表 |
| POST | `/create-business-item` | 建立業務項目 |
| POST | `/update-business-item` | 更新業務項目 |
| POST | `/delete-business-item` | 刪除業務項目 |
| POST | `/get-business-item-info` | 取得業務項目詳情 |
| GET | `/export-business-items` | 匯出業務項目 |
| GET | `/export-business-items-example` | 匯出範例 |
| POST | `/import-business-items` | 匯入業務項目 |

---

## Projects (合約管理)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-project-list` | 取得合約列表 |
| POST | `/create-project` | 建立合約 |
| POST | `/update-project` | 更新合約 |
| POST | `/delete-project` | 刪除合約 |
| POST | `/get-project-info` | 取得合約詳情 |
| GET | `/public/project/{id}` | 公開合約資訊 |
| POST | `/confirm-contract` | 確認合約 |
| POST | `/upload-contract-pdf` | 上傳合約 PDF |
| GET | `/download-contract/{projectId}` | 下載合約 |
| GET | `/contract-pdf/{projectId}` | 取得合約 PDF |
| GET | `/export-projects` | 匯出合約 |
| GET | `/export-projects-example` | 匯出範例 |
| POST | `/import-projects` | 匯入合約 |

---

## Payment History (繳費歷程)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-payment-history` | 建立繳費記錄 |
| GET | `/get-payment-history-list` | 取得繳費歷程 |

---

## System Settings (系統設定)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-config` | 取得系統設定 |
| POST | `/update-config` | 更新系統設定 |
| GET | `/get-line-bot-list` | 取得 LINE Bot 設定 |
| POST | `/update-line-bot` | 更新 LINE Bot 設定 |
| GET | `/get-system-log` | 取得系統日誌 |
| GET | `/dashboard` | 取得儀表板數據 |

---

## LINE Bot

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/{botId?}` | LINE Webhook |
| POST | `/send-message` | 發送訊息 |
| POST | `/broadcast` | 廣播訊息 |
| POST | `/send-line-message` | 發送 LINE 訊息 |
| POST | `/create-customer-user` | 建立客戶用戶 |
| POST | `/get-customer-user` | 取得客戶用戶 |

---

## Bills (發票管理)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bills` | 取得發票列表 |
| GET | `/bills/{id}` | 取得發票詳情 |
| POST | `/bills` | 建立發票 |
| PUT | `/bills/{id}` | 更新發票 |
| DELETE | `/bills/{id}` | 刪除發票 |

---

## Brain AI 整合 API

供 Brain AI 系統調用的 API 端點，用於查詢客戶資料、合約狀態等。

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/brain/customer/{lineUserId}` | 透過 LINE userId 查詢客戶資料 |
| GET | `/brain/customer/{lineUserId}/contracts` | 查詢客戶所有合約 |
| GET | `/brain/customer/{lineUserId}/payments` | 查詢客戶繳費記錄 |
| POST | `/brain/leads` | 建立潛在客戶（Brain 轉交） |
| POST | `/brain/interactions` | 記錄客戶互動 |

### GET /brain/customer/{lineUserId}

查詢客戶基本資料、合約列表、繳費狀態。

#### Response
```json
{
  "status": true,
  "message": "查詢成功",
  "data": {
    "id": 1,
    "name": "王小明",
    "phone": "0912345678",
    "email": "example@email.com",
    "company_name": "範例公司",
    "company_number": "12345678",
    "line_id": "U1234567890abcdef",
    "line_nickname": "小明",
    "contracts": [
      {
        "id": 1,
        "project_name": "營登地址",
        "contract_type": "monthly",
        "start_day": "2024-01-01",
        "end_day": "2024-12-31",
        "status": "active",
        "next_pay_day": "2024-02-01",
        "current_payment": 3000
      }
    ],
    "payment_status": {
      "overdue": false,
      "upcoming": true,
      "upcoming_date": "2024-02-01",
      "upcoming_amount": 3000
    }
  }
}
```

### POST /brain/leads

Brain 建立潛在客戶。

#### Request Body
```json
{
  "line_user_id": "U1234567890abcdef",
  "display_name": "新客戶",
  "inquiry_type": "registration",
  "notes": "詢問營業登記"
}
```

### POST /brain/interactions

記錄客戶互動。

#### Request Body
```json
{
  "line_user_id": "U1234567890abcdef",
  "interaction_type": "message",
  "content": "客戶詢問價格"
}
```

---

## Response Format

### Success
```json
{
  "status": true,
  "message": "操作成功",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "status": true,
  "message": "獲取成功",
  "data": [...],
  "current_page": 1,
  "per_page": 10,
  "total": 100
}
```

### Error
```json
{
  "status": false,
  "message": "錯誤訊息"
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | 成功 |
| 400 | 請求錯誤 |
| 401 | 未登入 |
| 404 | 找不到資源 |
| 500 | 伺服器錯誤 |
