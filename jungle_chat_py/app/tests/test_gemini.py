import google.generativeai as genai
from app.config import settings
import os
import sys

def test_gemini():
    try:
        print("\n=== Gemini API 測試開始 ===\n")
        
        print("1. 環境檢查...")
        print(f"Python 版本: {sys.version}")
        print(f"google.generativeai 版本: {genai.__version__}")
        
        print("\n2. API 配置...")
        api_key = settings.GOOGLE_API_KEY
        print(f"API Key 前10位: {api_key[:10]}...")
        genai.configure(api_key=api_key)
        
        print("\n3. 列出可用模型...")
        try:
            models = genai.list_models()
            for m in models:
                print(f"\n模型名稱: {m.name}")
                print(f"顯示名稱: {m.display_name}")
                print(f"描述: {m.description}")
                print("---")
        except Exception as e:
            print(f"列出模型時發生錯誤: {str(e)}")
        
        print("\n4. 初始化 Gemini Pro...")
        model = genai.GenerativeModel('gemini-pro')
        
        print("\n5. 測試簡單對話...")
        response = model.generate_content("你好，請用繁體中文回答：請簡單自我介紹")
        
        print("\n6. 回應內容:")
        print(response.text)
        
        print("\n=== 測試完成 ===")
        
    except Exception as e:
        print(f"\n!!! 錯誤發生 !!!")
        print(f"錯誤信息: {str(e)}")
        print(f"錯誤類型: {type(e)}")
        import traceback
        print("\n詳細錯誤信息:")
        print(traceback.format_exc())
    
    finally:
        print("\n=== 測試結束 ===")

def test_alternative():
    """測試替代方案"""
    try:
        print("\n=== 替代方案測試 ===\n")
        
        print("1. 使用直接 REST API 調用...")
        import requests
        
        headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': settings.GOOGLE_API_KEY,
        }
        
        data = {
            'contents': [{
                'parts': [{
                    'text': '你好，請用繁體中文回答：請簡單自我介紹'
                }]
            }]
        }
        
        response = requests.post(
            'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
            headers=headers,
            json=data
        )
        
        print(f"\n回應狀態碼: {response.status_code}")
        print(f"回應內容: {response.text}")
        
    except Exception as e:
        print(f"\n!!! 錯誤發生 !!!")
        print(f"錯誤信息: {str(e)}")
        print(f"錯誤類型: {type(e)}")
        import traceback
        print("\n詳細錯誤信息:")
        print(traceback.format_exc())

if __name__ == "__main__":
    print("開始主要測試...")
    test_gemini()
    
    print("\n開始替代方案測試...")
    test_alternative()
