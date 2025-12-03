# Hour Jungle CRM 系統資料遷移完整規劃

## 📊 現有資料盤點

### 資料來源
1. **客戶資料表crm.xlsx** (主館 - 台灣大道)
   - 總表: 146 筆客戶
   - 已結束: 142 筆歷史客戶
   - 佣金: 18 筆佣金記錄

2. **環瑞客戶資料表crm.xlsx** (環瑞館)
   - 環瑞CRM: 69 筆客戶
   - 已結束: 1 筆歷史客戶
   - 佣金: 8 筆佣金記錄

3. **2025_客戶繳費.xlsx** + **2026客戶繳費.xlsx**
   - 按月份分工作表 (1-12月)
   - 繳費記錄不完整

**總計需遷移:**
- 活躍客戶: 215 筆
- 歷史客戶: 143 筆
- 佣金記錄: 26 筆
- 繳費記錄: 需整合統計

---

## 🔍 資料品質問題發現

### 嚴重問題 (必須處理)

#### 1. 欄位命名不一致
**主館 vs 環瑞:**
| 主館 | 環瑞 | 建議標準化 |
|------|------|-----------|
| 公司 | 公司名稱 | company_name |
| Co number | 統編 | tax_id |
| 類別 | 類別 | customer_type |

#### 2. 日期格式混亂
**發現的格式:**
- `113/06/05` (民國年)
- `114/04/08` (民國年)
- `2025-01-06 00:00:00` (datetime物件)
- `10/6/8` (???)
- `11408/17` (錯誤輸入)

**需要統一為:** `YYYY-MM-DD` (西元年)

#### 3. 金額格式不一致
**發現的格式:**
- `1800/m` (字串)
- `12000/m` (字串)
- `21600` (數字)
- `21600.0` (浮點數)

**需要分離:** 金額 + 週期

#### 4. 繳費方式編碼不一致
**發現的值:**
- `Y` / `y` (一年?)
- `M` (月繳?)
- `6M` / `6m` (半年繳?)
- `2Y` / `2y` (兩年?)
- `110/6/8` (???)

**需要標準化**

#### 5. 押金欄位混亂
**發現的格式:**
- `22000/未退`
- `3000/未退`
- `6000/未退`
- `N`
- `n`
- `Y`
- 空值

**需要拆分:** 押金金額 + 退款狀態

#### 6. 大量缺失值
**缺失率 >50% 的欄位:**
- 標註: 87% 缺失
- 行業備註: 71% 缺失
- 置物櫃: 96% 缺失
- Mail: 97% 缺失
- 生日: 25% 缺失
- Id number: 23% 缺失

#### 7. 統編格式不統一
**發現的格式:**
- `87279184` (8位數字)
- `60209751.0` (浮點數)
- `N` (???)
- 空值

#### 8. 繳費表格結構混亂
- 欄位名稱都是 `Unnamed: 0` ~ `Unnamed: 6`
- 大量空白行
- 實際繳費日/金額大多是空值
- 無法關聯到客戶主檔 (沒有清楚的ID)

---

## 🗺️ 欄位對應表 (Mapping Table)

### A. 客戶主檔 → customers 表

| 舊欄位名稱 | 主館 | 環瑞 | 新欄位名稱 | 資料型態 | 清洗規則 |
|-----------|------|------|-----------|---------|---------|
| 編號 | ✓ | ✓ | legacy_id | VARCHAR(20) | 保留原始編號,加前綴 HQ-/HR- |
| 姓名 | ✓ | ✓ | name | VARCHAR(100) | 去空白,必填 |
| 公司/公司名稱 | ✓ | ✓ | company_name | VARCHAR(200) | 空值時填"個人" |
| 類別 | ✓ | ✓ | business_type | ENUM | 映射規則見下表 |
| 項目 | ✓ | ✓ | contract_type | ENUM | 映射規則見下表 |
| Co number/統編 | ✓ | ✓ | company_tax_id | VARCHAR(8) | 轉字串,去小數點,驗證8位數 |
| Id number | ✓ | ✓ | id_number | VARCHAR(10) | 轉大寫,驗證格式 |
| 生日 | ✓ | ✓ | birthday | DATE | 轉西元年,格式統一 |
| Add | ✓ | ✓ | address | TEXT | 保留 |
| 聯絡電話 | ✓ | ✓ | phone | VARCHAR(20) | 轉字串,去除非數字 |
| Mail | ✓ | ✓ | email | VARCHAR(100) | 驗證格式 |
| 行業備註 | ✓ | ✓ | industry_notes | TEXT | 保留 |

