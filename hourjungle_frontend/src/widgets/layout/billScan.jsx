import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
  Input,
  Textarea,
  Card,
  Select,
  Option,
  Tabs,
  TabsHeader,
  Tab,
} from "@material-tailwind/react";
import {
  useMaterialTailwindController,
  setOpenBillScan,
} from "@/context";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers } from "@/redux/actions";

// 添加社交媒体图标和其他图标
import { 
  FaFacebookMessenger, 
  FaLine, 
  FaShopify,
  FaRobot,
  FaUserEdit,
  FaDatabase,
  FaPlus,
  FaThumbsUp,
  FaThumbsDown,
  FaPaperPlane,
  FaLightbulb
} from 'react-icons/fa';

export default function BillScan() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openBillScan } = controller;
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [preprocessing, setPreprocessing] = useState("deskew");
  const [ocrMode, setOcrMode] = useState("text");
  const [activeTab, setActiveTab] = useState("results");
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const reduxDispatch = useDispatch();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerDisplay, setSelectedCustomerDisplay] = useState("");
  
  // 从 Redux 获取客户列表
  const customers = useSelector(state => state.customers?.list || []);

  // 组件加载时获取客户列表
  useEffect(() => {
    reduxDispatch(fetchCustomers());
  }, [reduxDispatch]);

  const handleClose = () => {
    setOpenBillScan(dispatch, false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    
    // 创建预览URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async () => {
    if (!selectedCustomerId) {
      alert('请先选择客户');
      return;
    }

    if (!selectedFile) {
      alert('请先选择一个文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('preprocessing', preprocessing);
    formData.append('ocr_mode', ocrMode);

    setLoading(true);

    try {
      // 1. 首先进行OCR识别
      console.log('开始发送OCR请求...');
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('收到OCR响应:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OCR请求失败:', response.status, errorText);
        throw new Error(`OCR请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('OCR响应数据:', data);

      if (data.error) {
        alert('错误: ' + data.error);
        return;
      }

      // 添加控制台输出
      console.log('===== 发票扫描结果 =====');
      console.log('OCR文本:', data.ocr_text);
      console.log('发票数据:', data.invoice_data);
      console.log('文件路径:', data.file_path);
      console.log('=======================');

      // 验证必填字段
      const requiredFields = {
        'invoice_number': '发票号码',
        'invoice_period': '发票期别',
        'date': '日期',
      };

      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!data.invoice_data[field]) {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        alert(`以下必填字段缺失：\n${missingFields.join('\n')}`);
        return;
      }

      // 2. 然后保存到数据库
      const selectedCustomerData = customers.find(c => (c.company_name || c.name) === selectedCustomerDisplay);
      const selectedCustomerId = selectedCustomerData?.id;
      
      // 确保日期格式正确 (YYYY-MM-DD)
      let formattedDate = data.invoice_data.date;
      if (formattedDate) {
        // 处理可能的日期格式，如 2025/02/12 转为 2025-02-12
        formattedDate = formattedDate.replace(/\//g, '-');
      }
      
      // 确保 items_data 是数组
      const itemsData = Array.isArray(data.invoice_data.items) ? data.invoice_data.items : [];
      
      // 确保发票号码格式正确（移除可能的空格或特殊字符）
      const invoiceNumber = data.invoice_data.invoice_number ? 
        data.invoice_data.invoice_number.replace(/\s+/g, '') : '';
      
      const billData = {
        customer_id: selectedCustomerId,
        customer_number: selectedCustomerData.number || '',  // 修正字段名称
        customer_name: selectedCustomerData.name || '',
        company_name: selectedCustomerData.company_name || '',
        invoice_number: invoiceNumber,
        invoice_period: data.invoice_data.invoice_period || '',
        date: formattedDate,
        time: data.invoice_data.time || '',
        buyer: data.invoice_data.buyer || '',
        address: data.invoice_data.address || '',
        total_amount: parseFloat(data.invoice_data.total_amount) || 0,
        tax_type: data.invoice_data.tax_type || '',
        has_stamp: Boolean(data.invoice_data.has_stamp),
        seller_tax_id: data.invoice_data.seller_tax_id || '',
        file_path: data.file_path || '',
        ocr_text: data.ocr_text || '',
        items_data: itemsData
      };

      console.log('准备发送到后端的数据:', billData);

      try {
        const saveResponse = await fetch('http://localhost:8000/api/bills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(billData)
        });

        let saveResult;
        try {
          // 尝试解析JSON响应
          saveResult = await saveResponse.json();
        } catch (parseError) {
          // 如果无法解析JSON，创建一个基本错误对象
          saveResult = { 
            status: 'error', 
            message: `服务器错误 (${saveResponse.status}): 无法解析响应` 
          };
        }

        if (!saveResponse.ok) {
          let errorMessage = '发票保存失败：\n';
          
          if (saveResult.errors) {
            // 处理验证错误
            Object.entries(saveResult.errors).forEach(([field, messages]) => {
              errorMessage += `${field}: ${messages.join(', ')}\n`;
            });
          } else if (saveResult.message) {
            errorMessage += saveResult.message;
          } else {
            errorMessage += '未知错误';
          }
          
          console.error('保存发票失败:', saveResult);
          alert(errorMessage);
          return;
        }
        
        if (saveResult.status === 'success') {
          alert('发票保存成功！');
          setInvoiceData({
            ...data.invoice_data,
            file_path: data.file_path
          });
          setOcrText(data.ocr_text);
          setActiveTab("results");
        } else {
          alert('发票保存失败：' + (saveResult.message || '未知错误'));
        }
      } catch (error) {
        console.error('保存发票时出错:', error);
        alert('保存发票时出错: ' + (error.message || '未知错误'));
      }
    } catch (error) {
      console.error('OCR识别出错:', error);
      alert('OCR识别失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCorrections = async () => {
    if (!invoiceData) {
      alert('沒有可提交的數據');
      return;
    }

    // 檢查是否有文件路徑
    if (!invoiceData.file_path) {
      alert('找不到圖片路徑');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_result: invoiceData,
          corrected_result: invoiceData,
          image_path: invoiceData.file_path  // 使用保存的文件路徑
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('修正已提交，謝謝您的反饋！');
      } else {
        alert('錯誤: ' + data.error);
      }
    } catch (error) {
      alert('請求失敗: ' + error);
    }
  };

  const handleExportData = () => {
    if (!invoiceData) {
      alert('沒有可匯出的數據');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + 
      encodeURIComponent(JSON.stringify(invoiceData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "invoice_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const refreshAnalysis = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analysis');
      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      alert('獲取分析數據失敗: ' + error);
    }
  };

  // 添加處理發票數據更改的函數
  const handleInvoiceDataChange = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 选择处理
  const handleCustomerSelect = (id) => {
    const customer = customers.find(c => c.id.toString() === id);
    setSelectedCustomerId(id);
    setSelectedCustomerDisplay(customer ? (customer.company_name || customer.name) : "");
  };

  return (
    <aside
      className={`fixed top-0 right-0 z-50 h-screen w-96 bg-white shadow-lg transition-transform duration-300 overflow-y-auto ${
        openBillScan ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="flex items-start justify-between px-6 pt-8 pb-6">
        <div>
          <Typography variant="h5" color="blue-gray">
            發票掃描
          </Typography>
        </div>
        <IconButton
          variant="text"
          color="blue-gray"
          onClick={handleClose}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="px-6 space-y-4">
        {/* 上傳區域 */}
        <Card className="p-4">
          <Typography variant="h6" className="mb-4">上傳發票</Typography>
          <div className="space-y-4">
          <Select
            label="選擇客戶"
            onChange={(value) => {
              const customer = customers.find(c => (c.company_name || c.name) === value);
              if (customer) {
                handleCustomerSelect(customer.id.toString());
              }
            }}
            required
          >
            {customers.map((customer) => (
              <Option key={customer.id} value={customer.company_name || customer.name}>
                {customer.company_name || customer.name} ({customer.number})
              </Option>
            ))}
          </Select>
            
            <Select 
              label="預處理方法" 
              value={preprocessing}
              onChange={(value) => setPreprocessing(value)}
            >
              <Option value="deskew">傾斜校正</Option>

              <Option value="basic">基本處理</Option>
              <Option value="adaptive">自適應閾值</Option>
              <Option value="otsu">Otsu閾值</Option>
              <Option value="morphological">形態學處理</Option>
              <Option value="clahe">局部對比度增強</Option>
              <Option value="denoise">雜訊去除</Option>
              <Option value="text_region">文字區域分割</Option>
              <Option value="perspective">透視校正</Option>
              <Option value="sharpen">自適應銳化</Option>
              <Option value="all">嘗試所有方法</Option>
            </Select>

            <Select 
              label="OCR模式" 
              value={ocrMode}
              onChange={(value) => setOcrMode(value)}
            >
              <Option value="text">基本文字識別</Option>
              <Option value="document">文檔識別</Option>
            </Select>

            <Input
              type="file"
              label="上傳發票"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />

            {previewUrl && (
              <div className="mt-4 space-y-4">
                <div className="w-full max-h-64 overflow-hidden rounded-lg">
                  <img 
                    src={previewUrl} 
                    alt="發票預覽" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button 
                  color="blue" 
                  className="w-full"
                  onClick={handleFileUpload}
                  disabled={loading}
                >
                  {loading ? '處理中...' : '上傳並辨識'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {loading && (
          <div className="text-center py-4">
            <Typography>處理中，請稍候...</Typography>
          </div>
        )}

        {/* 標籤頁 */}
        <Tabs value={activeTab}>
          <TabsHeader>
            <Tab 
              value="results" 
              onClick={() => setActiveTab("results")}
              className={activeTab === "results" ? "text-blue-500" : ""}
            >
              辨識結果
            </Tab>
            <Tab 
              value="raw-text" 
              onClick={() => setActiveTab("raw-text")}
              className={activeTab === "raw-text" ? "text-blue-500" : ""}
            >
              原始文字
            </Tab>
            <Tab 
              value="analysis" 
              onClick={() => setActiveTab("analysis")}
              className={activeTab === "analysis" ? "text-blue-500" : ""}
            >
              系統分析
            </Tab>
          </TabsHeader>
        </Tabs>

        {/* TabsBody 部分 */}
        <div className="mt-4">
          {/* 辨識結果 */}
          {activeTab === "results" && invoiceData && (
            <Card className="p-4">
              <Typography variant="h6" className="mb-4">發票資訊</Typography>
              <div className="space-y-2">
                <Input 
                  label="發票號碼" 
                  value={invoiceData.invoice_number || ''} 
                  onChange={(e) => handleInvoiceDataChange('invoice_number', e.target.value)}
                />
                <Input 
                  label="統一編號" 
                  value={invoiceData.seller_tax_id || ''} 
                  onChange={(e) => handleInvoiceDataChange('seller_tax_id', e.target.value)}
                />
                <Input 
                  label="發票期別" 
                  value={invoiceData.invoice_period || ''} 
                  onChange={(e) => handleInvoiceDataChange('invoice_period', e.target.value)}
                />
                <Input 
                  label="日期" 
                  value={invoiceData.date || ''} 
                  onChange={(e) => handleInvoiceDataChange('date', e.target.value)}
                />
                <Input 
                  label="時間" 
                  value={invoiceData.time || ''} 
                  onChange={(e) => handleInvoiceDataChange('time', e.target.value)}
                />
                <Input 
                  label="買受人" 
                  value={invoiceData.buyer || ''} 
                  onChange={(e) => handleInvoiceDataChange('buyer', e.target.value)}
                />
                <Input 
                  label="地址" 
                  value={invoiceData.address || ''} 
                  onChange={(e) => handleInvoiceDataChange('address', e.target.value)}
                />
                <Input 
                  label="總金額" 
                  value={invoiceData.total_amount || ''} 
                  onChange={(e) => handleInvoiceDataChange('total_amount', e.target.value)}
                />
                <Input 
                  label="課稅別" 
                  value={invoiceData.tax_type || ''} 
                  onChange={(e) => handleInvoiceDataChange('tax_type', e.target.value)}
                />
                <Input 
                  label="專用章" 
                  value={invoiceData.has_stamp ? '有' : '無'} 
                  onChange={(e) => handleInvoiceDataChange('has_stamp', e.target.value === '有')}
                />
              </div>

              {invoiceData.items && invoiceData.items.length > 0 && (
                <div className="mt-4">
                  <Typography variant="h6" className="mb-2">品項明細</Typography>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th>編號</th>
                          <th>品名</th>
                          <th>數量</th>
                          <th>單價</th>
                          <th>金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.number}</td>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit_price}</td>
                            <td>{item.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button color="blue" onClick={handleSubmitCorrections}>
                  提交修正
                </Button>
                <Button color="gray" onClick={handleExportData}>
                  匯出資料
                </Button>
              </div>
            </Card>
          )}

          {/* 原始文字 */}
          {activeTab === "raw-text" && ocrText && (
            <Card className="p-4">
              <Typography variant="h6" className="mb-2">
                OCR識別文字
              </Typography>
              <Textarea
                value={ocrText}
                rows={10}
                readOnly
              />
            </Card>
          )}

          {/* 系統分析 */}
          {activeTab === "analysis" && (
            <Card className="p-4">
              <Typography variant="h6" className="mb-2">系統分析</Typography>
              <Button color="blue" onClick={refreshAnalysis} className="mb-4">
                刷新分析
              </Button>
              
              {analysisData ? (
                <div>
                  <Typography>分析基於 {analysisData.total_samples} 個樣本</Typography>
                  <Typography variant="h6" className="mt-4 mb-2">錯誤模式分析</Typography>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>欄位</th>
                        <th>錯誤率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.error_patterns.map(([field, rate], index) => (
                        <tr key={index}>
                          <td>{field}</td>
                          <td>{rate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Typography variant="h6" className="mt-4 mb-2">改進建議</Typography>
                  <ul className="list-disc pl-4">
                    {analysisData.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Typography>
                  尚無分析數據。請先處理一些發票並提交修正，系統將分析常見錯誤模式。
                </Typography>
              )}
            </Card>
          )}
        </div>
      </div>
    </aside>
  );
}

BillScan.displayName = "/src/widgets/layout/billScan.jsx";
