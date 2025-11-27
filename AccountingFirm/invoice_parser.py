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
            "seller_tax_id": None,  # 新增賣方統一編號欄位
            "invoice_period": None,
            "date": None,
            "time": None,
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
        # 方法一：直接匹配台灣發票號碼格式（2個英文字母後跟8位數字）
        pattern = r'[A-Z]{2}[\d]{8}'
        matches = re.findall(pattern, self.text)
        if matches:
            self.result["invoice_number"] = matches[0]
            self.result["confidence"]["invoice_number"] = 0.95  # 非常高的信心度
            return self
        
        # 方法二：寬鬆匹配
        pattern = r'[A-Z]{1,2}[-\s]?[\d]{6,8}'
        matches = re.findall(pattern, self.text)
        if matches:
            self.result["invoice_number"] = matches[0].replace(' ', '').replace('-', '')
            self.result["confidence"]["invoice_number"] = 0.7  # 中等信心度
            return self
        
        # 方法三：基於關鍵詞的匹配（來自新版本）
        patterns = [
            r'發票號碼[：:]\s*([A-Z0-9]{8})',
            r'統一發票\s*([A-Z0-9]{8})',
            r'發票編號[：:]\s*([A-Z0-9]{8})',
            r'NO[.:]\s*([A-Z0-9]{8})',
            r'[發票號碼]\s*[:：]?\s*([A-Z0-9]{2,3}[-—]\s*[A-Z0-9]{8})'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, self.text)
            if matches:
                # 清理空格和特殊字符
                invoice_number = re.sub(r'\s+', '', matches[0])
                self.result['invoice_number'] = invoice_number
                self.result["confidence"]["invoice_number"] = 0.85  # 較高信心度
                return self
        
        return self
    
    def extract_seller_tax_id(self):
        """提取賣方統一編號"""
        # 統一編號模式
        tax_id_patterns = [
            r'統一編號[：:]\s*(\d{8})',
            r'統編[：:]\s*(\d{8})',
            r'NO[.:]\s*(\d{8})',
            r'賣方[：:]\s*(\d{8})',
            r'商店編號[：:]\s*(\d{8})',
            r'商號編號[：:]\s*(\d{8})',
            r'營利事業統一編號[：:]\s*(\d{8})'
        ]

        # 首先嘗試明確標記的統一編號
        for pattern in tax_id_patterns:
            matches = re.findall(pattern, self.text)
            if matches:
                tax_id = matches[0]
                if self._validate_tax_id(tax_id):
                    self.result["seller_tax_id"] = tax_id
                    self.result["confidence"]["seller_tax_id"] = 0.9
                    return self

        # 如果沒有找到明確標記的統一編號，嘗試尋找符合格式的8位數字
        # 但要避開發票號碼和其他已知的數字欄位
        number_pattern = r'\b(\d{8})\b'
        matches = re.findall(number_pattern, self.text)
        
        for match in matches:
            # 檢查這個數字是否已經被識別為發票號碼
            if (self.result["invoice_number"] and 
                match in self.result["invoice_number"]):
                continue
                
            # 驗證統一編號格式
            if self._validate_tax_id(match):
                self.result["seller_tax_id"] = match
                self.result["confidence"]["seller_tax_id"] = 0.7
                return self
        
        return self

    def _validate_tax_id(self, tax_id):
        """驗證統一編號格式"""
        if not tax_id.isdigit() or len(tax_id) != 8:
            return False
            
        # 可以添加更多的驗證規則
        # 例如：檢查第七位數是否為7
        # 或其他台灣統一編號的特定規則
        
        return True
    
    def extract_date(self):
        """提取發票日期"""
        # 多種日期格式模式
        date_patterns = [
            # 標準日期格式 YYYY/MM/DD 或 YYYY-MM-DD 或 YYYY.MM.DD
            r'發票日期[：:]\s*(\d{4}[-/\.年]\s*\d{1,2}[-/\.月]\s*\d{1,2}[日號]?)',
            r'日期[：:]\s*(\d{4}[-/\.年]\s*\d{1,2}[-/\.月]\s*\d{1,2}[日號]?)',
            r'Date[：:]\s*(\d{4}[-/\.]\s*\d{1,2}[-/\.]\s*\d{1,2})',
            
            # 直接的日期格式（無前綴）
            r'(\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})',  # YYYY-MM-DD 或 YYYY/MM/DD 或 YYYY.MM.DD
            
            # 中文日期格式 年月日
            r'(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*[日號])',
            
            # 民國年日期格式（3位數）
            r'民國\s*(\d{3})[-/\.年]\s*(\d{1,2})[-/\.月]\s*(\d{1,2})[日號]?',
            r'中華民國\s*(\d{3})[-/\.年]\s*(\d{1,2})[-/\.月]\s*(\d{1,2})[日號]?',
            
            # 民國年日期格式（2位數）
            r'民國\s*(\d{1,2})[-/\.年]\s*(\d{1,2})[-/\.月]\s*(\d{1,2})[日號]?',
            r'中華民國\s*(\d{1,2})[-/\.年]\s*(\d{1,2})[-/\.月]\s*(\d{1,2})[日號]?',
            
            # 簡寫民國年（無標記）
            r'(\d{3})[-/\.年]\s*(\d{1,2})[-/\.月]\s*(\d{1,2})[日號]?',
            r'(\d{2})[-/\.年]\s*(\d{1,2})[-/\.月]\s*(\d{1,2})[日號]?',
            
            # 日/月/年格式
            r'(\d{1,2})[-/\.]\s*(\d{1,2})[-/\.]\s*(\d{4})',
            
            # 月/日/年格式
            r'(\d{1,2})[-/\.]\s*(\d{1,2})[-/\.]\s*(\d{4})',
        ]
        
        # 排除發票期別的模式
        exclude_patterns = [
            r'\d{1,2}[-~]\d{1,2}月',
            r'發票期別',
            r'期別'
        ]
        
        # 檢查是否是台灣發票的特徵
        is_taiwan_invoice = any(keyword in self.text for keyword in [
            "統一發票", "發票號碼", "營業人統一編號", "買受人", "銷售額", "課稅別", 
            "民國", "中華民國", "財政部", "稅額", "總計", "合計", "小計"
        ])
        
        # 首先嘗試提取明確的西元年格式（4位數年份）
        western_date_patterns = [
            r'(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})',  # YYYY-MM-DD 或 YYYY/MM/DD 或 YYYY.MM.DD
            r'(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[日號]?'  # YYYY年MM月DD日
        ]
        
        for pattern in western_date_patterns:
            matches = re.findall(pattern, self.text)
            for match in matches:
                try:
                    year, month, day = map(int, match)
                    
                    # 檢查是否是發票期別
                    date_str = f"{year}/{month}/{day}"
                    is_period = False
                    for exclude in exclude_patterns:
                        if re.search(exclude, date_str):
                            is_period = True
                            break
                    
                    if is_period:
                        continue
                    
                    # 驗證日期合理性
                    current_year = datetime.datetime.now().year
                    if 1900 <= year <= current_year + 5 and 1 <= month <= 12 and 1 <= day <= 31:
                        self.result['date'] = f"{year}/{month:02d}/{day:02d}"
                        self.result["confidence"]["date"] = 0.95  # 非常高的信心度
                        self.extract_invoice_period_from_date(month)
                        return self
                except:
                    pass
        
        # 如果沒有找到明確的西元年格式，且是台灣發票，則嘗試民國年格式
        if is_taiwan_invoice:
            taiwan_date_patterns = [
                r'(\d{1,3})[/\-](\d{1,2})[/\-](\d{1,2})',  # YYY/MM/DD 或 YY/MM/DD 或 DD/MM/YY
            ]
            
            for pattern in taiwan_date_patterns:
                matches = re.findall(pattern, self.text)
                for match in matches:
                    try:
                        part1, part2, part3 = map(int, match)
                        
                        # 檢查是否是發票期別
                        date_str = f"{part1}/{part2}/{part3}"
                        is_period = False
                        for exclude in exclude_patterns:
                            if re.search(exclude, date_str):
                                is_period = True
                                break
                        
                        if is_period:
                            continue
                        
                        # 獲取當前年份，用於判斷合理性
                        current_year = datetime.datetime.now().year
                        
                        # 判斷格式
                        possible_formats = []
                        
                        # 檢查是否可能是西元年格式（4位數年份）
                        if 1900 <= part1 <= current_year + 5 and 1 <= part2 <= 12 and 1 <= part3 <= 31:
                            # 這很可能是西元年格式 YYYY/MM/DD
                            possible_formats.append(("YYYY/MM/DD", part1, part2, part3, 0.95))
                        
                        # 可能是 YYY/MM/DD 格式（三位數民國年）
                        elif 100 <= part1 < 200 and 1 <= part2 <= 12 and 1 <= part3 <= 31:
                            year = part1 + 1911
                            month, day = part2, part3
                            if 1900 <= year <= current_year + 5:  # 檢查年份合理性
                                possible_formats.append(("YYY/MM/DD", year, month, day, 0.9))
                        
                        # 可能是 YY/MM/DD 格式（兩位數民國年）
                        elif part1 < 100 and 1 <= part2 <= 12 and 1 <= part3 <= 31:
                            # 判斷是否是省略百位數的民國年
                            current_roc_year = current_year - 1911
                            
                            # 如果是近期的民國年（例如，當前民國年 ±20 年範圍內）
                            if abs(part1 - (current_roc_year % 100)) <= 20:
                                # 推斷完整的民國年
                                century = current_roc_year // 100 * 100
                                full_roc_year = century + part1
                                if part1 > (current_roc_year % 100) + 20:
                                    # 如果年份看起來太大，可能是上個世紀的
                                    full_roc_year -= 100
                                
                                year = full_roc_year + 1911
                            else:
                                # 直接加上 1911（傳統處理方式）
                                year = part1 + 1911
                            
                            month, day = part2, part3
                            if 1900 <= year <= current_year + 5:  # 檢查年份合理性
                                possible_formats.append(("YY/MM/DD", year, month, day, 0.85))
                        
                        # 可能是 DD/MM/YY 格式
                        if 1 <= part1 <= 31 and 1 <= part2 <= 12 and part3 < 100:
                            day, month, year = part1, part2, part3
                            # 判斷是否是省略百位數的民國年
                            current_roc_year = current_year - 1911
                            
                            if abs(part3 - (current_roc_year % 100)) <= 20:
                                # 推斷完整的民國年
                                century = current_roc_year // 100 * 100
                                full_roc_year = century + part3
                                if part3 > (current_roc_year % 100) + 20:
                                    full_roc_year -= 100
                                
                                year = full_roc_year + 1911
                            else:
                                year = part3 + 1911
                            
                            if 1900 <= year <= current_year + 5:  # 檢查年份合理性
                                possible_formats.append(("DD/MM/YY", year, month, day, 0.8))
                        
                        # 選擇最可能的格式
                        if possible_formats:
                            # 按信心度排序
                            possible_formats.sort(key=lambda x: x[4], reverse=True)
                            format_name, year, month, day, confidence = possible_formats[0]
                            
                            self.result['date'] = f"{year}/{month:02d}/{day:02d}"
                            self.result["confidence"]["date"] = confidence
                            self.extract_invoice_period_from_date(month)
                            return self
                    except:
                        pass
        
        # 首先嘗試提取明確標記的日期
        for pattern in date_patterns:
            matches = re.findall(pattern, self.text)
            if matches:
                # 處理不同格式的匹配結果
                if isinstance(matches[0], tuple) and len(matches[0]) == 3:
                    # 這是民國年格式或日/月/年格式
                    part1, part2, part3 = matches[0]
                    
                    # 檢查是否是發票期別而非日期
                    is_period = False
                    date_str = f"{part1}/{part2}/{part3}"
                    for exclude in exclude_patterns:
                        if re.search(exclude, date_str):
                            is_period = True
                            break
                    
                    if is_period:
                        continue
                    
                    # 嘗試轉換民國年到西元年
                    try:
                        # 如果第一部分是年份（可能是民國年）
                        year = int(part1)
                        month = int(part2)
                        day = int(part3)
                        
                        # 檢查是否是民國年（通常小於200）
                        if year < 200:
                            # 民國年轉西元年
                            year += 1911
                        
                        # 驗證日期合理性
                        if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                            self.result['date'] = f"{year}/{month:02d}/{day:02d}"
                            self.result["confidence"]["date"] = 0.85
                            
                            # 提取發票期別 (基於日期)
                            self.extract_invoice_period_from_date(month)
                            return self
                    except:
                        pass
                    
                    # 嘗試處理日/月/年或月/日/年格式
                    try:
                        # 假設 part3 是年份
                        year = int(part3)
                        
                        # 檢查是否是民國年
                        if year < 200:
                            year += 1911
                        
                        # 嘗試兩種可能的順序
                        # 假設 part1/part2 是日/月
                        day1, month1 = int(part1), int(part2)
                        # 假設 part1/part2 是月/日
                        month2, day2 = int(part1), int(part2)
                        
                        # 檢查哪種假設更合理
                        if 1 <= day1 <= 31 and 1 <= month1 <= 12:
                            self.result['date'] = f"{year}/{month1:02d}/{day1:02d}"
                            self.result["confidence"]["date"] = 0.8
                            self.extract_invoice_period_from_date(month1)
                            return self
                        elif 1 <= day2 <= 31 and 1 <= month2 <= 12:
                            self.result['date'] = f"{year}/{month2:02d}/{day2:02d}"
                            self.result["confidence"]["date"] = 0.8
                            self.extract_invoice_period_from_date(month2)
                            return self
                    except:
                        pass
                else:
                    # 這是標準格式的日期字符串
                    date_str = matches[0]
                    
                    # 檢查是否是發票期別而非日期
                    is_period = False
                    for exclude in exclude_patterns:
                        if re.search(exclude, date_str):
                            is_period = True
                            break
                    
                    if not is_period:
                        # 嘗試標準化日期格式
                        try:
                            # 清理日期字符串
                            date_str = re.sub(r'[年月日號]', '/', date_str)
                            date_str = re.sub(r'[-\.]', '/', date_str)
                            date_str = re.sub(r'\s+', '', date_str)
                            
                            # 處理不同的日期格式
                            parts = date_str.split('/')
                            
                            if len(parts) == 3:
                                # 嘗試解析為 YYYY/MM/DD
                                try:
                                    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                                    
                                    # 檢查是否是民國年
                                    if year < 200:
                                        year += 1911
                                    
                                    # 驗證日期合理性
                                    if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                                        self.result['date'] = f"{year}/{month:02d}/{day:02d}"
                                        self.result["confidence"]["date"] = 0.85
                                        
                                        # 提取發票期別 (基於日期)
                                        self.extract_invoice_period_from_date(month)
                                        return self
                                except:
                                    pass
                                
                                # 如果上面的解析失敗，嘗試其他可能的格式
                                try:
                                    # 嘗試解析為 DD/MM/YYYY
                                    day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                                    
                                    # 驗證日期合理性
                                    if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                                        self.result['date'] = f"{year}/{month:02d}/{day:02d}"
                                        self.result["confidence"]["date"] = 0.8
                                        
                                        # 提取發票期別 (基於日期)
                                        self.extract_invoice_period_from_date(month)
                                        return self
                                except:
                                    pass
                        except:
                            pass
        
        # 如果還是沒找到日期，嘗試直接從文本中提取發票期別，但不設置日期
        if not self.result['date']:
            self.extract_invoice_period_directly()
        
        return self
    
    def extract_invoice_period_from_date(self, month):
        """從日期中提取發票期別"""
        # 如果已經有完整的發票期別（包含年份），就不要覆蓋
        if self.result.get("invoice_period") and ("民國" in self.result["invoice_period"] or 
                                                "中華民國" in self.result["invoice_period"]):
            return self
        
        # 將月份映射到對應的發票期別
        period_map = {
            1: "01-02月", 2: "01-02月",
            3: "03-04月", 4: "03-04月",
            5: "05-06月", 6: "05-06月",
            7: "07-08月", 8: "07-08月",
            9: "09-10月", 10: "09-10月",
            11: "11-12月", 12: "11-12月"
        }
        
        if isinstance(month, str):
            # 處理中文數字
            cn_number = {
                '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
                '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
                '十一': '11', '十二': '12'
            }
            month = cn_number.get(month, month)
            try:
                month = int(month)
            except:
                return self
        
        if month in period_map:
            # 如果有日期資訊，加入年份
            if self.result.get("date"):
                try:
                    year = int(self.result["date"].split('/')[0]) - 1911  # 西元年轉民國年
                    # 檢查原始文本中是否包含 "中華民國"
                    if "中華民國" in self.text:
                        self.result["invoice_period"] = f"中華民國{year}年{period_map[month]}"
                    else:
                        self.result["invoice_period"] = f"民國{year}年{period_map[month]}"
                except:
                    self.result["invoice_period"] = period_map[month]
            else:
                self.result["invoice_period"] = period_map[month]
            self.result["confidence"]["invoice_period"] = 0.9
        
        return self
    
    def extract_invoice_period_directly(self):
        """直接從文本中提取發票期別"""
        period_patterns = [
            # 完整民國年格式
            r'中華民國\s*(\d{3})\s*年\s*(\d{1,2})[-~]\d{1,2}月份?',
            r'民國\s*(\d{3})\s*年\s*(\d{1,2})[-~]\d{1,2}月份?',
            
            # 中文數字年份格式
            r'([一二三四五六七八九十]{2,3})年\s*([一二三四五六七八九十]{1,2})[、]\s*([一二三四五六七八九十]{1,2})月',
            
            # 標準格式（如果前面有年份資訊，也要保留）
            r'(?:中華民國|民國)?\s*(?:(\d{3})\s*年)?\s*(?:發票期別[：:]\s*)?(\d{1,2})[-~](\d{1,2})月',
            r'(?:中華民國|民國)?\s*(?:(\d{3})\s*年)?\s*(?:期別[：:]\s*)?(\d{1,2})[-~](\d{1,2})月',
        ]
        
        # 中文數字轉阿拉伯數字的對照表
        cn_number = {
            '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
            '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
            '十一': '11', '十二': '12'
        }
        
        def convert_cn_year(cn_year):
            """將中文年份轉換為數字"""
            result = 0
            for char in cn_year:
                if char in cn_number:
                    result = result * 10 + int(cn_number[char])
            return result
        
        for pattern in period_patterns:
            matches = re.findall(pattern, self.text)
            if matches:
                if isinstance(matches[0], tuple):
                    if '年' in pattern:
                        if len(matches[0]) == 2:  # 民國年+月份格式
                            year, month = matches[0]
                            try:
                                year = int(year)
                                month = int(month)
                                if 1 <= month <= 12:
                                    # 格式化為 "民國年份/月份區間"
                                    period = f"民國{year}年{month:02d}-{(month+1):02d}月"
                                    self.result["invoice_period"] = period
                                    self.result["confidence"]["invoice_period"] = 0.95
                                    return self
                            except ValueError:
                                continue
                        elif len(matches[0]) == 3:  # 中文數字年份格式
                            cn_year, start_month, end_month = matches[0]
                            try:
                                year = convert_cn_year(cn_year)
                                start = int(cn_number.get(start_month, '0'))
                                end = int(cn_number.get(end_month, '0'))
                                if year and 1 <= start <= 12 and start < end <= 12:
                                    period = f"民國{year}年{start:02d}-{end:02d}月"
                                    self.result["invoice_period"] = period
                                    self.result["confidence"]["invoice_period"] = 0.9
                                    return self
                            except ValueError:
                                continue
                        elif len(matches[0]) == 3:  # 年份+起訖月份格式
                            year, start_month, end_month = matches[0]
                            try:
                                if year:  # 如果有年份
                                    year = int(year)
                                    start = int(start_month)
                                    end = int(end_month)
                                    if 1 <= start <= 12 and start < end <= 12:
                                        period = f"民國{year}年{start:02d}-{end:02d}月"
                                        self.result["invoice_period"] = period
                                        self.result["confidence"]["invoice_period"] = 0.9
                                        return self
                            except ValueError:
                                continue
            
                # 如果沒有年份資訊，嘗試從日期中提取
                if not self.result.get("invoice_period") and self.result.get("date"):
                    try:
                        date_parts = self.result["date"].split('/')
                        if len(date_parts) == 3:
                            year = int(date_parts[0]) - 1911  # 西元年轉民國年
                            period = matches[0]
                            if not isinstance(period, tuple):
                                period = f"民國{year}年{period}"
                                self.result["invoice_period"] = period
                                self.result["confidence"]["invoice_period"] = 0.85
                                return self
                    except:
                        pass
        
        # 嘗試匹配單月格式
        month_pattern = r'(\d{1,2})月\s*份'
        matches = re.findall(month_pattern, self.text)
        if matches:
            month = int(matches[0])
            # 將單月轉換為期別，並嘗試加入年份
            if 1 <= month <= 12:
                try:
                    if self.result.get("date"):
                        year = int(self.result["date"].split('/')[0]) - 1911
                        period = f"民國{year}年{month:02d}-{(month+1):02d}月"
                    else:
                        period = f"{month:02d}-{(month+1):02d}月"
                    self.result["invoice_period"] = period
                    self.result["confidence"]["invoice_period"] = 0.8
                except:
                    pass
        
        return self
    
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
        # 擴展金額識別模式
        amount_patterns = [
            # 現金格式（新增）
            r'現金[：:]?\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'現金[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'現金收訖[：:]?\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'現金收訖[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            
            # 原有的標準格式
            r'總計[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'合計[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'總金額[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            
            # 純數字格式
            r'總計[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'合計[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'總金額[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'應付金額[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'应收金额[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'座收金额[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',

            # 含有 "元整" 的格式
            r'總計[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*)\s*元整',
            r'合計[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*)\s*元整',
            r'總金額[：:]\s*([\d,]{1,3}(?:,\d{3})*)\s*元整',
            
            # 特殊格式（可能沒有冒號）
            r'總計\s*NT?\$\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'總額\s*NT?\$\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'總計\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'總額\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            
            # 含稅金額
            r'含稅總額[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'含稅總額[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            
            # 銷售額相關
            r'銷售額合計[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'銷售額合計[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            r'課稅銷售額[：:]\s*NT?\$?\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'課稅銷售額[：:]\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:元|圓|塊)?',
            
            # 通用數字格式（優先級最低）
            r'NT?\$\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'TWD\s*([\d,]{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        ]
        
        # 排除模式（避免匹配到單品金額）
        exclude_patterns = [
            r'小計',
            r'單價',
            r'折扣',
            r'税額',
            r'找零',  # 新增，避免匹配到找零金額
            r'餘額'   # 新增，避免匹配到餘額
        ]
        
        # 驗證金額的合理性
        def is_valid_amount(amount_str):
            try:
                # 移除千位分隔符
                clean_amount = amount_str.replace(',', '')
                amount = float(clean_amount)
                # 設定合理的金額範圍（例如：1-1,000,000）
                return 1 <= amount <= 1000000
            except:
                return False
        
        # 尋找最可能的總金額
        candidates = []
        
        for pattern in amount_patterns:
            matches = re.findall(pattern, self.text)
            for match in matches:
                # 檢查是否是排除項
                should_exclude = False
                for exclude in exclude_patterns:
                    if re.search(exclude, self.text[max(0, self.text.find(match)-10):self.text.find(match)]):
                        should_exclude = True
                        break
                
                if not should_exclude and is_valid_amount(match):
                    # 計算可信度
                    confidence = 0.6  # 基礎可信度
                    
                    # 根據不同特徵提高可信度
                    if '總計' in pattern or '合計' in pattern:
                        confidence += 0.2
                    if '現金' in pattern:  # 新增現金相關的可信度調整
                        confidence += 0.2
                    if '元整' in pattern:
                        confidence += 0.1
                    if 'NT$' in self.text[max(0, self.text.find(match)-5):self.text.find(match)]:
                        confidence += 0.1
                    # 針對純數字格式的特殊處理
                    elif any(keyword in pattern for keyword in ['總計', '合計', '總金額', '總額', '現金']):
                        # 如果是純數字格式但有明確的金額標識詞
                        confidence += 0.15
                    
                    # 清理並格式化金額
                    clean_amount = match.replace(',', '')
                    formatted_amount = "{:.2f}".format(float(clean_amount))
                    
                    candidates.append((formatted_amount, confidence))
        
        if candidates:
            # 選擇可信度最高的金額
            candidates.sort(key=lambda x: x[1], reverse=True)
            self.result['total_amount'] = candidates[0][0]
            self.result["confidence"]["total_amount"] = candidates[0][1]
        
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
        # 嘗試識別項目表格結構
        # 這是一個簡化的實現，實際情況可能需要更複雜的表格解析邏輯
        
        # 尋找可能的表格頭部
        table_headers = [
            '品名', '數量', '單價', '金額',
            '品名', '数量', '单价', '金额',
            'Item', 'Quantity', 'Price', 'Amount'
        ]
        
        # 檢查是否存在表格頭部
        has_table = False
        for header in table_headers:
            if header in self.text:
                has_table = True
                break
        
        items = []
        
        if has_table:
            # 嘗試使用行分割來提取表格數據
            lines = self.text.split('\n')
            
            # 尋找表格開始和結束的行
            start_line = -1
            end_line = -1
            
            for i, line in enumerate(lines):
                # 檢查是否是表格頭部
                if any(header in line for header in table_headers[:4]):  # 使用中文頭部
                    start_line = i + 1
                    break
                elif any(header in line for header in table_headers[4:8]):  # 使用簡體中文頭部
                    start_line = i + 1
                    break
                elif any(header in line for header in table_headers[8:]):  # 使用英文頭部
                    start_line = i + 1
                    break
            
            # 尋找表格結束的行（通常是合計或總計行）
            if start_line > 0:
                for i in range(start_line, len(lines)):
                    if any(keyword in lines[i] for keyword in ['合計', '總計', '小計', '合计', '总计', '小计', 'Total', 'Sum']):
                        end_line = i
                        break
            
            # 如果找到了表格的開始和結束
            if start_line > 0 and end_line > start_line:
                # 提取表格數據
                for i in range(start_line, end_line):
                    line = lines[i].strip()
                    if not line:
                        continue
                    
                    # 嘗試從行中提取項目信息
                    # 這裡使用一個簡單的啟發式方法，實際情況可能需要更複雜的解析
                    parts = re.split(r'\s{2,}', line)  # 使用兩個或更多空格分割
                    
                    if len(parts) >= 2:
                        item = {
                            'name': parts[0],
                            'quantity': parts[1] if len(parts) > 1 else '',
                            'unit_price': parts[2] if len(parts) > 2 else '',
                            'amount': parts[-1]  # 假設最後一個部分是金額
                        }
                        items.append(item)
        
        # 如果沒有找到表格結構，嘗試使用正則表達式提取項目
        if not items:
            # 尋找可能的項目模式：品名後跟數量、單價和金額
            item_patterns = [
                r'(\S+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)',  # 品名 數量 單價 金額
                r'(\S+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)'  # 品名 數量/單價 金額
            ]
            
            for pattern in item_patterns:
                matches = re.findall(pattern, self.text)
                if matches:
                    for match in matches:
                        if len(match) == 4:
                            item = {
                                'name': match[0],
                                'quantity': match[1],
                                'unit_price': match[2],
                                'amount': match[3]
                            }
                        else:
                            item = {
                                'name': match[0],
                                'quantity': '',
                                'unit_price': match[1],
                                'amount': match[2]
                            }
                        items.append(item)
                    break
        
        self.result['items'] = items
        if self.result['items']:
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
    
    def extract_time(self):
        """提取發票時間（HH:MM）"""
        # 時間格式模式
        time_patterns = [
            r'時間[：:]\s*(\d{1,2}:\d{2})',
            r'Time[：:]\s*(\d{1,2}:\d{2})',
            r'(\d{1,2}:\d{2}:\d{2})',  # HH:MM:SS
            r'(\d{1,2}時\d{1,2}分)',   # 中文時間格式
            r'(\d{1,2}[:.]\d{2})\s*(AM|PM|am|pm)?'  # 12小時制
        ]
        
        for pattern in time_patterns:
            matches = re.findall(pattern, self.text)
            if matches:
                time_str = matches[0]
                
                # 處理元組結果（如果包含AM/PM）
                if isinstance(time_str, tuple):
                    time_part = time_str[0]
                    am_pm = time_str[1].upper() if len(time_str) > 1 else ""
                    
                    # 轉換中文時間格式
                    time_part = re.sub(r'時', ':', time_part)
                    time_part = re.sub(r'分', '', time_part)
                    
                    # 處理12小時制
                    if am_pm:
                        try:
                            hour, minute = map(int, time_part.split(':'))
                            if am_pm == 'PM' and hour < 12:
                                hour += 12
                            elif am_pm == 'AM' and hour == 12:
                                hour = 0
                            time_part = f"{hour:02d}:{minute:02d}"
                        except:
                            pass
                    
                    self.result['time'] = time_part
                    self.result["confidence"]["time"] = 0.8
                else:
                    # 處理簡單字符串結果
                    # 轉換中文時間格式
                    time_str = re.sub(r'時', ':', time_str)
                    time_str = re.sub(r'分', '', time_str)
                    
                    # 如果是 HH:MM:SS 格式，只保留 HH:MM
                    if re.match(r'\d{1,2}:\d{2}:\d{2}', time_str):
                        time_str = time_str[:5]
                    
                    self.result['time'] = time_str
                    self.result["confidence"]["time"] = 0.8
                
                return self
        
        return self
    
    def extract_all(self):
        """提取所有發票信息"""
        self.extract_invoice_number()
        self.extract_seller_tax_id()  # 新增提取賣方統一編號
        self.extract_date()
        self.extract_time()
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