### B. 合約相關 → contracts 表

| 舊欄位名稱 | 新欄位名稱 | 清洗規則 |
|-----------|-----------|---------|
| 起始日期 | start_date | 轉西元年 YYYY-MM-DD |
| 合約到期日 | end_date | 轉西元年 YYYY-MM-DD |
| 簽約日期 | signed_at | 轉西元年 YYYY-MM-DD |
| 繳費方式 | payment_cycle | 見下方映射規則 |
| 金額 | monthly_rent | 提取數字部分,去除 "/m" |
| 押金 | deposit | 提取數字部分,去除 "未退" |
| 標註 | notes | 保留為備註 |
| 置物櫃 | addon_services | 若有值,加入 JSON 加值服務 |

### C. 佣金相關 → commission_payments 表

| 舊欄位名稱 | 新欄位名稱 | 清洗規則 |
|-----------|-----------|---------|
| 客戶 | customer_name | 需關聯到 customers 表 |
| 介紹人 | referrer_name | 需建立 accounting_firms 表 |
| 簽約時間 | contract_start | 轉西元年 |
| 金額 | commission_amount | 提取數字部分 |
| 佣金給付日期 | paid_at | 轉西元年,若 "佣金已付" 則標記 paid |

### D. 繳費記錄 → payments 表

| 舊欄位名稱 | 新欄位名稱 | 清洗規則 |
|-----------|-----------|---------|
| Unnamed: 0 | legacy_customer_id | 嘗試關聯 |
| Unnamed: 1 | customer_name | 用於關聯 |
| 繳費日 | paid_at | 轉西元年 |
| 繳費金額 | amount | 數字格式 |
| 下次繳費日 | next_due_date | 轉西元年 |
| line 記事本 | notes | 保留 |
| 發票 | invoice_status | ✔️ = issued |

---

## 📋 資料清洗規則詳細定義

### 1. 類別 (business_type) 映射

| 舊值 | 新值 | 說明 |
|------|------|------|
| 空值 / NaN | individual | 個人客戶 |
| 行號 | sole_proprietorship | 行號 |
| 公司 | company | 公司 |
| N | individual | 個人 |

### 2. 項目 (contract_type) 映射

| 舊值 | 新值 | 說明 |
|------|------|------|
| 營登 | virtual_office | 虛擬辦公室 |
| 自由座 | coworking_flexible | 共享空間自由座 |
| 辦公室A / 辦公室 | coworking_fixed | 共享空間固定座 |
| 空值 | virtual_office | 預設為營登 |

### 3. 繳費方式 (payment_cycle) 映射

| 舊值 | 新值 | 說明 |
|------|------|------|
| Y / y | annual | 年繳 |
| M | monthly | 月繳 |
| 6M / 6m | semi_annual | 半年繳 |
| 2Y / 2y | biennial | 兩年繳 |
| 空值 | monthly | 預設月繳 |
| 其他日期格式 | monthly | 異常值預設月繳 |

### 4. 日期轉換規則

