import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  Button,
  Typography,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import { useDispatch, useSelector } from "react-redux";
import { createPaymentHistory, fetchPaymentHistoryList } from "../../redux/actions";
import { PAYMENT_PLANS, CONTRACT_TYPES } from "@/pages/dashboard/projectList"; // 引入常量

// 添加映射對象
const PAYMENT_PERIOD_TEXT_TO_VALUE = {
    'monthly': 1,      // 月繳
    'quarterly': 2,    // 季繳
    'semi-annual': 3,  // 半年繳
    'annual': 4        // 年繳
};

export function PaymentHistoryModal({ open, handleOpen, projectId, projectData }) {
  const dispatch = useDispatch();
  const paymentHistory = useSelector((state) => state.paymentHistory);
  
  // 使用 useEffect 來更新 newPayment 中的 project_id
  useEffect(() => {
    if (projectId) {
      setNewPayment(prev => ({
        ...prev,
        project_id: projectId
      }));
    }
  }, [projectId]);

  // 初始化 state 時不設置 project_id
  const [newPayment, setNewPayment] = useState({
    pay_type: "",
    pay_day: new Date().toISOString().split('T')[0],
    amount: "",
    remark: "",
  });

  // 當 modal 打開時才獲取數據
  useEffect(() => {
    if (open && projectId) {  // 確保有 projectId 時才發送請求
      dispatch(fetchPaymentHistoryList({ project_id: projectId }));
    }
  }, [open, projectId, dispatch]);

  useEffect(() => {
    if (projectData) {
        console.log('完整的 projectData:', projectData);
        console.log('payment_period 值:', projectData.payment_period);
        console.log('payment_period 類型:', typeof projectData.payment_period);
    }
  }, [projectData]);

  const handleCreatePayment = async () => {
    // 確保有 project_id
    if (!projectId) {
      alert("專案ID不能為空");
      return;
    }

    const paymentData = {
      ...newPayment,
      project_id: projectId  // 確保使用最新的 projectId
    };

    const result = await dispatch(createPaymentHistory(paymentData));
    if (result.success) {
      alert("新增成功");
      setNewPayment({
        pay_type: "",
        pay_day: new Date().toISOString().split('T')[0],
        amount: "",
        remark: "",
      });
    } else {
      alert(result.message);
    }
  };

  // 修改 getPaymentPlanLabel 函數
  const getPaymentPlanLabel = (value) => {
    console.log('收到的 payment_period:', value);
    console.log('payment_period 類型:', typeof value);
    
    // 如果是文字格式，先轉換為對應的數字
    if (typeof value === 'string') {
        const numericValue = PAYMENT_PERIOD_TEXT_TO_VALUE[value.toLowerCase()];
        if (numericValue) {
            const plan = PAYMENT_PLANS.find(plan => plan.value === numericValue);
            return plan?.label || '未知';
        }
    }
    
    // 如果已經是數字類型，直接使用
    if (typeof value === 'number') {
        const plan = PAYMENT_PLANS.find(plan => plan.value === value);
        return plan?.label || '未知';
    }
    
    // 如果是其他格式的字串，嘗試直接轉換為數字
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
        const plan = PAYMENT_PLANS.find(plan => plan.value === numericValue);
        return plan?.label || '未知';
    }
    
    return '未知';
  };

  // 取得合約類型名稱
  const getContractTypeLabel = (value) => {
    return CONTRACT_TYPES.find(type => type.value === value)?.label || '未知';
  };

  return (
    <Dialog open={open} handler={handleOpen} size="lg">
      <DialogHeader className="flex flex-col items-start">
        <div className="flex justify-between w-full mb-4">
          <Typography variant="h6">繳費歷程</Typography>
          <Button 
            variant="text" 
            color="blue-gray" 
            onClick={handleOpen}
          >
            關閉
          </Button>
        </div>
        
        {/* 專案資訊區塊 */}
        <div className="grid grid-cols-2 gap-4 w-full text-sm">
          <div className="flex items-center gap-2">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              專案名稱：
            </Typography>
            <Typography variant="small">
              {projectData?.projectName}
            </Typography>
          </div>
          
          <div className="flex items-center gap-2">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              客戶名稱：
            </Typography>
            <Typography variant="small">
              {projectData?.customerName}
            </Typography>
          </div>
          
          <div className="flex items-center gap-2">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              商務項目：
            </Typography>
            <Typography variant="small">
              {projectData?.businessItemName}
            </Typography>
          </div>
          
          <div className="flex items-center gap-2">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              付款方案：
            </Typography>
            <Typography variant="small">
              {getPaymentPlanLabel(projectData?.payment_period)}
            </Typography>
          </div>
          
          <div className="flex items-center gap-2">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              合約類型：
            </Typography>
            <Typography variant="small">
              {getContractTypeLabel(projectData?.contractType)}
            </Typography>
          </div>
        </div>
      </DialogHeader>
      
      <DialogBody divider>
        {/* 新增繳費表單 */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="繳費日期"
            value={newPayment.pay_day}
            onChange={(e) => setNewPayment({...newPayment, pay_day: e.target.value})}
          />
          <Select 
            label="繳費方式"
            value={newPayment.pay_type}
            onChange={(value) => setNewPayment({...newPayment, pay_type: value})}
          >
            <Option value="cash">現金</Option>
            <Option value="credit">信用卡</Option>
            <Option value="transfer">轉帳</Option>
          </Select>
          <Input
            label="金額"
            type="number"
            value={newPayment.amount}
            onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
          />
          <Input
            label="備註"
            className="col-span-2"
            value={newPayment.remark}
            onChange={(e) => setNewPayment({...newPayment, remark: e.target.value})}
          />
          <Button 
            className="col-span-2"
            onClick={handleCreatePayment}
            disabled={!newPayment.pay_day || !newPayment.pay_type || !newPayment.amount}
          >
            新增繳費紀錄
          </Button>
        </div>

        {/* 繳費歷程列表 */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-50 py-3 px-4 text-left">
                  <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                    繳費日期
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 py-3 px-4 text-left">
                  <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                    繳費方式
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 py-3 px-4 text-left">
                  <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                    金額
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 py-3 px-4 text-left">
                  <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                    備註
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.list.map((payment) => (
                <tr key={payment.id}>
                  <td className="py-3 px-4">
                    <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                      {new Date(payment.pay_day).toLocaleDateString('zh-TW')}
                    </Typography>
                  </td>
                  <td className="py-3 px-4">
                    <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                      {payment.pay_type}
                    </Typography>
                  </td>
                  <td className="py-3 px-4">
                    <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                      ${payment.amount}
                    </Typography>
                  </td>
                  <td className="py-3 px-4">
                    <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                      {payment.remark}
                    </Typography>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogBody>
    </Dialog>
  );
} 