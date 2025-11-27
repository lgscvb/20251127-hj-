import React, { useMemo } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Avatar,
    Chip,
    Tooltip,
    Progress,
    Button,
    ButtonGroup,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Textarea,
    Switch,
    IconButton,
    Option,
    Select,
    Spinner,
    Tab,
    Tabs,
    TabsHeader,
    Pagination,
} from "@material-tailwind/react";
import {
    HomeIcon,
    ChatBubbleLeftEllipsisIcon,
    Cog6ToothIcon,
    PencilIcon,
    EyeSlashIcon,
    DocumentTextIcon,
    CurrencyDollarIcon
  } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { ArrowRightIcon, ArrowLeftIcon, EyeIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers, fetchBusinessItems, fetchProjects, createProject, updateProject, deleteProject, getProjectInfo, sendLineMessage, fetchLineBotList, importProjects, exportProjects, exportProjectsExample, viewContractPdf } from "@/redux/actions";
import { Link } from "react-router-dom";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import { PaymentHistoryModal } from "@/components/PaymentHistory/PaymentHistoryModal";
import { usePermission } from '@/hooks/usePermission';
import { isNearPayment, isOverdue, formatDate, formatDateTime } from '@/utils/dateUtils';
// 添加 xlsx 引入
import * as XLSX from 'xlsx';



// 付款方案選項
export const PAYMENT_PLANS = [
    { value: 1, label: "月繳", months: 1, periodsPerYear: 12 },
    { value: 2, label: "季繳(3個月)", months: 3, periodsPerYear: 4 },
    { value: 3, label: "半年繳(6個月)", months: 6, periodsPerYear: 2 },
    { value: 4, label: "年繳(12個月)", months: 12, periodsPerYear: 1 }
];

// 合約類型選項
export const CONTRACT_TYPES = [
    { value: "1", label: "1年約", years: 1 },
    { value: "2", label: "2年約", years: 2 },
    { value: "3", label: "3年約", years: 3 }
];

// 定義合約狀態常量
const CONTRACT_STATUS = {
    DRAFT: 0,      // 未提交審核
    ACTIVE: 1,     // 已審核
    EXPIRED: 2,    // 已到期
    TERMINATED: 3,  // 已終止
    CHECKING: 4    // 審核中
};

// 修改 projectData 的初始狀態
const initialProjectData = {
    projectName: '',
    business_item_id: '',
    customer_id: '',
    member_id: '',
    branch_id: '',
    start_day: '',
    end_day: '',
    signing_day: '',
    pay_day: '',
    payment_period: '',
    contractType: '',
    original_price: 0,
    sale_price: 0,
    current_payment: 0,
    total_payment: 0,
    next_pay_day: '',
    last_pay_day: '',
    contract_status: 0,
    penaltyFee: 0,
    deposit: 0,
    lateFee: 3,
    status: 1,
    broker: '',
    broker_remark: '',
    remark: ''
};
// 修改判斷日期的函數
const getRowStyle = (nextPayDay, endDay) => {
    const today = new Date();
    
    // 檢查合約到期日
    if (endDay) {
        const contractEndDate = new Date(endDay);
        const contractDiffDays = Math.ceil((contractEndDate - today) / (1000 * 60 * 60 * 24));
        
        // 合約已過期
        if (contractDiffDays < 0) {
            return 'bg-gray-100'; // 灰色
        }
        // 合約即將到期（30天內）
        if (contractDiffDays <= 30) {
            return 'bg-blue-50'; // 淺藍色
        }
    }

    // 檢查付款日期
    if (nextPayDay) {
        const payDate = new Date(nextPayDay);
        const payDiffDays = Math.ceil((payDate - today) / (1000 * 60 * 60 * 24));
        
        // 付款已逾期
        if (payDiffDays < 0) {
            return 'bg-red-50';
        }
        // 付款即將到期（5天內）
        if (payDiffDays <= 5) {
            return 'bg-amber-50';
        }
    }
    
    return '';
};

// 計算下次繳費日和合約到期日
const calculateDates = (startDate, paymentPlan, contractType, paymentDay) => {
    if (!startDate) return { next_pay_day: '', contractEndDate: '' };

    // 使用 YYYY-MM-DD 格式處理日期
    const start = new Date(startDate + 'T00:00:00');
    const paymentDayNum = start.getDate();
    
    // 計算下次繳費日
    let nextPayment = new Date(start);
    const monthsToAdd = PAYMENT_PLANS.find(p => p.value === paymentPlan)?.months || 1;
    nextPayment.setMonth(nextPayment.getMonth() + monthsToAdd);
    
    // 處理月底日期問題
    const lastDayOfMonth = new Date(nextPayment.getFullYear(), nextPayment.getMonth() + 1, 0).getDate();
    nextPayment.setDate(Math.min(paymentDayNum, lastDayOfMonth));

    // 計算合約到期日
    let endDate = new Date(start);
    const yearsToAdd = CONTRACT_TYPES.find(t => t.value === contractType)?.years || 1;
    endDate.setFullYear(endDate.getFullYear() + yearsToAdd);
    endDate.setDate(start.getDate());

    return {
        next_pay_day: nextPayment.toISOString().split('T')[0],
        contractEndDate: endDate.toISOString().split('T')[0],
        paymentDay: paymentDayNum
    };
};

// 計算當期款項
const calculateCurrentPayment = (periodAmount, paymentPlan) => {
    const plan = PAYMENT_PLANS.find(p => p.value === paymentPlan);
    return periodAmount * (plan?.months || 1);
};

// 計算總期數
const calculateTotalPeriods = (paymentPlan, contractType) => {
    const plan = PAYMENT_PLANS.find(p => p.value === paymentPlan);
    const contract = CONTRACT_TYPES.find(t => t.value === contractType);
    return (plan?.periodsPerYear || 12) * (contract?.years || 1);
};

// 在檔案頂部添加映射表
const PAYMENT_PERIOD_MAP = {
    "月繳": 1,
    "季繳(3個月)": 2,
    "半年繳(6個月)": 3,
    "年繳(12個月)": 4
};

const TABLE_HEADERS = [
    "專案名稱",
    "客戶名稱",
    "商務項目",
    "付款方案",
    "合約類型",
    "起租時間",
    "下次繳費日",
    "合約到期日",
    "狀態",
    "操作"
];