```python
def convert_date(date_str):
    """
    統一日期格式為 YYYY-MM-DD
    
    處理格式:
    - 113/06/05 → 2024-06-05 (民國 +1911)
    - 114/04/08 → 2025-04-08
    - 2025-01-06 00:00:00 → 2025-01-06
    - 10/6/8 → 拆解後 +1911
    - NaT / NaN → NULL
    """
    if pd.isna(date_str):
        return None
    
    # 已是 datetime 物件
    if isinstance(date_str, pd.Timestamp):
        return date_str.strftime('%Y-%m-%d')
    
    # 字串處理
    date_str = str(date_str).strip()
    
    # 民國年格式 113/06/05
    if '/' in date_str:
        parts = date_str.split('/')
        year = int(parts[0]) + 1911  # 轉西元
        month = int(parts[1])
        day = int(parts[2])
        return f"{year:04d}-{month:02d}-{day:02d}"
    
    # ISO格式
    if '-' in date_str:
        return date_str.split(' ')[0]  # 去除時間部分
    
    # 無法解析
    return None
```

### 5. 金額提取規則

```python
def extract_amount(amount_str):
    """
    從 "1800/m" 提取 1800
    從 "12000/m" 提取 12000
    從 21600 直接返回
    """
    if pd.isna(amount_str):
        return None
    
    # 已是數字
    if isinstance(amount_str, (int, float)):
        return int(amount_str)
    
    # 字串處理
    amount_str = str(amount_str).strip()
    
    # 提取數字部分
    import re
    match = re.search(r'(\d+)', amount_str)
    if match:
        return int(match.group(1))
    
    return None
```

### 6. 押金拆分規則

```python
def parse_deposit(deposit_str):
    """
    從 "6000/未退" 拆分為
    amount: 6000, status: 'not_refunded'
    
    從 "Y" / "N" 處理為
    amount: NULL, status: 'unknown'
    """
    if pd.isna(deposit_str):
        return None, 'unknown'
    
    deposit_str = str(deposit_str).strip()
    
    # 數字 + 狀態格式
    if '/' in deposit_str:
        parts = deposit_str.split('/')
        amount = int(parts[0])
        status = 'not_refunded' if '未退' in parts[1] else 'refunded'
        return amount, status
    
    # Y/N 格式
    if deposit_str.upper() in ['Y', 'N']:
        return None, 'unknown'
    
    # 純數字
    if deposit_str.isdigit():
        return int(deposit_str), 'not_refunded'
    
    return None, 'unknown'
```

### 7. 統編清洗規則

```python
def clean_tax_id(tax_id):
    """
    統一為8位數字字串
    87279184 → "87279184"
    60209751.0 → "60209751"
    N → NULL
    """
    if pd.isna(tax_id):
        return None
    
    tax_id = str(tax_id).strip()
    
    # 移除小數點
    if '.' in tax_id:
        tax_id = tax_id.split('.')[0]
    
    # 驗證是否為8位數字
    if tax_id.isdigit() and len(tax_id) == 8:
        return tax_id
    
    # 非標準格式
    if tax_id.upper() in ['N', 'NAN']:
        return None
    
    return None
```

### 8. 電話清洗規則

```python
def clean_phone(phone):
    """
    0910606816 → "0910606816"
    933189163.0 → "0933189163" (補0)
    """
    if pd.isna(phone):
        return None
    
    phone = str(phone).strip()
    
    # 移除小數點
    if '.' in phone:
        phone = phone.split('.')[0]
    
    # 移除非數字
    phone = re.sub(r'\D', '', phone)
    
    # 若為9位數且開頭為9,補0
    if len(phone) == 9 and phone[0] == '9':
        phone = '0' + phone
    
    # 驗證手機號碼格式 09XXXXXXXX
    if len(phone) == 10 and phone.startswith('09'):
        return phone
    
    return None
```

---

## 🔧 ETL 處理流程

### Phase 1: 資料抽取 (Extract)

```python
# 1. 讀取所有Excel檔案
df_hq_active = pd.read_excel('客戶資料表crm.xlsx', sheet_name='總表')
df_hq_closed = pd.read_excel('客戶資料表crm.xlsx', sheet_name='已結束')
df_hq_commission = pd.read_excel('客戶資料表crm.xlsx', sheet_name='佣金')

df_hr_active = pd.read_excel('環瑞客戶資料表crm.xlsx', sheet_name='環瑞CRM')
df_hr_closed = pd.read_excel('環瑞客戶資料表crm.xlsx', sheet_name='已結束')
df_hr_commission = pd.read_excel('環瑞客戶資料表crm.xlsx', sheet_name='佣金')

# 2. 讀取繳費表 (12個月份)
payments_2025 = {}
payments_2026 = {}
for month in range(1, 13):
    payments_2025[month] = pd.read_excel('2025_客戶繳費.xlsx', sheet_name=f'{month}月')
    payments_2026[month] = pd.read_excel('2026客戶繳費.xlsx', sheet_name=f'{month}月')
```

