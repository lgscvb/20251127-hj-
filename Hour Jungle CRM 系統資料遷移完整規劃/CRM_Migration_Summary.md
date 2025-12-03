# Hour Jungle CRM 資料遷移執行報告

**執行日期:** 2025-12-03  
**執行人:** Claude (Anthropic)  
**委託人:** 戴豪廷 (小戴)

---

## 📊 執行摘要

✅ **遷移狀態:** 資料轉換成功  
✅ **產出檔案:** 3 個 CSV + 1 個報告 + 2 個日誌  
⚠️ **需人工處理:** 部分異常資料需確認  

---

## 📈 資料統計

### 轉換成功筆數

| 資料類型 | 原始筆數 | 轉換後筆數 | 成功率 |
|---------|---------|-----------|--------|
| 客戶資料 | 358 | 287 | 80.2% |
| 合約資料 | 215 | 215 | 100% |
| 佣金資料 | 26 | 26 | 100% |

**說明:** 客戶資料因為"姓名"欄位為空值被篩除了 71 筆

### 資料完整度分析

#### 客戶資料 (287筆)
- ✅ 姓名: 100% (必填,已篩選)
- ⚠️ 統編: 48.1% (138/287)
- ⚠️ 身份證: 45.3% (130/287)
- ⚠️ 電話: 45.3% (130/287)
- ❌ Email: 1.7% (5/287) **嚴重不足**
- 🆗 生日: 46.0% (132/287)

**建議:**
1. **立即補充:** Email 是關鍵聯絡方式,需補齊
2. **分批補充:** 統編、身份證、電話至少補齊一個
3. **可選補充:** 生日資訊 (用於行銷)

#### 合約資料 (215筆)
- ✅ 活躍合約: 202 筆 (93.9%)
- 🕒 已到期: 13 筆 (6.1%)

**租金分布:**
- 最低: $1,000/月
- 最高: $12,825/月
- 平均: $2,144/月
- 中位數: $1,800/月

**異常值:** 最高租金 $12,825 需確認是否正確 (可能是多項服務合計)

#### 佣金資料 (26筆)
- ⚠️ 待付款: 25 筆 (96.2%)
- ✅ 已付款: 1 筆 (3.8%)
- 💰 待付總額: **$31,500**
- 💰 總佣金: $32,990

**重要:** 有 25 筆佣金尚未支付!建議盡快處理

---

## ⚠️ 資料品質問題清單

### 1. 日期格式異常 (已記錄但需人工確認)

**嚴重異常:**
- `11408/17` → 無法解析
- `11411/30` → 無法解析
- `114/0611` → 格式錯誤
- `114/09/` → 月份不完整
- `76//4/3` → 多個斜線

**建議:** 請開啟原始Excel,搜尋這些異常值,手動修正後重新執行

### 2. 電話號碼格式問題

**市話誤判為手機:**
- `04-26313952` → 台中市話
- `04-23023311` → 台中市話
- `02-29015606` → 台北市話
- `07-3870185` → 高雄市話

**手機號碼異常:**
- `098869363` → 9 位數 (少一碼)

**建議:** 
- 市話另外開欄位儲存
- 異常手機號碼需確認補齊

### 3. 統編格式異常

**無效統編:**
- `0071922` → 7 位數 (應為 8 位)
- `-` → 符號

**建議:** 需回查原始資料補正

### 4. 佣金簽約時間不完整

**缺少日期資訊:**
- `112/4` → 只有年月,沒有日
- `112/5` → 同上
- `112/05` → 同上

**影響:** 無法計算「簽約滿 6 個月」的傭金資格日期

**建議:** 
1. 若不確定日期,統一設為該月 1 日
2. 或是回查合約原件

---

## 📁 產出檔案說明

### 1. customers_transformed_20251203_080506.csv
**內容:** 287 筆客戶主檔資料  
**欄位:** 14 個標準化欄位  
**編碼:** UTF-8 with BOM  
**用途:** 匯入新系統 `customers` 表

**重要欄位說明:**
- `legacy_id`: 舊系統編號 (HQ-4, HR-V01)
- `location`: 場館 (headquarters/huanrui)
- `status`: 狀態 (active/churned)
- `customer_type`: 類型 (individual/sole_proprietorship/company)

### 2. contracts_transformed_20251203_080506.csv
**內容:** 215 筆合約資料  
**欄位:** 包含起迄日期、租金、押金、繳費方式等  
**用途:** 匯入新系統 `contracts` 表

