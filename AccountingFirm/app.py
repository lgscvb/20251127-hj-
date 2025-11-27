# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, render_template, send_from_directory
import os
from werkzeug.utils import secure_filename
import json
import time
from functools import lru_cache
from flask_cors import CORS

# 導入我們的模組
from ocr_service import detect_text, detect_document
from image_processor import preprocess_image, try_all_preprocessing
from invoice_parser import InvoiceParser
from continuous_learning import collect_feedback_data, analyze_error_patterns

# 確保憑證設置
import setup_credentials

app = Flask(__name__)

# 配置 CORS，允許所有來源
CORS(app, 
     resources={r"/*": {
         "origins": "*",
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": False,  # 改為 False，因為使用 * 時不能為 True
         "expose_headers": ["Content-Type", "X-CSRFToken"]
     }})

# 添加 OPTIONS 請求處理
@app.route('/api/upload', methods=['OPTIONS'])
def handle_options():
    response = app.make_default_options_response()
    return response

app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上傳大小為 16MB
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'pdf'}

# 確保上傳目錄存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part", "error_code": "FILE_MISSING"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file", "error_code": "FILENAME_EMPTY"}), 400
        
        file_size = len(file.read())
        file.seek(0)  # 重置文件指針
        if file_size > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({"error": "File too large", "error_code": "FILE_TOO_LARGE"}), 413
        
        if file and allowed_file(file.filename):
            if not validate_file_type(file):
                return jsonify({"error": "Invalid file format", "error_code": "INVALID_FORMAT"}), 400
            filename = secure_filename(file.filename)
            timestamp = int(time.time())
            filename = "{0}_{1}".format(timestamp, filename)  # 添加時間戳避免文件名衝突
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            try:
                # 預處理圖像
                preprocessing_method = request.form.get('preprocessing', 'adaptive')
                if preprocessing_method == 'all':
                    processed_paths = try_all_preprocessing(file_path)
                    # 使用第一個處理結果
                    processed_path = list(processed_paths.values())[0] if processed_paths else file_path
                else:
                    processed_path = preprocess_image(file_path, preprocessing_method)
                
                # OCR 識別
                ocr_mode = request.form.get('ocr_mode', 'text')
                if ocr_mode == 'document':
                    ocr_result = detect_document(processed_path)
                    ocr_text = ocr_result['text']
                else:
                    ocr_text = detect_text(processed_path)
                
                # 解析發票信息
                parser = InvoiceParser(ocr_text)
                invoice_data = parser.extract_all()
                
                # 保存解析結果
                result_path = parser.save_result()
                
                return jsonify({
                    "success": True,
                    "file_path": file_path,
                    "processed_path": processed_path,
                    "ocr_text": ocr_text,
                    "invoice_data": invoice_data,
                    "result_path": result_path
                })
                
            except Exception as e:
                return jsonify({
                    "error": str(e),
                    "file_path": file_path
                }), 500
        
        return jsonify({"error": "File type not allowed"}), 400
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/analysis', methods=['GET'])
def get_analysis():
    try:
        analysis = analyze_error_patterns()
        return jsonify({
            'total_samples': analysis.get('total_samples', 0),
            'error_patterns': analysis.get('error_patterns', []),
            'recommendations': analysis.get('recommendations', [])
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "尚無分析數據。請先處理一些發票並提交修正，系統將分析常見錯誤模式。"
        }), 404

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "未收到數據"}), 400
            
        required_fields = ['original_result', 'corrected_result', 'image_path']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"缺少必要欄位: {field}"}), 400

        # 收集反饋數據
        feedback_file = collect_feedback_data(
            data['original_result'],
            data['corrected_result'],
            data['image_path']
        )
        
        return jsonify({
            "success": True,
            "message": "反饋已收集",
            "feedback_file": feedback_file
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 400

@lru_cache(maxsize=100)
def get_error_analysis():
    try:
        analysis = analyze_error_patterns()
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def validate_file_type(file):
    try:
        from PIL import Image
        image = Image.open(file)
        image.verify()
        file.seek(0)
        return True
    except:
        return False

if __name__ == '__main__':
    port = 5001  # 改用 5001 端口
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 