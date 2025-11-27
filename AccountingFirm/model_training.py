# -*- coding: utf-8 -*-

import os
import json
import numpy as np

# 條件導入 TensorFlow
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow 未安裝。模型訓練功能將不可用，但系統其他功能不受影響。")
    print("當您收集了足夠的反饋數據後，可以安裝 TensorFlow 以啟用模型訓練功能。")

try:
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("scikit-learn 未安裝。模型訓練功能將不可用。")

def prepare_training_data(feedback_dir="feedback_data"):
    """準備訓練數據"""
    data = []
    labels = []
    
    # 加載反饋數據
    feedback_files = [f for f in os.listdir(feedback_dir) if f.endswith('.json')]
    for file in feedback_files:
        with open(os.path.join(feedback_dir, file), 'r', encoding='utf-8') as f:
            feedback = json.load(f)
        
        # 提取特徵和標籤
        for correction in feedback.get("fields_corrected", []):
            # 這裡需要根據您的具體需求設計特徵
            # 例如，可以使用原始文本的詞袋模型、字符級特徵等
            feature = extract_features(correction["original_value"])
            label = correction["corrected_value"]
            
            data.append(feature)
            labels.append(label)
    
    return np.array(data), np.array(labels)

def extract_features(text):
    """從文本中提取特徵"""
    # 這是一個簡單的示例，您需要根據實際需求設計更複雜的特徵提取
    # 例如，可以使用詞袋模型、TF-IDF、字符級 n-gram 等
    return [len(text), text.count(' '), sum(c.isdigit() for c in text)]

def build_model(input_shape, num_classes):
    """構建神經網絡模型"""
    if not TENSORFLOW_AVAILABLE:
        raise ImportError("TensorFlow 未安裝，無法構建模型。請安裝 TensorFlow 後再試。")
    
    model = models.Sequential([
        layers.Dense(64, activation='relu', input_shape=(input_shape,)),
        layers.Dropout(0.2),
        layers.Dense(32, activation='relu'),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model(feedback_dir="feedback_data", model_dir="models"):
    """訓練模型"""
    if not TENSORFLOW_AVAILABLE or not SKLEARN_AVAILABLE:
        print("缺少必要的依賴項（TensorFlow 或 scikit-learn）。")
        print("請安裝這些庫以啟用模型訓練功能。")
        return False
    
    # 準備數據
    X, y = prepare_training_data(feedback_dir)
    if len(X) < 10:  # 至少需要一定數量的樣本
        print(f"樣本數量不足，需要更多反饋數據")
        return False
    
    # 劃分訓練集和測試集
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    # 構建模型
    model = build_model(X_train.shape[1], len(set(y)))
    
    # 訓練模型
    model.fit(X_train, y_train, epochs=50, batch_size=32, validation_split=0.1)
    
    # 評估模型
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"測試集準確率: {accuracy:.2f}")
    
    # 保存模型
    os.makedirs(model_dir, exist_ok=True)
    model.save(os.path.join(model_dir, "invoice_correction_model.h5"))
    
    return True

if __name__ == "__main__":
    if TENSORFLOW_AVAILABLE and SKLEARN_AVAILABLE:
        train_model()
    else:
        print("無法訓練模型：缺少必要的依賴項。")
        print("請安裝 TensorFlow 和 scikit-learn 以啟用模型訓練功能。") 