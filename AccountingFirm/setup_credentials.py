# -*- coding: utf-8 -*-

import os
from pathlib import Path
from dotenv import load_dotenv

# 載入 .env 檔案（從專案根目錄）
project_root = Path(__file__).parent.parent
env_path = project_root / '.env'

if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ 已載入環境變數從：{env_path}")
else:
    print(f"⚠️  找不到 .env 檔案於：{env_path}")
    print("   請複製 .env.example 為 .env 並填入您的憑證資訊")

# 從環境變數讀取設定
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
GOOGLE_CLOUD_API_KEY = os.getenv("GOOGLE_CLOUD_API_KEY")

# 設置環境變數供 Google Cloud SDK 使用
if GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
    
    # 驗證憑證檔案是否存在
    credentials_path = Path(GOOGLE_APPLICATION_CREDENTIALS)
    if not credentials_path.exists():
        print(f"⚠️  警告：憑證檔案不存在：{credentials_path}")
        print("   請確認檔案路徑正確，並從本機備份中取得憑證檔案")
else:
    print("⚠️  未設定 GOOGLE_APPLICATION_CREDENTIALS")

if GOOGLE_CLOUD_API_KEY:
    os.environ["GOOGLE_CLOUD_API_KEY"] = GOOGLE_CLOUD_API_KEY

# 若需要在程式中使用 credentials 物件
def get_credentials():
    """取得 Google Cloud 憑證物件"""
    if GOOGLE_APPLICATION_CREDENTIALS and Path(GOOGLE_APPLICATION_CREDENTIALS).exists():
        from google.oauth2 import service_account
        return service_account.Credentials.from_service_account_file(
            GOOGLE_APPLICATION_CREDENTIALS
        )
    return None 