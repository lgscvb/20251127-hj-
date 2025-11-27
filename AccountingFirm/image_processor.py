# -*- coding: utf-8 -*-

# 嘗試導入 cv2，如果失敗則使用替代方案
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    print("警告: OpenCV (cv2) 未安裝，圖像處理功能將被禁用")
    CV2_AVAILABLE = False
import os

def preprocess_image(image_path, method='adaptive'):
    """預處理發票圖像以提高 OCR 準確率
    
    Args:
        image_path: 圖像文件路徑
        method: 預處理方法，可選 'adaptive', 'otsu', 'basic', 'deskew', 
               'morphological', 'clahe', 'denoise', 'text_region', 
               'perspective', 'sharpen'
    
    Returns:
        處理後的圖像路徑
    """
    if not CV2_AVAILABLE:
        print("OpenCV 未安裝，返回原始圖像")
        return image_path
    
    # 讀取圖像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"無法讀取圖像: {image_path}")
    
    # 創建輸出目錄
    output_dir = os.path.join(os.path.dirname(image_path), 'processed')
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成輸出文件名
    filename = os.path.basename(image_path)
    base_name, ext = os.path.splitext(filename)
    processed_path = os.path.join(output_dir, f"{base_name}_{method}{ext}")
    
    # 轉換為灰度圖
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 根據選擇的方法進行處理
    if method == 'adaptive':
        # 自適應閾值處理
        processed = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        processed = cv2.fastNlMeansDenoising(processed, None, 10, 7, 21)
        
    elif method == 'otsu':
        # Otsu's 閾值處理
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, processed = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
    elif method == 'basic':
        # 基本處理：調整對比度和亮度
        alpha = 1.5  # 對比度
        beta = 10    # 亮度
        processed = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
        
    elif method == 'deskew':
        # 傾斜校正
        processed = deskew(gray)
        
    elif method == 'morphological':
        # 形態學處理
        processed = morphological_processing(gray)
        
    elif method == 'clahe':
        # 局部對比度增強
        processed = enhance_local_contrast(gray)
        
    elif method == 'denoise':
        # 雜訊去除
        processed = denoise_image(gray)
        
    elif method == 'text_region':
        # 文字區域分割
        processed = extract_text_regions(gray)
        
    elif method == 'perspective':
        # 透視校正
        processed = perspective_correction(gray)
        
    elif method == 'sharpen':
        # 自適應銳化
        processed = adaptive_sharpen(gray)
        
    else:
        raise ValueError(f"不支持的預處理方法: {method}")
    
    # 保存處理後的圖像
    cv2.imwrite(processed_path, processed)
    
    return processed_path

def morphological_processing(image):
    """形態學處理"""
    kernel = np.ones((2,2), np.uint8)
    # 膨脹（加粗文字）
    dilated = cv2.dilate(image, kernel, iterations=1)
    # 侵蝕（細化文字）
    eroded = cv2.erode(dilated, kernel, iterations=1)
    return eroded

def enhance_local_contrast(image):
    """局部對比度增強"""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(image)
    return enhanced

def denoise_image(image):
    """雜訊去除"""
    # 中值濾波去除椒鹽噪聲
    median = cv2.medianBlur(image, 3)
    # 雙邊濾波保持邊緣
    denoised = cv2.bilateralFilter(median, 9, 75, 75)
    return denoised

def extract_text_regions(image):
    """文字區域分割"""
    # 使用MSER檢測文字區域
    mser = cv2.MSER_create()
    regions, _ = mser.detectRegions(image)
    # 合併相近的區域
    hulls = [cv2.convexHull(p.reshape(-1, 1, 2)) for p in regions]
    mask = np.zeros(image.shape, dtype=np.uint8)
    cv2.fillPoly(mask, hulls, (255))
    return cv2.bitwise_and(image, image, mask=mask)