### Phase 2: 資料轉換 (Transform)

```python
# 步驟 1: 清洗客戶主檔
def transform_customer(df, location_prefix):
    """
    轉換客戶資料
    location_prefix: 'HQ' 或 'HR'
    """
    df_clean = df.copy()
    
    # 1. 建立 legacy_id
    df_clean['legacy_id'] = location_prefix + '-' + df_clean['編號'].astype(str)
    
    # 2. 清洗姓名 (必填)
    df_clean['name'] = df_clean['姓名'].str.strip()
    df_clean = df_clean[df_clean['name'].notna()]
    
    # 3. 清洗公司名稱
    df_clean['company_name'] = df_clean['公司'].fillna('個人')
    
    # 4. 清洗統編
    df_clean['company_tax_id'] = df_clean['Co number'].apply(clean_tax_id)
    
    # 5. 清洗身份證字號
    df_clean['id_number'] = df_clean['Id number'].str.upper()
    
    # 6. 轉換日期
    df_clean['birthday'] = df_clean['生日'].apply(convert_date)
    
    # 7. 清洗電話
    df_clean['phone'] = df_clean['聯絡電話'].apply(clean_phone)
    
    # 8. 映射類別
    df_clean['customer_type'] = df_clean['類別'].map({
        '行號': 'sole_proprietorship',
        '公司': 'company',
        'N': 'individual'
    }).fillna('individual')
    
    # 9. 清洗地址
    df_clean['address'] = df_clean['Add']
    
    # 10. Email
    df_clean['email'] = df_clean['Mail']
    
    # 11. 行業備註
    df_clean['industry_notes'] = df_clean['行業備註']
    
    return df_clean

# 步驟 2: 清洗合約資料
def transform_contract(df):
    """轉換合約資料"""
    df_clean = df.copy()
    
    # 1. 日期轉換
    df_clean['start_date'] = df_clean['起始日期'].apply(convert_date)
    df_clean['end_date'] = df_clean['合約到期日'].apply(convert_date)
    df_clean['signed_at'] = df_clean['簽約日期'].apply(convert_date)
    
    # 2. 金額提取
    df_clean['monthly_rent'] = df_clean['金額'].apply(extract_amount)
    
    # 3. 押金拆分
    df_clean[['deposit', 'deposit_status']] = df_clean['押金'].apply(
        lambda x: pd.Series(parse_deposit(x))
    )
    
    # 4. 繳費方式映射
    payment_cycle_map = {
        'Y': 'annual', 'y': 'annual',
        'M': 'monthly',
        '6M': 'semi_annual', '6m': 'semi_annual',
        '2Y': 'biennial', '2y': 'biennial'
    }
    df_clean['payment_cycle'] = df_clean['繳費方式'].map(payment_cycle_map).fillna('monthly')
    
    # 5. 合約類型映射
    contract_type_map = {
        '營登': 'virtual_office',
        '自由座': 'coworking_flexible',
        '辦公室A': 'coworking_fixed',
        '辦公室': 'coworking_fixed'
    }
    df_clean['contract_type'] = df_clean['項目'].map(contract_type_map).fillna('virtual_office')
    
    # 6. 合約狀態
    # 若在「已結束」工作表 → terminated
    # 若在「總表」且到期日 < 今天 → expired
    # 若在「總表」且到期日 >= 今天 → active
    
    return df_clean

# 步驟 3: 清洗佣金資料
def transform_commission(df):
    """轉換佣金資料"""
    df_clean = df.copy()
    
    # 1. 提取金額
    df_clean['commission_amount'] = df_clean['金額'].apply(extract_amount)
    
    # 2. 轉換日期
    df_clean['contract_start'] = df_clean['簽約時間'].apply(convert_date)
    
    # 3. 付款狀態
    df_clean['status'] = df_clean['佣金給付日期'].apply(
        lambda x: 'paid' if (pd.notna(x) and '已付' in str(x)) else 'pending'
    )
    
    # 4. 轉換付款日期
    df_clean['paid_at'] = df_clean['佣金給付日期'].apply(
        lambda x: convert_date(x) if (pd.notna(x) and '已付' not in str(x)) else None
    )
    
    return df_clean
```