**重要欄位說明:**
- `contract_type`: 合約類型 (virtual_office/coworking_fixed/coworking_flexible)
- `payment_cycle`: 繳費週期 (monthly/semi_annual/annual/biennial)
- `contract_status`: 合約狀態 (active/expired)
- `deposit_status`: 押金狀態 (not_refunded/refunded/unknown)

### 3. commissions_transformed_20251203_080506.csv
**內容:** 26 筆佣金記錄  
**用途:** 匯入新系統 `commission_payments` 表

**重要欄位說明:**
- `customer_name`: 客戶名稱 (需關聯到 customers)
- `referrer_name`: 介紹人 (需建立 accounting_firms 對應)
- `status`: 付款狀態 (pending/paid)

### 4. migration_report_20251203_080506.txt
**內容:** 資料品質摘要報告  
**用途:** 快速檢視遷移結果

### 5. migration_20251203_080505.log
**內容:** 詳細執行日誌,包含所有警告訊息  
**用途:** 追蹤異常資料、除錯

---

## 🔧 下一步行動清單

### 立即處理 (本週內)

#### □ **步驟 1: 檢查異常資料**
- [ ] 開啟原始 Excel,搜尋日期異常值
- [ ] 手動修正後重新執行 `python3 crm_etl.py`
- [ ] 確認市話/手機分類

#### □ **步驟 2: 補充缺失資料**
- [ ] 優先補充 Email (至少補到 50%)
- [ ] 確認 $12,825 高租金客戶
- [ ] 補齊佣金簽約完整日期

#### □ **步驟 3: 建立事務所對應表**
佣金資料中的「介紹人」需對應到具體事務所:

**發現的介紹人名單:**
1. 新平 (2筆)
2. 公信 (2筆)
3. 其他...

**建議做法:**
```sql
-- 建立事務所主表
CREATE TABLE accounting_firms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  firm_name VARCHAR(200),
  contact_person VARCHAR(100),
  -- ... 其他欄位
);

-- 插入常見事務所
INSERT INTO accounting_firms (firm_name, contact_person) VALUES
  ('新平會計師事務所', '新平'),
  ('公信會計師事務所', '公信');
```

然後請豪廷手動確認每筆佣金對應的完整事務所資訊。

### 中期處理 (2週內)

#### □ **步驟 4: 匯入資料庫**

修改 `crm_etl.py` 中的資料庫設定:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '你的密碼',
    'database': 'hour_jungle_crm',
    'charset': 'utf8mb4'
}
```

然後執行資料庫匯入:
```python
# 在 crm_etl.py 結尾新增
engine = create_engine(f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}")
customers_all.to_sql('customers', engine, if_exists='append', index=False)
contracts_all.to_sql('contracts', engine, if_exists='append', index=False)
# ...
```

#### □ **步驟 5: 建立客戶-合約關聯**

目前 `contracts` 資料還沒有關聯到 `customers.id`,需要:
1. 先匯入 `customers` 取得自增 ID
2. 用 `legacy_id` + `name` 比對建立關聯
3. 更新 `contracts.customer_id`

#### □ **步驟 6: 資料驗證**

執行 SQL 驗證腳本:
```sql
-- 檢查客戶數
SELECT COUNT(*) FROM customers WHERE status = 'active';  -- 應為 144

-- 檢查合約數
SELECT COUNT(*) FROM contracts WHERE contract_status = 'active';  -- 應為 202

-- 檢查待付佣金
SELECT SUM(commission_amount) FROM commission_payments WHERE status = 'pending';  -- 應為 31500

-- 檢查孤兒合約 (沒有客戶的合約)
SELECT * FROM contracts WHERE customer_id IS NULL;

