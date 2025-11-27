# -*- coding: utf-8 -*-

import os

# 設置環境變數（推薦方式）
# 將路徑改為您實際的憑證文件位置
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./gifthouse-438703-56f858f70c1f.json"

# 設置 API 金鑰（如果需要）
os.environ["GOOGLE_CLOUD_API_KEY"] = "AIzaSyCuw8lXFtYnsy7I212Pr8HoeQ0uyPmzCMU"

# 提示：在生產環境中，應該從安全的配置或環境變數中讀取這些值
# 例如：os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GCP_CREDENTIALS_PATH")

# 方法2：在代碼中顯式提供憑證（不推薦在生產環境中使用）
from google.oauth2 import service_account
credentials = service_account.Credentials.from_service_account_file(
    "./gifthouse-438703-56f858f70c1f.json") 