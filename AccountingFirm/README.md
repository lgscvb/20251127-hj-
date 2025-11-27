# 創建虛擬環境
python -m venv venv


# 啟動虛擬環境
# Windows:
venv\Scripts\activate


# Mac/Linux:
source venv/bin/activate

然後安裝依賴：
pip install -r requirements.txt



AccountingFirm/
├── app.py
├── config.py
├── ocr_service.py
├── image_processor.py
├── invoice_parser.py
├── continuous_learning.py
├── setup_credentials.py
├── requirements.txt
├── uploads/
└── templates/
    └── index.html


運行應用
# 方法1：直接運行
python app.py

# 方法2：使用 Flask CLI
flask run