-- 檢查重複客戶
SELECT name, company_name, COUNT(*) 
FROM customers 
GROUP BY name, company_name 
HAVING COUNT(*) > 1;
```

### 長期改善 (1個月內)

#### □ **步驟 7: 繳費記錄整合**

繳費表 (`2025_客戶繳費.xlsx`) 因為格式太亂,本次未處理。

**建議:**
1. 先用新系統記錄新的繳費
2. 舊的繳費記錄作為參考
3. 若需要完整歷史,請先整理 Excel 格式:
   - 統一欄位名稱 (移除 Unnamed)
   - 補齊客戶編號
   - 統一日期格式

#### □ **步驟 8: 建立資料輸入規範**

為避免未來再次出現資料品質問題:
1. **日期:** 統一用日期選擇器,禁止手動輸入
2. **金額:** 統一格式,禁止加單位
3. **繳費方式:** 下拉選單 (月繳/季繳/半年繳/年繳)
4. **統編:** 自動驗證 8 位數 + 呼叫財政部 API
5. **電話:** 分市話/手機兩欄,自動驗證格式

---

## 💡 系統設計建議 (基於實際資料)

### 1. 客戶來源追蹤加強

目前無法區分客戶來源,建議:
```python
# 在簽約時強制選擇
source_channel = [
  'accounting_firm',  # 事務所介紹 (需選擇具體事務所)
  'ga_ads',           # GA 廣告
  'facebook',         # FB 廣告
  'referral',         # 客戶轉介 (需選擇客戶)
  'seo',              # 自然流量
  'others'            # 其他
]
```

### 2. 押金管理流程

發現押金狀態混亂 (未退/已退/不明),建議:
- 簽約時: `deposit_status = 'not_refunded'`
- 合約結束時: 自動提醒「押金是否已退?」
- 退款後: 更新為 `deposit_status = 'refunded'` + 記錄退款日期/方式

### 3. 繳費方式標準化

目前繳費方式編碼不一致 (Y/y/M/6M/6m...),建議:
- 前端用中文顯示: 「月繳」「半年繳」「年繳」
- 後端統一儲存: `monthly`, `semi_annual`, `annual`
- 禁止手動輸入,只能從選單選

### 4. 合約到期自動提醒

發現有 13 筆已到期合約,建議:
```python
# 每日凌晨執行
expired_contracts = Contract.objects.filter(
    end_date__lt=today,
    contract_status='active'
)
for contract in expired_contracts:
    # 1. 更新狀態為 expired
    # 2. 發送 LINE 通知
    # 3. 詢問是否續約
```

### 5. 佣金自動計算系統

發現 25 筆待付佣金,總額 $31,500,建議:
```python
# 每日凌晨檢查
contracts_half_year = Contract.objects.filter(
    start_date=today - timedelta(days=180),
    status='active'
)
for contract in contracts_half_year:
    if contract.customer.source_channel == 'accounting_firm':
        # 建立佣金記錄
        commission = Commission.objects.create(
            accounting_firm=contract.customer.referrer,
            amount=contract.monthly_rent * 1,  # 1 個月租金
            status='eligible'
        )
        # 發送 LINE 通知管理員
```

---

## 📞 需要確認的事項

### 請豪廷回答以下問題:

1. **Email 不足問題**
   - Q: 只有 1.7% 客戶有 Email,是否需要補齊?
   - A: [   ]

2. **市話處理方式**
   - Q: 市話要儲存在 `phone` 欄位還是新增 `landline` 欄位?
   - A: [   ]

3. **最高租金確認**
   - Q: $12,825/月 的客戶是否正確? (編號待查)
   - A: [   ]

4. **佣金支付計畫**
   - Q: $31,500 待付佣金何時支付?
   - A: [   ]

5. **事務所對應表**
   - Q: 「新平」、「公信」的完整事務所名稱?
   - A: [   ]

6. **歷史繳費記錄**
   - Q: 是否需要完整匯入歷史繳費? (需先整理 Excel)
   - A: [   ]

7. **資料庫環境**
   - Q: 新系統資料庫已建立? (host/user/password)
   - A: [   ]

---

## 📌 重要提醒

### ⚠️ 匯入前務必備份

```bash
# 備份原始 Excel
cp 客戶資料表crm.xlsx backup_客戶資料表crm_20251203.xlsx
cp 環瑞客戶資料表crm.xlsx backup_環瑞客戶資料表crm_20251203.xlsx

# 備份資料庫 (匯入前)
mysqldump -u root -p hour_jungle_crm > backup_before_import_20251203.sql
```

### ✅ 驗證清單

匯入後逐項確認:
- [ ] 客戶總數 = 287
- [ ] 活躍客戶 = 144
- [ ] 活躍合約 = 202
- [ ] 待付佣金 = 25 筆 ($31,500)
- [ ] 隨機抽查 10 筆客戶資料正確性
- [ ] 檢查最高/最低租金客戶
- [ ] 確認所有合約都有關聯到客戶

---

## 📧 聯絡資訊

如有任何問題,請聯絡:
- **執行者:** Claude (Anthropic)
- **通過:** LINE / Email

**報告結束**
