import { useState } from "react";
import {
  Card,
  Input,
  Button,
  Typography,
  Spinner,
  Alert,
} from "@material-tailwind/react";

export function Test() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // 請替換成您的 Google Cloud Vision API Key
  const API_KEY = 'YOUR_VISION_API_KEY';

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 檢查文件大小（限制為 10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError('文件大小不能超過 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      // 創建預覽 URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('請先選擇圖片');
      return;
    }

    if (!API_KEY || API_KEY === 'YOUR_VISION_API_KEY') {
      setError('請設置有效的 API Key');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 將圖片轉換為 base64
      const base64Image = await convertToBase64(selectedFile);
      
      // 準備 API 請求
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image.split(',')[1]
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      };

      // 發送請求到 Google Cloud Vision API
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 處理結果
      if (data.responses && data.responses[0].textAnnotations) {
        setResults(data.responses[0].textAnnotations[0].description);
      } else {
        setResults('未檢測到文字');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || '處理失敗');
    } finally {
      setLoading(false);
    }
  };

  // 將文件轉換為 base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <section className="m-8 flex justify-center">
      <Card color="transparent" shadow={false} className="items-center">
        <Typography variant="h4" color="blue-gray" className="mb-4">
          發票辨識測試
        </Typography>
        
        {error && (
          <Alert color="red" className="mb-4">
            {error}
          </Alert>
        )}
        
        <form className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
          <div className="mb-4 flex flex-col gap-6">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
              labelProps={{
                className: "hidden",
              }}
              containerProps={{ className: "min-w-[100px]" }}
            />

            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}

            <Button
              className="mt-6"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              fullWidth
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" /> 處理中...
                </div>
              ) : (
                "開始辨識"
              )}
            </Button>
          </div>
        </form>

        {results && (
          <Card className="w-full mt-6 p-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              辨識結果
            </Typography>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
              {results}
            </pre>
          </Card>
        )}
      </Card>
    </section>
  );
}

export default Test;