def perspective_correction(image):
    """透視校正"""
    try:
        # 增加圖像預處理以提高邊緣檢測效果
        # 先進行高斯模糊減少噪聲
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        
        # 使用Canny邊緣檢測，調整參數使其更容易檢測到邊緣
        edges = cv2.Canny(blurred, 30, 200)
        
        # 使用膨脹操作連接斷開的邊緣
        kernel = np.ones((3,3), np.uint8)
        dilated_edges = cv2.dilate(edges, kernel, iterations=1)
        
        # 尋找輪廓，使用RETR_EXTERNAL只檢測外部輪廓
        contours, _ = cv2.findContours(dilated_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            print("未檢測到輪廓，返回原始圖像")
            return image
            
        # 找到最大的輪廓
        max_contour = max(contours, key=cv2.contourArea)
        
        # 確保輪廓面積足夠大
        if cv2.contourArea(max_contour) < (image.shape[0] * image.shape[1] * 0.1):
            print("檢測到的輪廓太小，返回原始圖像")
            return image
        
        # 使用最小面積矩形擬合
        rect = cv2.minAreaRect(max_contour)
        box = cv2.boxPoints(rect)
        box = np.int0(box)
        
        # 確保矩形的寬高比合理
        width = int(rect[1][0])
        height = int(rect[1][1])
        
        if width == 0 or height == 0:
            print("無效的矩形尺寸，返回原始圖像")
            return image
            
        # 確保寬高比在合理範圍內（假設發票是長方形）
        aspect_ratio = max(width, height) / min(width, height)
        if aspect_ratio > 4 or aspect_ratio < 1.2:
            print(f"不合理的寬高比 ({aspect_ratio:.2f})，返回原始圖像")
            return image
        
        # 對齊點的順序：左上、右上、右下、左下
        src_pts = box.astype("float32")
        dst_pts = np.array([[0, 0],
                           [width-1, 0],
                           [width-1, height-1],
                           [0, height-1]], dtype="float32")
        
        # 計算透視變換矩陣
        M = cv2.getPerspectiveTransform(src_pts, dst_pts)
        
        # 執行透視變換
        warped = cv2.warpPerspective(image, M, (width, height))
        
        # 如果變換結果的面積太小，返回原始圖像
        if warped.size < (image.size * 0.5):
            print("校正後圖像太小，返回原始圖像")
            return image
            
        return warped
        
    except Exception as e:
        print(f"透視校正失敗: {str(e)}")
        return image

def adaptive_sharpen(image):
    """自適應銳化"""
    # 計算拉普拉斯算子
    laplacian = cv2.Laplacian(image, cv2.CV_64F)
    # 根據邊緣強度自適應調整銳化程度
    edge_mask = np.absolute(laplacian)
    edge_mask = edge_mask / edge_mask.max()
    sharpened = image + (edge_mask * laplacian).astype(np.uint8)
    return sharpened

def deskew(image):
    """校正傾斜的圖像"""
    if not CV2_AVAILABLE:
        return image
    
    # 檢測邊緣
    edges = cv2.Canny(image, 50, 150, apertureSize=3)
    
    # 使用霍夫變換檢測直線
    lines = cv2.HoughLines(edges, 1, np.pi/180, 100)
    
    if lines is not None:
        # 計算平均角度
        angles = []
        for line in lines:
            rho, theta = line[0]
            # 只考慮接近水平或垂直的線
            if theta < np.pi/4 or theta > 3*np.pi/4:
                angles.append(theta)
        
        if angles:
            median_angle = np.median(angles)
            # 計算旋轉角度
            if median_angle < np.pi/4:
                angle = median_angle * 180 / np.pi
            else:
                angle = (median_angle - np.pi/2) * 180 / np.pi
            
            # 獲取圖像中心
            (h, w) = image.shape[:2]
            center = (w // 2, h // 2)
            
            # 執行旋轉
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            return rotated
    
    # 如果無法檢測到線條或計算角度，返回原始圖像
    return image

def try_all_preprocessing(image_path):
    """嘗試所有預處理方法，返回所有處理後的圖像路徑"""
    if not CV2_AVAILABLE:
        print("OpenCV 未安裝，返回原始圖像")
        return {"original": image_path}
    
    methods = ['adaptive', 'otsu', 'basic', 'deskew', 
              'morphological', 'clahe', 'denoise', 
              'text_region', 'perspective', 'sharpen']
    results = {}
    
    for method in methods:
        try:
            processed_path = preprocess_image(image_path, method)
            results[method] = processed_path
        except Exception as e:
            print(f"方法 {method} 處理失敗: {e}")
    
    return results 