export function ProjectList() {

    const dispatch = useDispatch();
    const { list: customers } = useSelector(state => state.customers);
    const { list: branches } = useSelector(state => state.branches);
    const { list: businessItems } = useSelector(state => state.businessItems);
    const { list: lineBots } = useSelector(state => state.lineBot);
    const user = useSelector(state => state.auth.user);
    
    // 從 Redux store 獲取專案列表數據
    const { list: projects, loading, error: projectsError, pagination } = useSelector(state => {
        console.log('專案列表狀態:', state.projects);
        return state.projects;
    });
    const { hasPermission, isTopAccount } = usePermission();
    
    // 分頁相關 state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // 修改分頁相關邏輯
    const totalPages = Math.ceil(pagination.total / pagination.per_page);

    // 搜尋參數 state
    const [searchParams, setSearchParams] = useState({
        projectName: '',
        customer_id: '',
        start_day: '',
        next_pay_day: '',
        status: '',
        keyword: ''
    });

    // 其他 state...
    const [selectedFile, setSelectedFile] = useState(null);
    const [open, setOpen] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const [projectData, setProjectData] = useState(initialProjectData);
    const [viewMode, setViewMode] = useState('view');
    const [detailOpen, setDetailOpen] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedProjectIndex, setSelectedProjectIndex] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // 在組件頂部準備數據
    const projectNames = useMemo(() => 
        Array.from(new Set(projects.map(project => project.projectName)))
            .filter(Boolean)
    , [projects]);

    // 處理頁碼變更
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 獲取當前頁的數據
    const getCurrentPageData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return projects.slice(start, end);
    };

    // 處理查看按鈕
    const handleView = async (projectId) => {
        try {
            console.log('查看專案 ID:', projectId);
            const result = await dispatch(getProjectInfo(projectId));
            console.log('查看專案結果:', result);
            
            if (result.success) {
                // 確保所有欄位與後端完全匹配
                setProjectData({
                    id: result.data.id,
                    projectName: result.data.projectName,
                    business_item_id: result.data.business_item_id,
                    businessItemName: result.data.businessItemName,
                    customer_id: result.data.customer_id,
                    customerName: result.data.customerName,
                    member_id: result.data.member_id,
                    branch_id: result.data.branch_id,
                    branchName: result.data.branchName,
                    start_day: result.data.start_day,
                    end_day: result.data.end_day,
                    signing_day: result.data.signing_day,
                    pay_day: result.data.pay_day,
                    payment_period: result.data.payment_period,
                    contractType: result.data.contractType,
                    original_price: result.data.original_price,
                    sale_price: result.data.sale_price,
                    current_payment: result.data.current_payment,
                    total_payment: result.data.total_payment,
                    next_pay_day: result.data.next_pay_day,
                    last_pay_day: result.data.last_pay_day,
                    contract_status: result.data.contract_status,
                    penaltyFee: result.data.penaltyFee,
                    deposit: result.data.deposit,
                    lateFee: result.data.lateFee,
                    status: result.data.status,
                    broker: result.data.broker,
                    broker_remark: result.data.broker_remark,
                    remark: result.data.remark
                });
                setViewMode('view');
                setDetailOpen(true);
            } else {
                alert(result.message || '獲取專案資訊失敗');
            }
        } catch (error) {
            console.error('獲取專案資訊失敗:', error);
            alert('獲取專案資訊失敗');
        }
    };

    // 處理編輯按鈕
    const handleEdit = async (projectId) => {
        try {
            console.log('編輯專案 ID:', projectId);
            const result = await dispatch(getProjectInfo(projectId));
            console.log('編輯專案結果:', result);
            
            if (result.success) {
                // 計算總期數
                const totalPeriods = calculateTotalPeriods(
                    result.data.payment_period,
                    result.data.contractType
                );

                // 確保所有欄位與後端完全匹配，並轉換為正確的格式
                setProjectData({
                    ...result.data,
                    // 確保 ID 類型為字串
                    customer_id: result.data.customer_id.toString(),
                    business_item_id: result.data.business_item_id.toString(),
                    // 確保日期格式正確
                    start_day: result.data.start_day?.split('T')[0] || '',
                    end_day: result.data.end_day?.split('T')[0] || '',
                    signing_day: result.data.signing_day?.split('T')[0] || '',
                    next_pay_day: result.data.next_pay_day?.split('T')[0] || '',
                    // 確保數值類型正確
                    payment_period: parseInt(result.data.payment_period),
                    contractType: result.data.contractType,
                    original_price: parseFloat(result.data.original_price),
                    sale_price: parseFloat(result.data.sale_price),
                    deposit: parseFloat(result.data.deposit),
                    penaltyFee: parseFloat(result.data.penaltyFee),
                    lateFee: parseFloat(result.data.lateFee),
                    // 添加計算的總期數
                    totalPeriods: totalPeriods
                });
                setViewMode('edit');
                setDetailOpen(true);
            } else {
                alert(result.message || '獲取專案資訊失敗');
            }
        } catch (error) {
            console.error('獲取專案資訊失敗:', error);
            alert('獲取專案資訊失敗');
        }
    };

    // 處理詳情視窗開關
    const handleOpenDetail = () => setDetailOpen(!detailOpen);

    // 搜尋處理函數
    const handleSearch = () => {
        dispatch(fetchProjects({
            page: 1,
            per_page: itemsPerPage,
            keyword: searchParams.projectName || '',
            customer_id: searchParams.customer_id || '',
            start_date: searchParams.start_day || '',
            next_payment_date: searchParams.next_pay_day || '',
            status: searchParams.status || ''
        }));
        setCurrentPage(1);
        setSelectedProject("");  // 重置專案選中值
        setSelectedCustomer("");  // 重置客戶選中值
    };

    // 修改 handleBusinessItemChange
    const handleBusinessItemChange = (value) => {
        const selectedItem = businessItems.find(item => item.id.toString() === value);
        if (selectedItem) {
            setProjectData(prev => {
                // 計算期數
                const totalPeriods = calculateTotalPeriods(prev.payment_period, prev.contractType);
                
                // 計算當期款項
                const currentPayment = calculateCurrentPayment(selectedItem.price, prev.payment_period);

                return {
                    ...prev,
                    business_item_id: value,
                    original_price: selectedItem.price,
                    sale_price: currentPayment,
                    deposit: selectedItem.deposit,
                    penaltyFee: selectedItem.deposit,
                    totalPeriods: totalPeriods
                };
            });
        }
    };

    // 處理付款方案變更
    const handlePaymentPlanChange = (value) => {
        setProjectData(prev => {
            // 計算新的期數
            const newTotalPeriods = calculateTotalPeriods(value, prev.contractType);
            
            // 計算新的當期款項
            const newCurrentPayment = calculateCurrentPayment(prev.original_price, value);
            
            // 重新計算下次繳費日
            const dates = calculateDates(
                prev.start_day,
                value,
                prev.contractType,
                prev.pay_day
            );

            return {
                ...prev,
                payment_period: value,
                totalPeriods: newTotalPeriods,
                sale_price: newCurrentPayment,
                next_pay_day: dates.next_pay_day
            };
        });
    };

    // 處理合約類型變更
    const handleContractTypeChange = (value) => {
        setProjectData(prev => {
            const newTotalPeriods = calculateTotalPeriods(prev.payment_period, value);
            const dates = calculateDates(
                prev.start_day,
                prev.payment_period,
                value,
                prev.pay_day
            );

            return {
                ...prev,
                contractType: value,
                totalPeriods: newTotalPeriods,
                end_day: dates.contractEndDate
            };
        });
    };

    // 處理起租日期變更
    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        // 確保使用 YYYY-MM-DD 格式
        const dates = calculateDates(
            newStartDate,
            projectData.payment_period,
            projectData.contractType
        );

        setProjectData(prev => ({
            ...prev,
            start_day: newStartDate,
            next_pay_day: dates.next_pay_day,
            end_day: dates.contractEndDate,
            pay_day: dates.paymentDay
        }));
    };

    // 處理約定繳費日變更
    const handlePaymentDayChange = (e) => {
        const newPaymentDay = e.target.value;
        if (newPaymentDay >= 1 && newPaymentDay <= 31) {
            const dates = calculateDates(
                projectData.start_day,
                projectData.payment_period,
                projectData.contractType,
                newPaymentDay
            );

            setProjectData(prev => ({
                ...prev,
                pay_day: newPaymentDay,
                next_pay_day: dates.next_pay_day
            }));
        }
    };

    // 修改生成合約的處理函數
    const handleGenerateContract = async (projectId) => {
        try {
            const result = await dispatch(getProjectInfo(projectId));
            if (!result.success) {
                alert('獲取專案資訊失敗');
                return;
            }

            const project = result.data;  // 後端返回的完整數據
            
            // 檢查合約狀態
            if (project.status === CONTRACT_STATUS.TERMINATED) {
                alert('此合約已終止，無法生成合約文件');
                return;
            }

            // 檢查必要數據
            const requiredFields = {
                customerName: '客戶資料',
                signing_day: '簽約日期',
                start_day: '起租日期',
                end_day: '到期日期',
                pay_day: '繳費日',
                sale_price: '合約金額'
            };

            for (const [field, label] of Object.entries(requiredFields)) {
                if (!project[field] && project[field] !== 0) {
                    alert(`缺少${label}，無法生成合約`);
                    return;
                }
            }

            // 格式化日期（去除時間部分）
            const formattedDate = project.signing_day.split('T')[0].replace(/-/g, '');
            
            // 準備合約所需數據，完全匹配後端資料結構
            const contractData = {
                id: project.id,
                projectName: project.projectName,
                business_item_id: project.business_item_id,
                businessItemName: project.businessItemName,
                customer_id: project.customer_id,
                customerName: project.customerName,
                member_id: project.member_id,
                branch_id: project.branch_id,
                branchName: project.branchName,
                start_day: project.start_day.split('T')[0],
                end_day: project.end_day.split('T')[0],
                signing_day: project.signing_day.split('T')[0],
                pay_day: project.pay_day,
                payment_period: project.payment_period,
                contractType: project.contractType,
                original_price: project.original_price,
                sale_price: project.sale_price,
                current_payment: project.current_payment,
                total_payment: project.total_payment,
                next_pay_day: project.next_pay_day,
                last_pay_day: project.last_pay_day,
                contract_status: project.contract_status,
                penaltyFee: project.penaltyFee,
                deposit: project.deposit,
                lateFee: project.lateFee,
                status: project.status,
                broker: project.broker,
                broker_remark: project.broker_remark,
                remark: project.remark
            };

            console.log('準備生成合約，合約資訊:', contractData);
            
            // 生成合約 URL
            const contractUrl = `${window.location.origin}/auth/contract/${project.customer_id}/${formattedDate}/${project.id}`;
            
            // 在新分頁中打開合約頁面
            const contractWindow = window.open(contractUrl, '_blank');
            
            // 傳遞合約數據到新窗口
            if (contractWindow) {
                contractWindow.contractData = contractData;
            }

        } catch (error) {
            console.error('生成合約失敗:', error);
            alert('生成合約失敗: ' + (error.message || '未知錯誤'));
        }
    };

    // 從表單生成合約預覽
    const handleGenerateContractPreview = () => {
        try {
            // 檢查必要資料
            const requiredFields = {
                projectName: '專案名稱',
                customer_id: '客戶',
                business_item_id: '商務項目',
                start_day: '起租時間',
                end_day: '合約到期日',
                signing_day: '簽約日期',
                pay_day: '約定繳費日',
                payment_period: '付款方案',
                sale_price: '當期款項',
                deposit: '押金'
            };

            for (const [field, label] of Object.entries(requiredFields)) {
                if (!projectData[field]) {
                    alert(`請先填寫${label}`);
                    return;
                }
            }

            // 獲取關聯資料的名稱
            const customer = customers.find(c => c.id.toString() === projectData.customer_id.toString());
            const businessItem = businessItems.find(b => b.id.toString() === projectData.business_item_id.toString());
            
            // 格式化日期（去除時間部分）
            const formattedDate = projectData.signing_day.split('T')[0].replace(/-/g, '');
            
            // 準備預覽數據
            const previewData = {
                ...projectData,
                customerName: customer?.name,
                businessItemName: businessItem?.name,
                branchName: user.branch?.name,
                start_day: projectData.start_day.split('T')[0],
                end_day: projectData.end_day.split('T')[0],
                signing_day: projectData.signing_day.split('T')[0],
                isPreview: true
            };

            console.log('準備預覽合約，預覽資訊:', previewData);

            // 生成預覽 URL
            const previewUrl = `${window.location.origin}/dashboard/contract/${projectData.customer_id}/${formattedDate}/preview`;
            
            // 在新分頁中打開預覽頁面
            const previewWindow = window.open(previewUrl, '_blank');
            
            // 傳遞預覽數據到新窗口
            if (previewWindow) {
                previewWindow.contractData = previewData;
            }

        } catch (error) {
            console.error('生成合約預覽失敗:', error);
            alert('生成合約預覽失敗: ' + (error.message || '未知錯誤'));
        }
    };

    // 修改 handleOpenAdd 的處理方式
    const handleOpenAdd = (open) => {
        if (open) {
            // 開啟新增對話框時，重置表單數據為初始狀態
            setProjectData({...initialProjectData});
        }
        setOpenAdd(open);
    };

    // 處理表單提交
    const handleProjectSubmit = async () => {
        // 驗證必填欄位
        const requiredFields = {
            projectName: '專案名稱',
            business_item_id: '商務項目',
            customer_id: '客戶',
            start_day: '起租時間',
            end_day: '合約到期日',
            signing_day: '簽約日期',
            pay_day: '約定繳費日',
            payment_period: '付款方案',
            contractType: '合約類型',
            sale_price: '當期款項',
            original_price: '原價',
            deposit: '押金',
            penaltyFee: '違約金',
            lateFee: '滯納金比例'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
            if (!projectData[field] && projectData[field] !== 0) {
                alert(`請填寫${label}`);
                return;
            }
        }

        try {
            // 準備提交的數據
            const submitData = {
                projectName: projectData.projectName,
                business_item_id: parseInt(projectData.business_item_id),
                customer_id: parseInt(projectData.customer_id),
                member_id: parseInt(user.id),
                branch_id: parseInt(user.branch_id),
                start_day: projectData.start_day,  // 直接使用 YYYY-MM-DD 格式
                end_day: projectData.end_day,      // 直接使用 YYYY-MM-DD 格式
                signing_day: projectData.signing_day, // 直接使用 YYYY-MM-DD 格式
                pay_day: parseInt(projectData.pay_day),
                payment_period: parseInt(projectData.payment_period),
                contractType: projectData.contractType,
                original_price: parseFloat(projectData.original_price),
                sale_price: parseFloat(projectData.sale_price),
                current_payment: parseFloat(projectData.sale_price),
                total_payment: calculateTotalPayment(
                    projectData.sale_price,
                    projectData.contractType,
                    projectData.payment_period
                ),
                next_pay_day: projectData.next_pay_day, // 直接使用 YYYY-MM-DD 格式
                last_pay_day: projectData.last_pay_day ? formatDate(projectData.last_pay_day) : null,
                contract_status: projectData.contract_status || 0,
                penaltyFee: parseFloat(projectData.penaltyFee) || 0,
                deposit: parseFloat(projectData.deposit) || 0,
                lateFee: parseFloat(projectData.lateFee) || 3,
                status: projectData.status || 1,
                broker: projectData.broker || '',
                broker_remark: projectData.broker_remark || '',
                remark: projectData.remark || ''
            };

            console.log('送出的數據:', submitData);

            const result = projectData.id 
                ? await dispatch(updateProject({ ...submitData, id: projectData.id }))
                : await dispatch(createProject(submitData));

            if (result.success) {
                alert(projectData.id ? '更新成功！' : '新增成功！');
                handleOpenAdd(false);  // 使用新的處理函數
                dispatch(fetchProjects({
                    page: currentPage,
                    per_page: itemsPerPage
                }));
            } else {
                alert(result.message || '操作失敗');
            }
        } catch (error) {
            console.error('操作失敗:', error);
            alert(error.response?.data?.message || '操作失敗');
        }
    };

    // 添加計算總金額函數
    const calculateTotalPayment = (salePrice, contractType, paymentPeriod) => {
        const years = CONTRACT_TYPES.find(t => t.value === contractType)?.years || 1;
        return parseFloat(salePrice) * years;
    };

    // 切換查看/編輯模式
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'view' ? 'edit' : 'view');
    };

    // 修改 handleCancel 函數
    const handleCancel = () => {
        if (viewMode === 'edit') {
            // 如果是編輯模式，重置數據並關閉
            setProjectData({...initialProjectData});
            setDetailOpen(false);
        } else {
            // 如果是查看模式，直接關閉
            setDetailOpen(false);
        }
    };

    // 修改 handleSaveEdit 函數
    const handleSaveEdit = async () => {
        try {
            const response = await dispatch(updateProject({
                ...projectData,
                status: projectData.status
            }));

            if (response.success) {
                // 使用 setDetailOpen 而不是 setOpen
                setDetailOpen(false);
                // 重新獲取專案列表
                dispatch(fetchProjects(searchParams));
            } else {
                setError(response.message || '更新失敗');
            }
        } catch (error) {
            setError('更新時發生錯誤');
            console.error('更新專案時發生錯誤:', error);
        }
    };

    // 添加刪除專案函數
    const handleDelete = async (id) => {
        if (window.confirm('確定要刪除此專案嗎？')) {
            try {
                const result = await dispatch(deleteProject(id));
                if (result.success) {
                    alert('刪除成功！');
                    // 重新獲取列表
                    dispatch(fetchProjects({
                        page: currentPage,
                        per_page: itemsPerPage
                    }));
                } else {
                    alert(result.message || '刪除失敗');
                }
            } catch (error) {
                console.error('刪除專案失敗:', error);
                alert('刪除失敗');
            }
        }
    };

    // 初始化數據
    useEffect(() => {
        setIsLoading(true);
        try {
            dispatch(fetchCustomers({
                page: 1,
                per_page: 9999,
                keyword: ''
            }));

            dispatch(fetchBusinessItems({
                page: 1,
                per_page: 9999,
                keyword: ''
            }));

            // 添加這行來獲取 LINE Bot 設置
            dispatch(fetchLineBotList());

            const fetchData = async () => {
                const response = await dispatch(fetchProjects({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchParams.projectName || ''
                }));
                console.log('專案列表數據:', response);
            };
            
            fetchData();

        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, currentPage, itemsPerPage]);

    // 添加狀態格式化函數
    const getStatusColor = (status) => {
        switch (status) {
            case CONTRACT_STATUS.ACTIVE:
                return "green";
            case CONTRACT_STATUS.EXPIRED:
                return "amber";
            case CONTRACT_STATUS.TERMINATED:
                return "red";
                case CONTRACT_STATUS.CHECKING:
                    return "yellow";
            default:
                return "blue-gray";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case CONTRACT_STATUS.ACTIVE:
                return "已審核";
            case CONTRACT_STATUS.EXPIRED:
                return "已到期";
            case CONTRACT_STATUS.TERMINATED:
                return "已終止";
            case CONTRACT_STATUS.CHECKING:
                return "審核中";
            default:
                return "未提交審核";
        }
    };

    // 修改 getFilteredProjects 函數
    const getFilteredProjects = () => {
        console.log('開始過濾專案，當前搜尋參數:', searchParams);
        
        const filtered = projects.filter(project => {
            // 如果有關鍵字，檢查所有相關欄位
            if (searchParams.keyword) {
                const keyword = searchParams.keyword.toLowerCase();
                
                // 先找到對應的付款方案和合約類型文字
                const paymentPlanLabel = project.payment_period || '';  // 直接使用後端傳來的文字
                const contractTypeLabel = CONTRACT_TYPES.find(t => t.value === project.contractType)?.label || '';
                const statusLabel = getStatusText(project.status);

                // 如果需要轉換為數字
                const paymentPeriodValue = PAYMENT_PERIOD_MAP[project.payment_period];

                const searchableFields = [
                    project.projectName,
                    project.customerName,
                    project.businessItemName,
                    project.broker,
                    project.broker_remark,
                    project.remark,
                    paymentPlanLabel,    // 直接使用後端的付款方案文字
                    contractTypeLabel,   // 合約類型轉換
                    statusLabel         // 狀態轉換
                ];

                // 如果沒有任何欄位包含關鍵字，返回 false
                if (!searchableFields.some(field => 
                    field && field.toString().toLowerCase().includes(keyword)
                )) {
                    return false;
                }
            }
            
            // 其他現有的過濾條件
            if (searchParams.projectName && 
                !project.projectName.toLowerCase().includes(searchParams.projectName.toLowerCase())) {
                return false;
            }
            
            if (searchParams.customer_id && 
                project.customer_id.toString() !== searchParams.customer_id) {
                return false;
            }
            
            if (searchParams.start_day && 
                project.start_day.split('T')[0] !== searchParams.start_day) {
                return false;
            }
            
            if (searchParams.next_pay_day && 
                project.next_pay_day.split('T')[0] !== searchParams.next_pay_day) {
                return false;
            }
            
            if (searchParams.status !== '') {
                return project.status.toString() === searchParams.status;
            }
            
            return true;
        });
        
        console.log('過濾後的專案數量:', filtered.length);
        return filtered;
    };

    // 修改搜尋參數處理函數
    const handleSearchParamsChange = (newParams) => {
        console.log('正在更新搜尋參數');
        console.log('新的參數值:', newParams);
        
        setSearchParams(newParams);
        
        // 立即驗證更新後的值
        console.log('更新後的 searchParams:', newParams);
    };

    // 先在組件頂部加入一個 console.log 來查看數據
    console.log('當前 searchParams:', searchParams);
    console.log('可選的專案:', projects.map(p => p.projectName));

    const handleReset = () => {
        setSelectedProjectIndex("");
        setSelectedCustomerId("");
        setSearchParams({
            projectName: '',
            customer_id: '',
            start_day: '',
            next_pay_day: '',
            status: '',
            keyword: ''
        });
    };

    // 修改 handleOpenPaymentHistory 函數
    const handleOpenPaymentHistory = async (projectId) => {
        try {
            // 先獲取最新的專案資料
            const result = await dispatch(getProjectInfo(projectId));
            if (result.success) {
                // 設置專案 ID
                setSelectedProjectId(projectId);
                
                // 處理專案資料
                const formattedProjectData = {
                    ...result.data,
                    payment_period: parseInt(result.data.payment_period), // 確保轉換為數字
                    contractType: result.data.contractType
                };
                
                // 開啟 Modal 並傳遞處理過的資料
                setPaymentHistoryOpen(true);
                
                // 將處理過的資料傳遞給 PaymentHistoryModal
                return formattedProjectData;
            } else {
                alert('獲取專案資訊失敗');
            }
        } catch (error) {
            console.error('獲取專案資訊失敗:', error);
            alert('獲取專案資訊失敗');
        }
    };

    // 修改 handleSendNotification 函數，添加通知類型參數
    const handleSendNotification = async (project, type = 'payment') => {
        try {
            // 檢查是否已獲取到 LINE Bot 設置
            if (!lineBots || lineBots.length === 0) {
                alert('正在加載 LINE Bot 設置，請稍後再試');
                return;
            }

            // 檢查客戶是否有 LINE ID
            const customer = customers.find(c => c.id === project.customer_id);
            if (!customer || !customer.line_id) {
                alert('此客戶尚未綁定 LINE 帳號，無法發送通知');
                return;
            }

            // 獲取對應分館的 LINE Bot 設置
            const lineBot = lineBots.find(bot => bot.branch_id === project.branch_id);
            if (!lineBot) {
                alert('找不到對應分館的 LINE Bot 設置');
                return;
            }

            // 根據通知類型選擇對應的模板
            const template = type === 'payment' ? lineBot.payment_notice : lineBot.renewql_notice;
            
            // 檢查是否有設置通知模板
            if (!template) {
                alert(`尚未設置${type === 'payment' ? '付款' : '續約'}通知訊息模板，請先在系統設定中設置`);
                return;
            }

            // 格式化金額和日期
            const formattedAmount = project.current_payment.toLocaleString();
            const formattedNextPayDay = formatDate(project.next_pay_day);
            const formattedEndDay = formatDate(project.end_day);

            // 替換模板中的變量
            let message = template
                .replace(/\[name\]/g, customer.name)
                .replace(/\[project_name\]/g, project.projectName);

            // 根據通知類型添加不同的變量
            if (type === 'payment') {
                message = message
                    .replace(/\[next_pay_day\]/g, formattedNextPayDay)
                    .replace(/\[amount\]/g, formattedAmount);
            } else {
                message = message
                    .replace(/\[end_day\]/g, formattedEndDay);
            }

            console.log('準備發送通知:', {
                user_id: customer.line_id,
                message: message
            });

            const result = await dispatch(sendLineMessage({
                user_id: customer.line_id,
                message: message
            }));

            if (result.success) {
                alert('通知發送成功！');
            } else {
                alert(result.message || '通知發送失敗');
            }
        } catch (error) {
            console.error('發送通知失敗:', error);
            alert('發送通知失敗: ' + (error.message || '未知錯誤'));
        }
    };

    const handleFileUpload = async (event) => {
        try {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            // 檢查檔案類型
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                alert('請上傳 Excel 檔案 (.xlsx 或 .xls)');
                return;
            }

            const response = await dispatch(importProjects(file));
            if (response.success) {
                alert(response.message);
                if (response.warnings) {
                    alert(response.warnings);
                }
                // 重新獲取列表
                dispatch(fetchProjects({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchParams.keyword
                }));
            } else {
                alert(response.message || '匯入失敗');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('匯入失敗');
        }
        // 清空 input 的值，這樣可以重複上傳同一個檔案
        event.target.value = '';
    };

    const handleExportExcel = async () => {
        try {
            const response = await dispatch(exportProjects());
            if (!response.success) {
                alert(response.message || '匯出失敗');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('匯出失敗');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await dispatch(exportProjectsExample());
            if (!response.success) {
                alert(response.message || '下載範例失敗');
            }
        } catch (error) {
            console.error('Download template error:', error);
            alert('下載範例失敗');
        }
    };

    // 在 ProjectList 組件中添加查看合約函數
    const handleViewContract = async (projectId) => {
        try {
            const result = await dispatch(viewContractPdf(projectId));
            if (!result.success) {
                alert(result.message);
            }
        } catch (error) {
            console.error('查看合約失敗:', error);
            alert('查看合約失敗');
        }
    };

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            {hasPermission('專案匯入') && (
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-8 p-6">
                    <Typography variant="h6" color="black" className="mb-4">
                        匯入/ 匯出專案
                    </Typography>
                    <div className="flex gap-4 items-center">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="fileInput"
                        />
                        <label htmlFor="fileInput">
                            <Button 
                                variant="gradient" 
                                color="blue" 
                                className="flex items-center gap-2 px-3"
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                匯入專案
                            </Button>
                        </label>
                        {selectedFile && (
                            <Typography variant="small" className="text-black">
                                已選擇: {selectedFile.name}
                            </Typography>
                        )}
                        
                        <Button
                            variant="gradient"
                            className="flex items-center gap-2 px-3"
                            onClick={handleExportExcel}
                        >
                            匯出專案
                        </Button>
                        <Button
                            variant="gradient"
                            color="green"
                            className="flex items-center gap-2 px-3"
                            onClick={handleDownloadTemplate}
                        >
                            範例下載
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            )}
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-2 p-6 flex justify-between">
                    <Typography variant="h6" color="green">
                        專案列表
                    </Typography>
                    {hasPermission('新增專案') && (
                    <Button
                        requiredPermission="create_project"
                        variant="gradient"
                        color="green"
                        onClick={() => handleOpenAdd(true)}
                    >
                        新增專案
                        </Button>
                    )}
                </CardHeader>
                <CardBody className="px-0 pt-0 pb-2">
                    {/* 搜尋區域 */}
                    <div className="flex flex-col align-start items-start p-4 gap-3">
                        <div className="flex flex-wrap items-start gap-3 w-full">
                            <div className="w-72">
                                <Select
                                    label="專案名稱"
                                    value={selectedProjectIndex}
                                    selected={(element) => {
                                        return selectedProjectIndex === "" ? "全部" : projectNames[parseInt(selectedProjectIndex)];
                                    }}
                                    onChange={(value) => {
                                        setSelectedProjectIndex(value);
                                        console.log('選擇的索引:', value);
                                        const projectName = value === "" ? "" : projectNames[parseInt(value)];
                                        handleSearchParamsChange({
                                            ...searchParams,
                                            projectName: projectName
                                        });
                                    }}
                                >
                                    <Option value="">全部</Option>
                                    {projectNames.map((projectName, index) => (
                                        <Option 
                                            key={projectName} 
                                            value={index.toString()}
                                        >
                                            {projectName}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-72">
                                <Select
                                    label="選擇客戶"
                                    value={selectedCustomerId}
                                    selected={(element) => {
                                        return selectedCustomerId === "" ? "全部" : 
                                            customers.find(c => c.id.toString() === selectedCustomerId)?.company_name || 
                                            customers.find(c => c.id.toString() === selectedCustomerId)?.name || 
                                            "全部";
                                    }}
                                    onChange={(value) => {
                                        setSelectedCustomerId(value);
                                        const customer = customers.find(c => c.id.toString() === value);
                                        handleSearchParamsChange({
                                            ...searchParams,
                                            customer_id: value,
                                            customerName: customer ? (customer.company_name || customer.name) : ""
                                        });
                                    }}
                                >
                                    <Option value="">全部</Option>
                                    {customers.map((customer) => (
                                        <Option 
                                            key={customer.id} 
                                            value={customer.id.toString()}
                                        >
                                            {customer.company_name || customer.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-72">
                                <Select
                                    label="狀態"
                                    value={searchParams.status}
                                    onChange={(value) => handleSearchParamsChange({
                                        ...searchParams,
                                        status: value
                                    })}
                                >
                                    <Option value="">全部</Option>
                                    <Option value="0">未提交審核</Option>
                                    <Option value="1">已審核</Option>
                                    <Option value="2">已到期</Option>
                                    <Option value="3">已終止</Option>
                                </Select>
                            </div>
                            
                            <div className="w-72">
                                <Input
                                    type="date"
                                    label="起租時間"
                                    value={searchParams.start_day}
                                    onChange={(e) => handleSearchParamsChange({
                                        ...searchParams,
                                        start_day: e.target.value
                                    })}
                                />
                            </div>
                            <div className="w-72">
                                <Input
                                    type="date"
                                    label="下次繳費日"
                                    value={searchParams.next_pay_day}
                                    onChange={(e) => handleSearchParamsChange({
                                        ...searchParams,
                                        next_pay_day: e.target.value
                                    })}
                                />
                            </div>
                            <div className="w-72">
                                <Input
                                    type="text"
                                    label="關鍵字搜尋"
                                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                    value={searchParams.keyword}
                                    onChange={(e) => handleSearchParamsChange({
                                        ...searchParams,
                                        keyword: e.target.value
                                    })}
                                    className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                                    labelProps={{
                                        className: "ml-3 before:content-none after:content-none",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 表格區域 */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {TABLE_HEADERS.map((header) => (
                                        <th
                                            key={header}
                                            className="border-b border-blue-gray-50 py-3 px-5 text-left ell"
                                        >
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-blue-gray-400"
                                            >
                                                {header}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            <Spinner className="h-8 w-8 mx-auto" />
                                        </td>
                                    </tr>
                                ) : getFilteredProjects().length > 0 ? (
                                    getFilteredProjects().map((project, index) => (
                                        <tr 
                                            key={project.id}
                                            className={`${getRowStyle(project.next_pay_day, project.end_day)} hover:bg-blue-gray-50/50 transition-colors`}
                                        >
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {project.projectName}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {project.customerName}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {project.businessItemName}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                  {PAYMENT_PLANS.find(t => t.value === project.payment_period)?.label}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {CONTRACT_TYPES.find(t => t.value === project.contractType)?.label}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {formatDate(project.start_day)}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {formatDate(project.next_pay_day)}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {formatDate(project.end_day)}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Chip
                                                    variant="gradient"
                                                    color={getStatusColor(project.contract_status)}
                                                    value={getStatusText(project.contract_status)}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    {hasPermission('查看專案') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="blue"
                                                            onClick={() => handleView(project.id)}
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {hasPermission('編輯專案') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="green"
                                                            onClick={() => handleEdit(project.id)}
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {hasPermission('刪除專案') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="red"
                                                            onClick={() => handleDelete(project.id)}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {hasPermission('生成合約') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="blue-gray"
                                                            onClick={() => handleGenerateContract(project.id)}
                                                            disabled={project.status === CONTRACT_STATUS.TERMINATED}
                                                            title={project.status === CONTRACT_STATUS.TERMINATED ? '已終止的合約無法生成' : '生成合約'}
                                                        >
                                                            <DocumentTextIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {hasPermission('查看付款紀錄') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="blue-gray"
                                                            onClick={() => handleOpenPaymentHistory(project.id)}
                                                        >
                                                            <CurrencyDollarIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {/* 通知按鈕 - 根據下次繳費日判斷顯示 */}
                                                    {(isNearPayment(project.next_pay_day) || isOverdue(project.next_pay_day)) && (
                                                        <IconButton
                                                            variant="text"
                                                            color={isOverdue(project.next_pay_day) ? "red" : "amber"}
                                                            onClick={() => handleSendNotification(project)}
                                                        >
                                                            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {/* 續約通知按鈕 */}
                                                    <Tooltip content="發送續約通知">
                                                        <IconButton
                                                            variant="text"
                                                            color="blue"
                                                            onClick={() => handleSendNotification(project, 'renewal')}
                                                        >
                                                            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    {/* 添加查看合約按鈕 */}
                                                    {project.contract_path && (
                                                        <Tooltip content="查看合約">
                                                            <IconButton
                                                                variant="text"
                                                                color="blue-gray"
                                                                onClick={() => handleViewContract(project.id)}
                                                            >
                                                                <MagnifyingGlassIcon className="h-4 w-4" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            <Typography>尚無資料</Typography>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 分頁區域 */}
                    <div className="flex justify-center p-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="text"
                                className="flex items-center gap-2"
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                            >
                                <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> 上一頁
                            </Button>
                            <Typography color="gray" className="font-normal text-sm">
                                第 {pagination.current_page} / {Math.ceil(pagination.total / pagination.per_page)} 頁
                            </Typography>
                            <Button
                                variant="text"
                                className="flex items-center gap-2"
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page >= Math.ceil(pagination.total / pagination.per_page)}
                            >
                                下一頁 <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
            
            {/* 新增客戶彈窗 */}
            <Dialog open={openAdd} handler={handleOpenAdd} size="xl">
                <DialogHeader>新增專案</DialogHeader>
                <DialogBody divider className="h-[30rem] sm:h-[35em] overflow-y-scroll">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 基本資料 */}
                        <div className="col-span-2">
                            <Input
                                label="專案名稱"
                                value={projectData.projectName}
                                onChange={(e) => setProjectData({...projectData, projectName: e.target.value})}
                                required
                            />
                        </div>

                        {/* 客戶和商務項目 */}
                        <Select label="選擇客戶" value={projectData.customer_id} onChange={(value) => setProjectData({...projectData, customer_id: value})} required>
                            {customers.map((customer) => (
                                <Option key={customer.id} value={customer.id.toString()}>
                                    {customer.company_name || customer.name}
                                </Option>
                            ))}
                        </Select>

                        <Select label="商務項目" value={projectData.business_item_id} onChange={handleBusinessItemChange} required>
                            {businessItems.map((item) => (
                                <Option key={item.id} value={item.id.toString()}>
                                    {item.name}
                                </Option>
                            ))}
                        </Select>

                        {/* 合約相關 */}
                        <Select label="付款方案" value={projectData.payment_period} onChange={handlePaymentPlanChange}>
                            {PAYMENT_PLANS.map((plan) => (
                                <Option key={plan.value} value={plan.value}>
                                    {plan.label}
                                </Option>
                            ))}
                        </Select>

                        <Select label="合約類型" value={projectData.contractType} onChange={handleContractTypeChange}>
                            {CONTRACT_TYPES.map((type) => (
                                <Option key={type.value} value={type.value}>
                                    {type.label}
                                </Option>
                            ))}
                        </Select>

                        {/* 日期相關 */}
                        <Input
                            type="date"
                            label="起租時間"
                            value={projectData.start_day}
                            onChange={handleStartDateChange}
                            required
                        />

                        <Input
                            type="date"
                            label="簽約日"
                            value={projectData.signing_day}
                            onChange={(e) => setProjectData({...projectData, signing_day: e.target.value})}
                        />

                        <Input
                            type="number"
                            label="約定繳費日"
                            value={projectData.pay_day}
                             // 設為唯讀，由起租日自動設置
                        />

                        <Input
                            type="date"
                            label="下次繳費日"
                            value={projectData.next_pay_day}
                            // 設為唯讀，由系統自動計算
                        />

                        <Input
                            type="date"
                            label="合約到期日"
                            value={projectData.end_day}
                          
                        />

                        {/* 費用相關 */}
                        <Input
                            type="number"
                            label="單期費用"
                            value={projectData.original_price}
                             // 設為唯讀，由商務項目自動帶入
                        />

                        {/* 期數項目 */}
                        <Input
                            type="number"
                            label="期數項目"
                            value={projectData.totalPeriods}
                            readOnly
                        />

                        {/* 當期款項 */}
                        <Input
                            type="number"
                            label="當期款項"
                            value={projectData.sale_price}
                            onChange={(e) => setProjectData({
                                ...projectData,
                                sale_price: parseFloat(e.target.value) || 0
                            })}
                        />

                        <Input
                            type="number"
                            label="押金"
                            value={projectData.deposit}
                           
                        />

                        <Input
                            type="number"
                            label="違約金"
                            value={projectData.penaltyFee}
                           
                        />

                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                label="滯納金比例 (%)"
                                value={projectData.lateFee}
                                onChange={(e) => setProjectData({...projectData, lateFee: parseFloat(e.target.value) || 3})}
                            />
                        </div>

                        {/* 備註 */}
                        <div className="col-span-2">
                            <Textarea
                                label="備註"
                                value={projectData.remark}
                                onChange={(e) => setProjectData({...projectData, remark: e.target.value})}
                            />
                        </div>

                        {/* 在適當位置添加狀態切換開關 */}
                        <div className="col-span-2 flex items-center gap-4">
                            <Typography color="blue-gray" className="font-medium">
                                狀態
                            </Typography>
                            <Switch
                                checked={projectData.status === 1}
                                onChange={(e) => setProjectData({
                                    ...projectData,
                                    status: e.target.checked ? 1 : 0
                                })}
                                label={projectData.status === 1 ? "啟用" : "停用"}
                            />
                        </div>

                        {/* 生成合約書按鈕 */}
                        <div className="col-span-2 hidden">
                            <Button
                                variant="outlined"
                                color="blue"
                                onClick={handleGenerateContractPreview}
                                className="flex items-center gap-2"
                                disabled={!projectData.customer_id || !projectData.business_item_id}
                            >
                                <DocumentTextIcon className="h-4 w-4" />
                                <span>預覽合約</span>
                            </Button>
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="red" onClick={() => handleOpenAdd(false)}>
                        取消
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleProjectSubmit}>
                        確認新增
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* 查看/編輯專案彈窗 */}
            <Dialog open={detailOpen} handler={handleOpenDetail} size="xl">
                <DialogHeader className="flex justify-between items-center">
                    <Typography variant="h6">
                        {viewMode === 'view' ? '查看專案' : '編輯專案'}
                    </Typography>
                    {viewMode === 'view' && (
                        <Button
                            variant="text"
                            color="blue"
                            className="flex items-center gap-2"
                            onClick={toggleViewMode}
                        >
                            <PencilSquareIcon className="h-4 w-4" />
                            切換至編輯模式
                        </Button>
                    )}
                </DialogHeader>
                <DialogBody divider className="overflow-y-auto max-h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewMode === 'view' ? (
                            // 查看模式
                            <>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        專案名稱
                                    </Typography>
                                    <Typography>{projectData.projectName}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        客戶名稱
                                    </Typography>
                                    <Typography>{projectData.customerName}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        商務項目
                                    </Typography>
                                    <Typography>{projectData.businessItemName}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        付款方案
                                    </Typography>
                                    <Typography>
                                        {PAYMENT_PLANS.find(p => p.value === projectData.payment_period)?.label}
                                    </Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        合約類型
                                    </Typography>
                                    <Typography>
                                        {CONTRACT_TYPES.find(t => t.value === projectData.contractType)?.label}
                                    </Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        起租時間
                                    </Typography>
                                    <Typography>{formatDate(projectData.start_day)}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        簽約日
                                    </Typography>
                                    <Typography>{formatDate(projectData.signing_day)}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        約定繳費日
                                    </Typography>
                                    <Typography>{projectData.pay_day}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        下次繳費日
                                    </Typography>
                                    <Typography>{formatDate(projectData.next_pay_day)}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        合約到期日
                                    </Typography>
                                    <Typography>{formatDate(projectData.end_day)}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        原價
                                    </Typography>
                                    <Typography>${projectData.original_price?.toLocaleString()}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        當期款項
                                    </Typography>
                                    <Typography>${projectData.sale_price?.toLocaleString()}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        押金
                                    </Typography>
                                    <Typography>${projectData.deposit?.toLocaleString()}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        違約金
                                    </Typography>
                                    <Typography>${projectData.penaltyFee?.toLocaleString()}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        滯納金比例
                                    </Typography>
                                    <Typography>{projectData.lateFee}%</Typography>
                                </div>
                                <div className="col-span-2 flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        介紹人
                                    </Typography>
                                    <Typography>{projectData.broker}</Typography>
                                </div>
                                <div className="col-span-2 flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        介紹人備註
                                    </Typography>
                                    <Typography>{projectData.broker_remark}</Typography>
                                </div>
                                <div className="col-span-2 flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        備註
                                    </Typography>
                                    <Typography>{projectData.remark}</Typography>
                                </div>
                            </>
                        ) : (
                            // 編輯模式
                            <>
                                <div className="col-span-2">
                                    <Input
                                        label="專案名稱"
                                        value={projectData.projectName}
                                        onChange={(e) => setProjectData({...projectData, projectName: e.target.value})}
                                        required
                                    />
                                </div>
                                <Select 
                                    label="選擇客戶" 
                                    value={projectData.customer_id.toString()} // 確保是字串類型
                                    onChange={(value) => setProjectData({...projectData, customer_id: value})}
                                    required
                                >
                                    {customers.map((customer) => (
                                        <Option key={customer.id} value={customer.id.toString()}>
                                            {customer.company_name || customer.name}
                                        </Option>
                                    ))}
                                </Select>

                                <Select 
                                    label="商務項目" 
                                    value={projectData.business_item_id.toString()} // 確保是字串類型
                                    onChange={handleBusinessItemChange}
                                    required
                                >
                                    {businessItems.map((item) => (
                                        <Option key={item.id} value={item.id.toString()}>
                                            {item.name}
                                        </Option>
                                    ))}
                                </Select>

                                <Select 
                                    label="付款方案" 
                                    value={projectData.payment_period} 
                                    onChange={handlePaymentPlanChange}
                                >
                                    {PAYMENT_PLANS.map((plan) => (
                                        <Option key={plan.value} value={plan.value}>
                                            {plan.label}
                                        </Option>
                                    ))}
                                </Select>

                                <Select 
                                    label="合約類型" 
                                    value={projectData.contractType} 
                                    onChange={handleContractTypeChange}
                                >
                                    {CONTRACT_TYPES.map((type) => (
                                        <Option key={type.value} value={type.value}>
                                            {type.label}
                                        </Option>
                                    ))}
                                </Select>

                                <Input
                                    type="date"
                                    label="起租時間"
                                    value={formatDate(projectData.start_day)}
                                    onChange={(e) => setProjectData({...projectData, start_day: e.target.value})}
                                    required
                                />

                                <Input
                                    type="date"
                                    label="簽約日"
                                    value={formatDate(projectData.signing_day)}
                                    onChange={(e) => setProjectData({...projectData, signing_day: e.target.value})}
                                />

                                <Input
                                    type="number"
                                    label="約定繳費日"
                                    value={projectData.pay_day}
                                    onChange={handlePaymentDayChange}
                                    min={1}
                                    max={31}
                                />

                                <Input
                                    type="date"
                                    label="下次繳費日"
                                    value={projectData.next_pay_day}
                                />

                                <Input
                                    type="date"
                                    label="合約到期日"
                                    value={projectData.end_day}
                                />

                                <Input
                                    type="number"
                                    label="原價"
                                    value={projectData.original_price}
                                />

                                <Input
                                    type="number"
                                    label="期數"
                                    value={projectData.totalPeriods}
                                />

                                <Input
                                    type="number"
                                    label="當期款項"
                                    value={projectData.sale_price}
                                    onChange={(e) => setProjectData({
                                        ...projectData,
                                        sale_price: parseFloat(e.target.value) || 0
                                    })}
                                />

                                <Input
                                    type="number"
                                    label="押金"
                                    value={projectData.deposit}
                                    onChange={(e) => setProjectData({
                                        ...projectData,
                                        deposit: parseFloat(e.target.value) || 0
                                    })}
                                />

                                <Input
                                    type="number"
                                    label="違約金"
                                    value={projectData.penaltyFee}
                                    onChange={(e) => setProjectData({
                                        ...projectData,
                                        penaltyFee: parseFloat(e.target.value) || 0
                                    })}
                                />

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        label="滯納金比例 (%)"
                                        value={projectData.lateFee}
                                        onChange={(e) => setProjectData({
                                            ...projectData,
                                            lateFee: parseFloat(e.target.value) || 3
                                        })}
                                    />
                                </div>

                                <Input
                                    label="介紹人"
                                    value={projectData.broker}
                                    onChange={(e) => setProjectData({
                                        ...projectData,
                                        broker: e.target.value
                                    })}
                                />

                                <div className="col-span-2">
                                    <Textarea
                                        label="介紹人備註"
                                        value={projectData.broker_remark}
                                        onChange={(e) => setProjectData({
                                            ...projectData,
                                            broker_remark: e.target.value
                                        })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Textarea
                                        label="備註"
                                        value={projectData.remark}
                                        onChange={(e) => setProjectData({
                                            ...projectData,
                                            remark: e.target.value
                                        })}
                                    />
                                </div>

                                {/* 添加狀態切換開關 - 放在其他編輯欄位後面 */}
                                <div className="col-span-2 flex items-center gap-4">
                                    <Typography color="blue-gray" className="font-medium">
                                        狀態
                                    </Typography>
                                    <Switch
                                        checked={projectData.status === 1}
                                        onChange={(e) => setProjectData({
                                            ...projectData,
                                            status: e.target.checked ? 1 : 0
                                        })}
                                        label={projectData.status === 1 ? "啟用" : "停用"}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter className="space-x-2">
                    {viewMode === 'view' ? (
                        <>
                            <Button variant="outlined" color="red" onClick={handleCancel}>
                                關閉
                            </Button>
                            <Button variant="gradient" color="green" onClick={toggleViewMode}>
                                編輯
                            </Button>
                            <Button
                                variant="outlined"
                                color="blue"
                                onClick={() => handleGenerateContract(projectData.id)}
                                className="flex items-center gap-2"
                                disabled={projectData.status === CONTRACT_STATUS.TERMINATED}
                            >
                                <DocumentTextIcon className="h-4 w-4" />
                                生成合約
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outlined" color="red" onClick={handleCancel}>
                                取消
                            </Button>
                            <Button variant="gradient" color="green" onClick={handleSaveEdit}>
                                保存
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </Dialog>

            {/* 繳費歷程彈窗 */}
            <PaymentHistoryModal 
                open={paymentHistoryOpen}
                handleOpen={() => setPaymentHistoryOpen(!paymentHistoryOpen)}
                projectId={selectedProjectId}
                projectData={projects.find(p => p.id === selectedProjectId)}
            />

            {error && (
                <div className="text-red-500 text-center p-4">
                    {error}
                </div>
            )}

            {/* 在表格底部添加說明 */}
            <div className="p-4 text-sm text-gray-600 flex flex-row bg-white">
                <div className="flex items-center gap-2 ">
                    <div className="w-3 h-3 bg-red-50"></div>
                    <span>付款已逾期</span>
                </div>
                <div className="flex items-center gap-2 ">
                    <div className="w-3 h-3 bg-amber-50"></div>
                    <span>付款即將到期（5天內）</span>
                </div>
                <div className="flex items-center gap-2 ">
                    <div className="w-3 h-3 bg-blue-50"></div>
                    <span>合約即將到期（30天內）</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-100"></div>
                    <span>合約已過期</span>
                </div>
            </div>
        </div>
    );
}

export default ProjectList;
  