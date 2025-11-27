# 安裝必要的套件
import subprocess

packages = [
    "tensorflow",
    "google-cloud-vision",
    "flask",  # 或其他後端框架
    "pillow",  # 圖像處理
    "pandas",
    "numpy",
    "matplotlib",
    "opencv-python"
]

for package in packages:
    subprocess.call(["pip", "install", package])

# 設置 Google Cloud 認證
# 請先從 Google Cloud Console 下載認證文件
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/your/credentials.json" 