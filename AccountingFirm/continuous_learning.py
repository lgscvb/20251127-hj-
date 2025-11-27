# -*- coding: utf-8 -*-

import json
import os
from datetime import datetime

def collect_feedback_data(original_result, corrected_result, image_path):
    """收集用戶反饋數據
    
    Args:
        original_result: OCR原始識別結果
        corrected_result: 用戶修正後的結果
        image_path: 原始圖像路徑
    """
    feedback_dir = "feedback_data"
    os.makedirs(feedback_dir, exist_ok=True)
    
    # 創建反饋記錄
    feedback = {
        "timestamp": datetime.now().isoformat(),
        "image_path": image_path,
        "original_result": original_result,
        "corrected_result": corrected_result,
        "fields_corrected": []
    }
    
    # 識別哪些字段被修正了
    total_fields = 0
    corrected_fields = 0
    
    for field in corrected_result:
        total_fields += 1
        if field in original_result and original_result[field] != corrected_result[field]:
            corrected_fields += 1
            feedback["fields_corrected"].append({
                "field_name": field,
                "original_value": original_result[field],
                "corrected_value": corrected_result[field]
            })
    
    # 計算準確率
    accuracy = ((total_fields - corrected_fields) / total_fields) * 100 if total_fields > 0 else 0
    
    # 獲取歷史數據
    historical_accuracy = get_historical_accuracy(feedback_dir)
    
    # 輸出學習進度報告
    print("\n=== 學習進度報告 ===")
    print(f"總欄位數: {total_fields}")
    print(f"需要修正欄位數: {corrected_fields}")
    print(f"當前識別準確率: {accuracy:.2f}%")
    if historical_accuracy:
        print(f"歷史平均準確率: {historical_accuracy:.2f}%")
        if accuracy > historical_accuracy:
            print("👍 系統表現優於歷史平均")
        elif accuracy < historical_accuracy:
            print("📝 系統表現低於歷史平均，將加強學習")
    print("==================\n")
    
    # 保存反饋數據
    feedback_file = os.path.join(
        feedback_dir, 
        f"feedback_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    with open(feedback_file, 'w', encoding='utf-8') as f:
        json.dump(feedback, f, ensure_ascii=False, indent=2)
    
    return feedback_file

def get_historical_accuracy(feedback_dir):
    """計算歷史平均準確率"""
    if not os.path.exists(feedback_dir):
        return None
        
    feedback_files = [f for f in os.listdir(feedback_dir) if f.endswith('.json')]
    if not feedback_files:
        return None
    
    total_accuracy = 0
    file_count = 0
    
    for file in feedback_files:
        try:
            with open(os.path.join(feedback_dir, file), 'r', encoding='utf-8') as f:
                feedback = json.load(f)
                total_fields = len(feedback["corrected_result"])
                corrected_fields = len(feedback["fields_corrected"])
                if total_fields > 0:
                    accuracy = ((total_fields - corrected_fields) / total_fields) * 100
                    total_accuracy += accuracy
                    file_count += 1
        except:
            continue
    
    return total_accuracy / file_count if file_count > 0 else None

def retrain_model_with_feedback(feedback_dir="feedback_data", min_samples=50):
    """使用反饋數據重新訓練模型"""
    # 檢查是否有足夠的新反饋數據
    feedback_files = [f for f in os.listdir(feedback_dir) if f.endswith('.json')]
    if len(feedback_files) < min_samples:
        print(f"反饋數據不足，需要至少 {min_samples} 個樣本才能重新訓練")
        return False
    
    try:
        # 嘗試導入模型訓練模塊
        from model_training import train_model, TENSORFLOW_AVAILABLE, SKLEARN_AVAILABLE
        
        if not TENSORFLOW_AVAILABLE or not SKLEARN_AVAILABLE:
            print("缺少必要的依賴項（TensorFlow 或 scikit-learn）。")
            print("請安裝這些庫以啟用模型訓練功能。")
            return False
        
        # 訓練模型
        success = train_model(feedback_dir)
        
        if success:
            print(f"已使用 {len(feedback_files)} 個反饋樣本重新訓練模型")
        
        return success
    except ImportError:
        print("無法導入模型訓練模塊。請確保所有依賴項已安裝。")
        return False

def analyze_error_patterns(feedback_dir="feedback_data"):
    """分析錯誤模式，找出系統的弱點
    
    Args:
        feedback_dir: 反饋數據目錄
    """
    # 加載所有反饋數據
    feedback_files = [f for f in os.listdir(feedback_dir) if f.endswith('.json')]
    if not feedback_files:
        return {"message": "沒有反饋數據可分析"}
    
    # 統計各字段的錯誤頻率
    field_error_counts = {}
    total_samples = len(feedback_files)
    
    for file in feedback_files:
        with open(os.path.join(feedback_dir, file), 'r', encoding='utf-8') as f:
            feedback = json.load(f)
            
        for correction in feedback.get("fields_corrected", []):
            field_name = correction["field_name"]
            if field_name not in field_error_counts:
                field_error_counts[field_name] = 0
            field_error_counts[field_name] += 1
    
    # 計算錯誤率
    error_rates = {
        field: count / total_samples * 100 
        for field, count in field_error_counts.items()
    }
    
    # 按錯誤率排序
    sorted_error_rates = sorted(
        error_rates.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    return {
        "total_samples": total_samples,
        "error_patterns": sorted_error_rates,
        "recommendations": [
            f"優先改進 '{field}' 字段的識別，錯誤率 {rate:.1f}%" 
            for field, rate in sorted_error_rates[:3]
        ]
    } 