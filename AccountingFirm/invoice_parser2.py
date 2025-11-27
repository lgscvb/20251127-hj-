# -*- coding: utf-8 -*-

import re
import datetime
import json
import os

class InvoiceParser:
    def __init__(self, ocr_text):
        self.text = ocr_text
        self.result = {
            "invoice_number": None,
            "invoice_period": None,
            "date": None,
            "address": None,
            "buyer": None,
            "items": [],
            "total_amount": None,
            "tax_type": None,
            "has_stamp": False,
            "confidence": {}  # 用於存儲各字段的識別信心度
        }
    
    def extract_invoice_number(self):
        """提取發票號碼"""
        # 台灣發票號碼通常是 2 個英文字母後跟 8 位數字
        pattern = r'[A-Z]{2}[\d]{8}'
        matches = re.findall(pattern, self.text)
        if matches:
            self.result["invoice_number"] = matches[0]
            self.result["confidence"]["invoice_number"] = 0.9  # 高信心度
        else:
            # 嘗試寬鬆匹配
            pattern = r'[A-Z]{1,2}[-\s]?[\d]{6,8}'
            matches = re.findall(pattern, self.text)
            if matches:
                self.result["invoice_number"] = matches[0].replace(' ', '').replace('-', '')
                self.result["confidence"]["invoice_number"] = 0.6  # 中等信心度
        return self
    
    def extract_date(self):
        """提取發票日期"""
        # 尋找日期格式 (年/月/日)
        patterns = [
            r'(\d{3})[/\-\.年](\d{1,2})[/\-\.月](\d{1,2})[日]?',  # 民國年 (如 111/01/01)
            r'(\d{4})[/\-\.年](\d{1,2})[/\-\.月](\d{1,2})[日]?'   # 西元年 (如 2022/01/01)
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, self.text)
            if matches:
                year, month, day = matches[0]
                
                # 處理民國年轉西元年
                if len(year) == 3:
                    year = int(year) + 1911
                
                try:
                    date_str = "{0}/{1}/{2}".format(year, month, day)
                    # 驗證日期有效性
                    datetime.datetime.strptime(date_str, "%Y/%m/%d")
                    self.result["date"] = date_str
                    self.result["confidence"]["date"] = 0.85
                    
                    # 提取發票期別 (基於日期)
                    self.extract_invoice_period_from_date(int(month))
                    break
                except ValueError:
                    continue
        return self
    
    def extract_invoice_period_from_date(self, month):
        """根據月份提取發票期別"""
        period_map = {
            1: "01-02月",
            2: "01-02月",
            3: "03-04月",
            4: "03-04月",
            5: "05-06月",
            6: "05-06月",
            7: "07-08月",
            8: "07-08月",
            9: "09-10月",
            10: "09-10月",
            11: "11-12月",
            12: "11-12月"
        }
        if month in period_map:
            self.result["invoice_period"] = period_map[month]
            self.result["confidence"]["invoice_period"] = 0.9
    
    def extract_address(self):
        """提取地址"""
        # 尋找地址相關關鍵詞
        address_patterns = [
            r'地址[:：]?\s*(.+?)(?=電話|傳真|統一編號|$)',
            r'Address[:：]?\s*(.+?)(?=Tel|Fax|$)',
            r'(?:台|臺|新|桃|苗|彰|南|高|屏|宜|花|東)[^縣市]{0,3}[縣市].{5,30}'
        ]
        
        for pattern in address_patterns:
            matches = re.search(pattern, self.text)
            if matches:
                address = matches.group(1) if '地址' in pattern or 'Address' in pattern else matches.group(0)
                address = address.strip()
                if len(address) > 5:  # 避免過短的錯誤匹配
                    self.result["address"] = address
                    self.result["confidence"]["address"] = 0.7
                    break
        return self
    
    def extract_buyer(self):
        """提取買受人"""
        buyer_patterns = [
            r'買受人[:：]?\s*(.+?)(?=地址|電話|$)',
            r'Customer[:：]?\s*(.+?)(?=Address|Tel|$)',
            r'公司名稱[:：]?\s*(.+?)(?=地址|電話|$)'
        ]
        
        for pattern in buyer_patterns:
            matches = re.search(pattern, self.text)
            if matches:
                buyer = matches.group(1).strip()
                if len(buyer) > 1:  # 避免過短的錯誤匹配
                    self.result["buyer"] = buyer
                    self.result["confidence"]["buyer"] = 0.75
                    break
        return self
    
    def extract_total_amount(self):
        """提取總金額"""
        # 尋找總金額相關關鍵詞
        amount_patterns = [
            r'總計[:：]?\s*NT?\$?\s*([\d,]+\.?\d*)',
            r'合計[:：]?\s*NT?\$?\s*([\d,]+\.?\d*)',
            r'Total[:：]?\s*NT?\$?\s*([\d,]+\.?\d*)',
            r'金額[:：]?\s*NT?\$?\s*([\d,]+\.?\d*)'
        ]
        
        for pattern in amount_patterns:
            matches = re.search(pattern, self.text)
            if matches:
                amount = matches.group(1).replace(',', '')
                try:
                    self.result["total_amount"] = float(amount)
                    self.result["confidence"]["total_amount"] = 0.8
                    break
                except ValueError:
                    continue
        return self
    
    def extract_tax_type(self):
        """提取課稅別"""
        tax_keywords = {
            "應稅": ["應稅", "營業稅", "稅率5%", "加值型"],
            "零稅率": ["零稅率", "零稅", "Zero", "外銷"],
            "免稅": ["免稅", "免營業稅"]
        }
        
        for tax_type, keywords in tax_keywords.items():
            for keyword in keywords:
                if keyword in self.text:
                    self.result["tax_type"] = tax_type
                    self.result["confidence"]["tax_type"] = 0.7
                    return self
        
        # 如果沒有明確關鍵詞，檢查是否有稅額
        if re.search(r'稅額[:：]?\s*NT?\$?\s*([\d,]+\.?\d*)', self.text):
            self.result["tax_type"] = "應稅"
            self.result["confidence"]["tax_type"] = 0.6
        
        return self
    
    def extract_items(self):
        """提取品項明細"""
        # 這是一個複雜的任務，需要表格識別
        # 這裡提供一個簡化版本，嘗試使用正則表達式匹配
        
        # 尋找可能的品項行
        item_pattern = r'(\d+)\s+([^\d]+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)'
        matches = re.findall(item_pattern, self.text)
        
        for match in matches:
            try:
                item = {
                    "number": match[0],
                    "name": match[1].strip(),
                    "quantity": float(match[2]),
                    "unit_price": float(match[3]),
                    "amount": float(match[4])
                }
                # 簡單驗證：數量 * 單價 ≈ 金額
                if abs(item["quantity"] * item["unit_price"] - item["amount"]) < 1:
                    self.result["items"].append(item)
            except (ValueError, IndexError):
                continue
        
        if self.result["items"]:
            self.result["confidence"]["items"] = 0.6
        
        return self
    
    def check_stamp(self):
        """檢查是否有統一發票專用章（這需要圖像分析，這裡只是簡單檢查關鍵詞）"""
        stamp_keywords = ["統一發票專用章", "統一發票章", "發票專用章"]
        
        for keyword in stamp_keywords:
            if keyword in self.text:
                self.result["has_stamp"] = True
                self.result["confidence"]["has_stamp"] = 0.7
                break
        
        return self
    
    def extract_all(self):
        """提取所有發票信息"""
        self.extract_invoice_number()
        self.extract_date()
        self.extract_address()
        self.extract_buyer()
        self.extract_total_amount()
        self.extract_tax_type()
        self.extract_items()
        self.check_stamp()
        
        # 計算整體信心度
        confidence_values = self.result["confidence"].values()
        if confidence_values:
            self.result["overall_confidence"] = sum(confidence_values) / len(confidence_values)
        else:
            self.result["overall_confidence"] = 0
        
        return self.result
    
    def save_result(self, output_path=None):
        """保存解析結果到JSON文件"""
        if output_path is None:
            os.makedirs('parsing_results', exist_ok=True)
            output_path = os.path.join('parsing_results', 'invoice_{0}.json'.format(datetime.datetime.now().strftime("%Y%m%d_%H%M%S")))
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.result, f, ensure_ascii=False, indent=2)
        
        return output_path 