#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hour Jungle CRM 資料遷移 ETL 腳本
執行前請確認:
1. pip install pandas openpyxl mysql-connector-python sqlalchemy
2. 設定資料庫連線資訊
3. 備份原始檔案
"""

import pandas as pd
import re
from datetime import datetime
# import mysql.connector  # 暫時不用,先做資料轉換
# from sqlalchemy import create_engine
import logging

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

# ============================================================================
# 資料庫連線設定
# ============================================================================

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # 請修改
    'database': 'hour_jungle_crm',
    'charset': 'utf8mb4'
}

# ============================================================================
# 清洗函數
# ============================================================================

def convert_date(date_value):
    """
    統一日期格式為 YYYY-MM-DD
    處理民國年、西元年、datetime物件
    """
    if pd.isna(date_value):
        return None
    
    # 已是 datetime 物件
    if isinstance(date_value, pd.Timestamp):
        return date_value.strftime('%Y-%m-%d')
    
    # 字串處理
    date_str = str(date_value).strip()
    
    # 民國年格式 113/06/05
    if '/' in date_str:
        try:
            parts = date_str.split('/')
            year = int(parts[0])
            # 如果是三位數,是民國年
            if year < 200:
                year += 1911
            month = int(parts[1])
            day = int(parts[2])
            return f"{year:04d}-{month:02d}-{day:02d}"
        except:
            logging.warning(f"日期轉換失敗: {date_str}")
            return None
    
    # ISO格式 2025-01-06 00:00:00
    if '-' in date_str:
        return date_str.split(' ')[0]
    
    return None

def extract_amount(amount_value):
    """
    從 "1800/m" 提取 1800
    從 21600 直接返回
    """
    if pd.isna(amount_value):
        return None
    
    # 已是數字
    if isinstance(amount_value, (int, float)):
        return int(amount_value)
    
    # 字串處理
    amount_str = str(amount_value).strip()
    
    # 提取數字部分
    match = re.search(r'(\d+)', amount_str)
    if match:
        return int(match.group(1))
    
    return None

def parse_deposit(deposit_value):
    """
    從 "6000/未退" 拆分為 (6000, 'not_refunded')
    從 "Y" 處理為 (None, 'unknown')
    """
    if pd.isna(deposit_value):
        return None, 'unknown'
    
    deposit_str = str(deposit_value).strip()
    
    # 數字 + 狀態格式
    if '/' in deposit_str:
        try:
            parts = deposit_str.split('/')
            amount = int(re.search(r'(\d+)', parts[0]).group(1))
            status = 'not_refunded' if '未退' in parts[1] else 'refunded'
            return amount, status
        except:
            return None, 'unknown'
    
    # Y/N 格式
    if deposit_str.upper() in ['Y', 'N']:
        return None, 'unknown'
    
    # 純數字
    if deposit_str.replace('.', '').isdigit():
        return int(float(deposit_str)), 'not_refunded'
    
    return None, 'unknown'

def clean_tax_id(tax_id_value):
    """統一為8位數字字串"""
    if pd.isna(tax_id_value):
        return None
    
    tax_id = str(tax_id_value).strip()
    
    # 移除小數點
    if '.' in tax_id:
        tax_id = tax_id.split('.')[0]
    
    # 驗證是否為8位數字
    if tax_id.isdigit() and len(tax_id) == 8:
        return tax_id
    
    # 非標準格式
    if tax_id.upper() in ['N', 'NAN']:
        return None
    
    logging.warning(f"統編格式異常: {tax_id}")
    return None

def clean_phone(phone_value):
    """統一手機號碼格式為 09XXXXXXXX"""
    if pd.isna(phone_value):
        return None
    
    phone = str(phone_value).strip()
    
    # 移除小數點
    if '.' in phone:
        phone = phone.split('.')[0]
    
    # 移除非數字
    phone = re.sub(r'\D', '', phone)
    
    # 若為9位數且開頭為9,補0
    if len(phone) == 9 and phone[0] == '9':
        phone = '0' + phone
    
    # 驗證手機號碼格式
    if len(phone) == 10 and phone.startswith('09'):
        return phone
    
    logging.warning(f"電話格式異常: {phone_value} -> {phone}")
    return None

# ============================================================================
# 轉換函數
# ============================================================================

def transform_customers(df, location_prefix, status='active'):
    """
    轉換客戶資料
    
    Args:
        df: 原始DataFrame
        location_prefix: 'HQ' 或 'HR'
        status: 'active' 或 'churned'
    """
    logging.info(f"開始轉換客戶資料: {location_prefix}, 共 {len(df)} 筆")
    
    df_clean = df.copy()
    
    # 1. 建立 legacy_id (處理不同欄位名稱)
    id_col = '編號' if '編號' in df_clean.columns else 'Unnamed: 0'
    df_clean['legacy_id'] = location_prefix + '-' + df_clean[id_col].astype(str)
    
    # 2. 清洗姓名 (必填)
    df_clean['name'] = df_clean['姓名'].str.strip() if '姓名' in df_clean.columns else None
    df_clean = df_clean[df_clean['name'].notna()]
    
    # 3. 清洗公司名稱
    company_col = '公司' if '公司' in df_clean.columns else '公司名稱'
    df_clean['company_name'] = df_clean[company_col].fillna('個人')
    
    # 4. 清洗統編
    tax_col = 'Co number' if 'Co number' in df_clean.columns else '統編'
    df_clean['company_tax_id'] = df_clean[tax_col].apply(clean_tax_id)
    
    # 5. 清洗身份證字號
    if 'Id number' in df_clean.columns:
        df_clean['id_number'] = df_clean['Id number'].astype(str).str.upper()
        # 簡單驗證: 第一碼英文 + 9位數字
        df_clean['id_number'] = df_clean['id_number'].apply(
            lambda x: x if (len(x) == 10 and x[0].isalpha() and x[1:].isdigit()) else None
        )
    else:
        df_clean['id_number'] = None
    
    # 6. 轉換日期
    if '生日' in df_clean.columns:
        df_clean['birthday'] = df_clean['生日'].apply(convert_date)
    else:
        df_clean['birthday'] = None
    
    # 7. 清洗電話
    if '聯絡電話' in df_clean.columns:
        df_clean['phone'] = df_clean['聯絡電話'].apply(clean_phone)
    else:
        df_clean['phone'] = None
    
    # 8. 映射類別 (處理不同欄位名稱)
    type_col = '類別' if '類別' in df_clean.columns else '公司型態'
    if type_col in df_clean.columns:
        customer_type_map = {
            '行號': 'sole_proprietorship',
            '公司': 'company',
            'N': 'individual',
            'n': 'individual'
        }
        df_clean['customer_type'] = df_clean[type_col].map(customer_type_map).fillna('individual')
    else:
        df_clean['customer_type'] = 'individual'
    
    # 9. 清洗地址
    df_clean['address'] = df_clean['Add'] if 'Add' in df_clean.columns else None
    
    # 10. Email
    df_clean['email'] = df_clean['Mail'] if 'Mail' in df_clean.columns else None
    
    # 11. 行業備註
    df_clean['industry_notes'] = df_clean['行業備註'] if '行業備註' in df_clean.columns else None
    
    # 12. 狀態
    df_clean['status'] = status
    
    # 13. 場館
    df_clean['location'] = 'headquarters' if location_prefix == 'HQ' else 'huanrui'
    
    # 14. 客戶來源 (暫時設為未知)
    df_clean['source_channel'] = 'others'
    
    # 選擇需要的欄位
    columns_to_keep = [
        'legacy_id', 'name', 'company_name', 'customer_type',
        'company_tax_id', 'id_number', 'birthday', 'phone',
        'address', 'email', 'industry_notes', 'status', 'location',
        'source_channel'
    ]
    
    result = df_clean[columns_to_keep].copy()
    
    logging.info(f"客戶資料轉換完成: {len(result)} 筆有效資料")
    logging.info(f"  - 有統編: {result['company_tax_id'].notna().sum()} 筆")
    logging.info(f"  - 有電話: {result['phone'].notna().sum()} 筆")
    logging.info(f"  - 有Email: {result['email'].notna().sum()} 筆")
    
    return result

def transform_contracts(df, customers_df):
    """
    轉換合約資料
    需要先載入customers來建立關聯
    """
    logging.info(f"開始轉換合約資料: 共 {len(df)} 筆")
    
    df_clean = df.copy()
    
    # 1. 關聯到客戶 (用 legacy_id)
    # 需要先從 customers_df 取得 id
    # 這裡簡化處理,實際應該用 SQL JOIN
    
    # 2. 日期轉換
    df_clean['start_date'] = df_clean['起始日期'].apply(convert_date)
    df_clean['end_date'] = df_clean['合約到期日'].apply(convert_date)
    
    if '簽約日期' in df_clean.columns:
        df_clean['signed_at'] = df_clean['簽約日期'].apply(convert_date)
    else:
        df_clean['signed_at'] = None
    
    # 3. 金額提取
    df_clean['monthly_rent'] = df_clean['金額'].apply(extract_amount)
    
    # 4. 押金拆分
    if '押金' in df_clean.columns:
        deposit_split = df_clean['押金'].apply(parse_deposit)
        df_clean['deposit'] = deposit_split.apply(lambda x: x[0])
        df_clean['deposit_status'] = deposit_split.apply(lambda x: x[1])
    else:
        df_clean['deposit'] = None
        df_clean['deposit_status'] = 'unknown'
    
    # 5. 繳費方式映射
    if '繳費方式' in df_clean.columns:
        payment_cycle_map = {
            'Y': 'annual', 'y': 'annual',
            'M': 'monthly',
            '6M': 'semi_annual', '6m': 'semi_annual',
            '2Y': 'biennial', '2y': 'biennial'
        }
        df_clean['payment_cycle'] = df_clean['繳費方式'].apply(
            lambda x: payment_cycle_map.get(str(x).strip(), 'monthly')
        )
    else:
        df_clean['payment_cycle'] = 'monthly'
    
    # 6. 合約類型映射
    if '項目' in df_clean.columns:
        contract_type_map = {
            '營登': 'virtual_office',
            '自由座': 'coworking_flexible',
            '辦公室A': 'coworking_fixed',
            '辦公室': 'coworking_fixed'
        }
        df_clean['contract_type'] = df_clean['項目'].map(contract_type_map).fillna('virtual_office')
    else:
        df_clean['contract_type'] = 'virtual_office'
    
    # 7. 判斷合約狀態
    today = pd.to_datetime('today').strftime('%Y-%m-%d')
    df_clean['contract_status'] = df_clean['end_date'].apply(
        lambda x: 'expired' if (x and x < today) else 'active'
    )
    
    # 8. 約定繳費日期
    if '約定繳費日期' in df_clean.columns:
        df_clean['payment_day'] = df_clean['約定繳費日期'].apply(
            lambda x: int(x) if (pd.notna(x) and str(x).isdigit()) else 5
        )
    else:
        df_clean['payment_day'] = 5
    
    # 9. 備註
    df_clean['notes'] = df_clean['標註'] if '標註' in df_clean.columns else None
    
    logging.info(f"合約資料轉換完成")
    logging.info(f"  - 活躍合約: {(df_clean['contract_status'] == 'active').sum()} 筆")
    logging.info(f"  - 已到期: {(df_clean['contract_status'] == 'expired').sum()} 筆")
    
    return df_clean

def transform_commissions(df):
    """轉換佣金資料"""
    logging.info(f"開始轉換佣金資料: 共 {len(df)} 筆")
    
    df_clean = df.copy()
    
    # 1. 提取金額
    df_clean['commission_amount'] = df_clean['金額'].apply(extract_amount)
    
    # 2. 轉換日期
    if '簽約時間' in df_clean.columns:
        df_clean['contract_start'] = df_clean['簽約時間'].apply(convert_date)
    else:
        df_clean['contract_start'] = None
    
    # 3. 付款狀態
    df_clean['status'] = df_clean['佣金給付日期'].apply(
        lambda x: 'paid' if (pd.notna(x) and '已付' in str(x)) else 'pending'
    )
    
    # 4. 轉換付款日期
    df_clean['paid_at'] = df_clean['佣金給付日期'].apply(
        lambda x: convert_date(x) if (pd.notna(x) and '已付' not in str(x)) else None
    )
    
    # 5. 客戶名稱 (用於後續關聯)
    df_clean['customer_name'] = df_clean['客戶']
    
    # 6. 介紹人名稱 (用於後續關聯)
    df_clean['referrer_name'] = df_clean['介紹人']
    
    logging.info(f"佣金資料轉換完成")
    logging.info(f"  - 已付款: {(df_clean['status'] == 'paid').sum()} 筆")
    logging.info(f"  - 待付款: {(df_clean['status'] == 'pending').sum()} 筆")
    
    return df_clean

# ============================================================================
# 主程式
# ============================================================================

def main():
    """主執行流程"""
    
    logging.info("="*80)
    logging.info("Hour Jungle CRM 資料遷移開始")
    logging.info("="*80)
    
    # ========================================================================
    # 步驟 1: 讀取原始資料
    # ========================================================================
    
    logging.info("\n步驟 1: 讀取原始Excel檔案...")
    
    try:
        # 主館
        df_hq_active = pd.read_excel('/mnt/user-data/uploads/客戶資料表crm.xlsx', sheet_name='總表')
        df_hq_closed = pd.read_excel('/mnt/user-data/uploads/客戶資料表crm.xlsx', sheet_name='已結束')
        df_hq_commission = pd.read_excel('/mnt/user-data/uploads/客戶資料表crm.xlsx', sheet_name='佣金')
        
        # 環瑞館
        df_hr_active = pd.read_excel('/mnt/user-data/uploads/環瑞客戶資料表crm.xlsx', sheet_name='環瑞CRM')
        df_hr_closed = pd.read_excel('/mnt/user-data/uploads/環瑞客戶資料表crm.xlsx', sheet_name='已結束')
        df_hr_commission = pd.read_excel('/mnt/user-data/uploads/環瑞客戶資料表crm.xlsx', sheet_name='佣金')
        
        logging.info("✓ 檔案讀取成功")
        logging.info(f"  主館活躍: {len(df_hq_active)} 筆")
        logging.info(f"  主館歷史: {len(df_hq_closed)} 筆")
        logging.info(f"  環瑞活躍: {len(df_hr_active)} 筆")
        logging.info(f"  環瑞歷史: {len(df_hr_closed)} 筆")
        
    except Exception as e:
        logging.error(f"讀取檔案失敗: {e}")
        return
    
    # ========================================================================
    # 步驟 2: 轉換客戶資料
    # ========================================================================
    
    logging.info("\n步驟 2: 轉換客戶資料...")
    
    customers_hq_active = transform_customers(df_hq_active, 'HQ', 'active')
    customers_hq_closed = transform_customers(df_hq_closed, 'HQ', 'churned')
    customers_hr_active = transform_customers(df_hr_active, 'HR', 'active')
    customers_hr_closed = transform_customers(df_hr_closed, 'HR', 'churned')
    
    # 合併所有客戶
    customers_all = pd.concat([
        customers_hq_active,
        customers_hq_closed,
        customers_hr_active,
        customers_hr_closed
    ], ignore_index=True)
    
    logging.info(f"✓ 客戶資料轉換完成: 共 {len(customers_all)} 筆")
    
    # 匯出CSV檢查
    customers_all.to_csv(
        f'customers_transformed_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
        index=False,
        encoding='utf-8-sig'
    )
    logging.info("✓ 已匯出 customers_transformed.csv 供檢查")
    
    # ========================================================================
    # 步驟 3: 轉換合約資料
    # ========================================================================
    
    logging.info("\n步驟 3: 轉換合約資料...")
    
    contracts_hq_active = transform_contracts(df_hq_active, customers_hq_active)
    contracts_hr_active = transform_contracts(df_hr_active, customers_hr_active)
    
    contracts_all = pd.concat([
        contracts_hq_active,
        contracts_hr_active
    ], ignore_index=True)
    
    logging.info(f"✓ 合約資料轉換完成: 共 {len(contracts_all)} 筆")
    
    # 匯出CSV檢查
    contracts_all.to_csv(
        f'contracts_transformed_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
        index=False,
        encoding='utf-8-sig'
    )
    logging.info("✓ 已匯出 contracts_transformed.csv 供檢查")
    
    # ========================================================================
    # 步驟 4: 轉換佣金資料
    # ========================================================================
    
    logging.info("\n步驟 4: 轉換佣金資料...")
    
    commissions_hq = transform_commissions(df_hq_commission)
    commissions_hr = transform_commissions(df_hr_commission)
    
    commissions_all = pd.concat([
        commissions_hq,
        commissions_hr
    ], ignore_index=True)
    
    logging.info(f"✓ 佣金資料轉換完成: 共 {len(commissions_all)} 筆")
    
    # 匯出CSV檢查
    commissions_all.to_csv(
        f'commissions_transformed_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
        index=False,
        encoding='utf-8-sig'
    )
    logging.info("✓ 已匯出 commissions_transformed.csv 供檢查")
    
    # ========================================================================
    # 步驟 5: 資料品質報告
    # ========================================================================
    
    logging.info("\n步驟 5: 產生資料品質報告...")
    
    report = []
    report.append("="*80)
    report.append("資料品質報告")
    report.append("="*80)
    
    # 客戶資料
    report.append("\n【客戶資料】")
    report.append(f"總筆數: {len(customers_all)}")
    report.append(f"  活躍客戶: {(customers_all['status'] == 'active').sum()}")
    report.append(f"  已結束客戶: {(customers_all['status'] == 'churned').sum()}")
    report.append(f"\n完整度:")
    report.append(f"  有統編: {customers_all['company_tax_id'].notna().sum()} ({customers_all['company_tax_id'].notna().sum()/len(customers_all)*100:.1f}%)")
    report.append(f"  有身份證: {customers_all['id_number'].notna().sum()} ({customers_all['id_number'].notna().sum()/len(customers_all)*100:.1f}%)")
    report.append(f"  有電話: {customers_all['phone'].notna().sum()} ({customers_all['phone'].notna().sum()/len(customers_all)*100:.1f}%)")
    report.append(f"  有Email: {customers_all['email'].notna().sum()} ({customers_all['email'].notna().sum()/len(customers_all)*100:.1f}%)")
    report.append(f"  有生日: {customers_all['birthday'].notna().sum()} ({customers_all['birthday'].notna().sum()/len(customers_all)*100:.1f}%)")
    
    # 合約資料
    report.append("\n【合約資料】")
    report.append(f"總筆數: {len(contracts_all)}")
    report.append(f"  活躍合約: {(contracts_all['contract_status'] == 'active').sum()}")
    report.append(f"  已到期合約: {(contracts_all['contract_status'] == 'expired').sum()}")
    report.append(f"\n租金分布:")
    report.append(f"  最低: ${contracts_all['monthly_rent'].min()}")
    report.append(f"  最高: ${contracts_all['monthly_rent'].max()}")
    report.append(f"  平均: ${contracts_all['monthly_rent'].mean():.0f}")
    report.append(f"  中位數: ${contracts_all['monthly_rent'].median():.0f}")
    
    # 佣金資料
    report.append("\n【佣金資料】")
    report.append(f"總筆數: {len(commissions_all)}")
    report.append(f"  已付款: {(commissions_all['status'] == 'paid').sum()}")
    report.append(f"  待付款: {(commissions_all['status'] == 'pending').sum()}")
    report.append(f"  總金額: ${commissions_all['commission_amount'].sum()}")
    report.append(f"  待付金額: ${commissions_all[commissions_all['status'] == 'pending']['commission_amount'].sum()}")
    
    report_text = '\n'.join(report)
    logging.info(f"\n{report_text}")
    
    # 儲存報告
    with open(f'migration_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt', 'w', encoding='utf-8') as f:
        f.write(report_text)
    
    logging.info("\n✓ 報告已儲存")
    
    # ========================================================================
    # 完成
    # ========================================================================
    
    logging.info("\n"+"="*80)
    logging.info("資料遷移完成!")
    logging.info("="*80)
    logging.info("\n下一步:")
    logging.info("1. 檢查產生的 CSV 檔案")
    logging.info("2. 確認資料品質報告")
    logging.info("3. 修改 DB_CONFIG 設定")
    logging.info("4. 執行資料庫匯入 (Step 6)")

if __name__ == '__main__':
    main()