### Phase 3: 資料載入 (Load)

```python
# 1. 寫入 customers 表
customers_hq = transform_customer(df_hq_active, 'HQ')
customers_hr = transform_customer(df_hr_active, 'HR')
customers_all = pd.concat([customers_hq, customers_hr], ignore_index=True)

# INSERT INTO customers...

# 2. 寫入 contracts 表
contracts_hq = transform_contract(df_hq_active)
contracts_hr = transform_contract(df_hr_active)
contracts_all = pd.concat([contracts_hq, contracts_hr], ignore_index=True)

# INSERT INTO contracts...

# 3. 寫入 commission_payments 表
# (需要先建立 accounting_firms 表)

# 4. 寫入 payments 表
# (從繳費表整合)
```

---

## ✅ 資料驗證檢查清單

### 遷移前驗證

□ **資料完整性檢查**
  - [ ] 確認所有Excel檔案可正常開啟
  - [ ] 確認工作表名稱正確
  - [ ] 統計總行數與預期相符
  - [ ] 檢查是否有隱藏的工作表

□ **必要欄位檢查**
  - [ ] 姓名欄位缺失率 < 5%
  - [ ] 公司/統編至少一個有值
  - [ ] 起始日期有值的比例 > 80%

□ **資料格式初步檢查**
  - [ ] 日期欄位格式統計
  - [ ] 金額欄位格式統計
  - [ ] 電話號碼格式統計

### 遷移後驗證

□ **資料筆數驗證**
  ```sql
  -- 1. 客戶筆數
  SELECT 
    '總客戶數' as item,
    COUNT(*) as count,
    215 as expected
  FROM customers;
  
  -- 2. 活躍合約數
  SELECT 
    '活躍合約' as item,
    COUNT(*) as count
  FROM contracts 
  WHERE contract_status = 'active';
  
  -- 3. 佣金記錄
  SELECT 
    '佣金記錄' as item,
    COUNT(*) as count,
    26 as expected
  FROM commission_payments;
  ```

□ **資料完整性驗證**
  ```sql
  -- 1. 必填欄位檢查
  SELECT 
    COUNT(*) as total,
    COUNT(name) as has_name,
    COUNT(phone) as has_phone
  FROM customers;
  
  -- 2. 外鍵關聯檢查
  SELECT 
    c.id,
    c.customer_id,
    cust.name
  FROM contracts c
  LEFT JOIN customers cust ON c.customer_id = cust.id
  WHERE cust.id IS NULL;
  ```

□ **業務邏輯驗證**
  ```sql
  -- 1. 合約期間檢查 (end_date 應該 > start_date)
  SELECT id, start_date, end_date
  FROM contracts
  WHERE end_date <= start_date;
  
  -- 2. 租金合理性檢查
  SELECT id, monthly_rent
  FROM contracts
  WHERE monthly_rent < 1000 OR monthly_rent > 20000;
  
  -- 3. 押金合理性檢查
  SELECT id, deposit, monthly_rent
  FROM contracts
  WHERE deposit < monthly_rent * 0.5 OR deposit > monthly_rent * 5;
  ```

□ **資料品質抽查**
  - [ ] 隨機抽查20筆客戶,人工比對原始Excel
  - [ ] 檢查日期轉換是否正確 (民國 → 西元)
  - [ ] 檢查金額提取是否正確
  - [ ] 檢查電話號碼格式

