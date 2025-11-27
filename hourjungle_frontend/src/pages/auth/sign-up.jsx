import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Switch,
  Textarea,
} from "@material-tailwind/react";
import { Link } from "react-router-dom";
import { createCustomerUser, fetchBranches } from "../../redux/actions";

export function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const branches = useSelector((state) => state.branches?.list || []);
  const user = useSelector(state => state.auth.user) || {};
  
  const [customerData, setCustomerData] = useState({
    number: '',           
    name: '',            
    branch_id: user?.branch_id || '',
    email: '',           
    id_number: '',       
    birthday: '',        
    address: '',         
    phone: '',    
    company_name: '',    
    company_number: '',  
    company_website: '', 
    company_email: '',   
    company_address: '', 
    company_phone: '', 
    company_fax: '',   
    company_contact_person: '', 
    company_contact_person_phone: '', 
    company_contact_person_email: '', 
    line_id: '',         
    line_nickname: '',   
    id_card_front: null, 
    id_card_back: null,  
    remark: '',          
    status: 1,           
    modify: 1            
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  // 在 useEffect 中生成随机编号
  useEffect(() => {
    // 生成随机客户编号 (例如: CUS + 年月日 + 4位随机数)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const customerNumber = `CUS${year}${month}${day}${random}`;
    
    setCustomerData(prev => ({
        ...prev,
        number: customerNumber
    }));
  }, []);

  // 处理文件上传
  const handleFileChange = (field) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setCustomerData({
          ...customerData,
          [field]: file
        });
      } else {
        alert('請上傳圖片檔案');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!customerData.name?.trim()) {
        alert('請填寫客戶姓名');
        return;
    }
    if (!customerData.id_number?.trim()) {
        alert('請填寫身分證字號');
        return;
    }
    if (!customerData.number?.trim()) {
        alert('請填寫客戶編號');
        return;
    }
    if (!customerData.email?.trim()) {
        alert('請填寫電子郵件');
        return;
    } 
    if (!customerData.phone?.trim()) {
        alert('請填寫電話');
        return;
    }


    try {
        const formData = new FormData();
        
        // 确保 name 字段被正确添加到 formData
        formData.append('name', customerData.name.trim());
        
        // 添加其他字段...
        Object.keys(customerData).forEach(key => {
            if (key !== 'id_card_front' && key !== 'id_card_back' && key !== 'name') {
                if (customerData[key] !== null && customerData[key] !== undefined) {
                    formData.append(key, customerData[key]);
                }
            }
        });

        // 处理文件上传
        if (customerData.id_card_front instanceof File) {
            formData.append('id_card_front', customerData.id_card_front);
        }
        if (customerData.id_card_back instanceof File) {
            formData.append('id_card_back', customerData.id_card_back);
        }

        const response = await dispatch(createCustomerUser(formData));
        if (response.success) {
            setShowSuccessDialog(true);
        } else {
            alert(response.message || '新增失敗');
        }
    } catch (error) {
        console.error('Create customer error:', error);
        alert('新增失敗');
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
  };

  return (
    <section className="m-8">
      <Card className="w-full max-w-[1000px] mx-auto p-8">
        <Typography variant="h4" color="blue-gray" className="mb-8 text-center">
          新增顧客資料
        </Typography>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基本資料 */}
          <Typography variant="h6" color="blue-gray" className="col-span-full mb-2">
            基本資料
          </Typography>
          
          <Input
            label="客戶編號"
            value={customerData.number}
            onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
            disabled
          />
          
          <Input
            label="客戶姓名"
            value={customerData.name}
            onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
            required
          />
          
          <Input
            label="身分證字號"
            value={customerData.id_number}
            onChange={(e) => setCustomerData({ ...customerData, id_number: e.target.value })}
            required
          />
          
          <Input
            type="date"
            label="生日"
            value={customerData.birthday}
            onChange={(e) => setCustomerData({ ...customerData, birthday: e.target.value })}
          />
          
          <Input
            label="電話"
            value={customerData.phone}
            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
            required
          />
          
          <Input
            label="電子郵件"
            type="email"
            value={customerData.email}
            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            required
          />
          
          <Input
            label="地址"
            className="col-span-full"
            value={customerData.address}
            onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
          />

          {/* 公司資料 */}
          <Typography variant="h6" color="blue-gray" className="col-span-full mt-4 mb-2">
            公司資料
          </Typography>
          
          <Input
            label="公司名稱"
            value={customerData.company_name}
            onChange={(e) => setCustomerData({ ...customerData, company_name: e.target.value })}
          />
          
          {/* ... 其他公司相关字段 ... */}

          {/* LINE資料 */}
          <Typography variant="h6" color="blue-gray" className="col-span-full mt-4 mb-2">
            LINE資料
          </Typography>
          
          <Input
            label="LINE ID"
            value={customerData.line_id}
            onChange={(e) => setCustomerData({ ...customerData, line_id: e.target.value })}
          />
          
          <Input
            label="LINE暱稱"
            value={customerData.line_nickname}
            onChange={(e) => setCustomerData({ ...customerData, line_nickname: e.target.value })}
          />

          {/* 身分證影本上傳 */}
          <Typography variant="h6" color="blue-gray" className="col-span-full mt-4 mb-2">
            身分證影本上傳
          </Typography>
          
          <div className="col-span-full grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2">
                身分證正面
              </Typography>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange('id_card_front')}
              />
              {customerData.id_card_front && (
                <img 
                  src={URL.createObjectURL(customerData.id_card_front)}
                  alt="身分證正面預覽"
                  className="mt-2 max-w-[300px]"
                />
              )}
            </div>
            
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2">
                身分證背面
              </Typography>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange('id_card_back')}
              />
              {customerData.id_card_back && (
                <img 
                  src={URL.createObjectURL(customerData.id_card_back)}
                  alt="身分證背面預覽"
                  className="mt-2 max-w-[300px]"
                />
              )}
            </div>
          </div>

          {/* 其他設定 */}
          <Typography variant="h6" color="blue-gray" className="col-span-full mt-4 mb-2">
            其他設定
          </Typography>
          
          <div className="col-span-full">
            <Textarea
              label="備註"
              value={customerData.remark}
              onChange={(e) => setCustomerData({ ...customerData, remark: e.target.value })}
            />
          </div>

          

          {/* 提交按鈕 */}
          <div className="col-span-full flex justify-end gap-4 mt-6">
            <Button variant="outlined" color="red" onClick={() => navigate('/dashboard/customers')}>
              取消
            </Button>
            <Button type="submit" variant="gradient" color="green">
              新增
            </Button>
          </div>
        </form>
      </Card>

      {/* 成功對話框 */}
      <Dialog open={showSuccessDialog} handler={handleSuccessConfirm}>
        <DialogHeader>
          <Typography variant="h5" color="blue-gray">
            新增成功
          </Typography>
        </DialogHeader>
        <DialogBody divider className="grid place-items-center gap-4">
          <Typography className="text-center font-normal">
            顧客資料已成功新增！請通知客服人員進行審核。
          </Typography>
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button variant="gradient" onClick={handleSuccessConfirm} fullWidth>
            確認
          </Button>
        </DialogFooter>
      </Dialog>
    </section>
  );
}

export default SignUp;
