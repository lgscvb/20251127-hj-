# -*- coding: utf-8 -*-

from google.cloud import vision
import io
import os
import json

# 導入憑證設置
import setup_credentials

def detect_text(image_path):
    """使用 Google Cloud Vision API 檢測圖片中的文字"""
    client = vision.ImageAnnotatorClient()

    with io.open(image_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations

    if response.error.message:
        raise Exception(
            '{0}\nFor more info on error messages, check: '.format(response.error.message) +
            'https://cloud.google.com/apis/design/errors')
            
    # 返回檢測到的所有文字
    if texts:
        return texts[0].description
    return ""

def detect_text_with_layout(image_path):
    """檢測文字並保留位置信息"""
    client = vision.ImageAnnotatorClient()

    with io.open(image_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    
    if response.error.message:
        raise Exception(
            '{0}\nFor more info on error messages, check: '.format(response.error.message) +
            'https://cloud.google.com/apis/design/errors')
    
    # 提取文字及其位置信息
    text_blocks = []
    for text in response.text_annotations[1:]:  # 跳過第一個，它包含所有文字
        vertices = [(vertex.x, vertex.y) for vertex in text.bounding_poly.vertices]
        text_blocks.append({
            'text': text.description,
            'bounding_box': vertices
        })
    
    return text_blocks

def detect_document(image_path):
    """使用文檔OCR模式，更適合結構化文檔如發票"""
    client = vision.ImageAnnotatorClient()

    with io.open(image_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = client.document_text_detection(image=image)
    
    if response.error.message:
        raise Exception(
            '{0}\nFor more info on error messages, check: '.format(response.error.message) +
            'https://cloud.google.com/apis/design/errors')
    
    # 保存完整的OCR結果，包括頁面、段落、文字塊等結構
    result = {
        'text': response.full_text_annotation.text,
        'pages': []
    }
    
    for page in response.full_text_annotation.pages:
        page_info = {
            'width': page.width,
            'height': page.height,
            'blocks': []
        }
        
        for block in page.blocks:
            block_info = {
                'type': 'TEXT' if block.block_type == vision.Block.BlockType.TEXT else 'OTHER',
                'paragraphs': []
            }
            
            for paragraph in block.paragraphs:
                para_text = ''.join([symbol.text for word in paragraph.words for symbol in word.symbols])
                para_vertices = [(vertex.x, vertex.y) for vertex in paragraph.bounding_box.vertices]
                
                block_info['paragraphs'].append({
                    'text': para_text,
                    'bounding_box': para_vertices
                })
            
            page_info['blocks'].append(block_info)
        
        result['pages'].append(page_info)
    
    # 保存結果到文件，方便調試
    os.makedirs('ocr_results', exist_ok=True)
    result_file = os.path.join('ocr_results', os.path.basename(image_path) + '.json')
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return result 