□ **異常值報告**
  ```sql
  -- 產生異常值報告
  SELECT 
    'phone_invalid' as issue,
    COUNT(*) as count
  FROM customers
  WHERE phone IS NOT NULL 
    AND (LENGTH(phone) != 10 OR LEFT(phone, 2) != '09');
  ```

---

## 🚨 遷移風險與應對

### 高風險項目

1. **繳費表無法關聯到客戶**
   - **風險:** 繳費表的 Unnamed: 0 (編號) 可能與客戶主檔不一致
   - **應對:** 
     - 先用編號嘗試關聯
     - 失敗則用姓名 + 公司名稱模糊比對
     - 最後剩餘的建立「待確認繳費記錄」表

2. **佣金無法追溯到事務所**
   - **風險:** 「介紹人」欄位只有名字,沒有完整事務所資訊
   - **應對:**
     - 建立「介紹人 → 事務所」對應表
     - 先讓豪廷手動確認這26筆介紹人對應哪些事務所
     - 未來新增事務所master table

3. **日期異常值**
   - **風險:** `11408/17` 這種錯誤日期
   - **應對:**
     - 記錄異常日期清單
     - 人工確認後修正
     - 實在無法確認的設為NULL

### 中風險項目

4. **客戶重複問題**
   - **風險:** 同一客戶可能在兩個館都有紀錄
   - **應對:**
     - 用 (姓名 + 統編) 或 (姓名 + 電話) 比對
     - 發現重複時合併為一筆客戶,但保留兩份合約

5. **歷史資料不完整**
   - **風險:** 「已結束」工作表資料較少
   - **應對:**
     - 先遷移活躍客戶
     - 歷史客戶設為 status='churned'
     - 標記「資料來源為舊系統」

---

## 📅 遷移時程規劃

### Week 1: 準備階段
- Day 1-2: 確認欄位對應表
- Day 3-4: 開發 ETL 腳本
- Day 5: 測試環境試跑

### Week 2: 執行階段
- Day 1: 遷移客戶主檔
- Day 2: 遷移合約資料
- Day 3: 遷移佣金資料
- Day 4: 遷移繳費記錄 (盡力而為)
- Day 5: 資料驗證

### Week 3: 驗證階段
- Day 1-2: 抽查驗證
- Day 3: 異常值處理
- Day 4: 補充缺失資料
- Day 5: 最終確認

---

## 💾 備份策略

### 遷移前
1. 備份所有原始Excel檔案
2. 建立 `migration_backup` 資料夾
3. 所有檔案加上時間戳記

### 遷移中
1. 每個步驟執行前備份資料庫
2. 保留每次轉換的中間結果 (CSV)
3. 記錄所有 SQL 執行日誌

### 遷移後
1. 保留原始Excel檔案至少1年
2. 新舊系統並行運作1個月
3. 定期匯出新系統資料備份

---

## 🛠️ 工具需求

### Python套件
```bash
pip install pandas openpyxl mysql-connector-python sqlalchemy --break-system-packages
```

### SQL工具
- MySQL Workbench (資料驗證)
- DBeaver (資料比對)

### Excel工具
- Microsoft Excel (資料預處理)
- LibreOffice Calc (備用)

---

## 📝 後續改善建議

### 立即改善 (遷移後)
1. **建立資料輸入規範**
   - 統一日期格式
   - 統一金額格式
   - 下拉選單取代手動輸入

2. **必填欄位加強**
   - 姓名必填
   - 電話必填
   - 統編或身份證擇一必填

3. **自動驗證**
   - 統編驗證API
   - 電話格式驗證
   - 身份證格式驗證

### 中期改善 (3個月內)
1. **自動化繳費提醒**
2. **合約到期自動通知**
3. **佣金自動計算**

### 長期改善 (6個月內)
1. **LINE Bot 整合**
2. **電子簽名整合**
3. **自動開發票**

---

**文件版本:** v1.0  
**最後更新:** 2025-12-03  
**負責人:** 戴豪廷  
**技術支援:** Claude (Anthropic)
