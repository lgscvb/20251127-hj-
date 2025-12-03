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
} from "@material-tailwind/react";
import {
    HomeIcon,
    ChatBubbleLeftEllipsisIcon,
    Cog6ToothIcon,
    PencilIcon,
    EyeSlashIcon
  } from "@heroicons/react/24/solid";
import { authorsTableData } from "@/data";
import { useState, useEffect } from "react";
import { ArrowRightIcon, ArrowLeftIcon, EyeIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerInfo, fetchBranches, exportCustomers, importCustomers, exportCustomersExample } from "@/redux/actions";
import { Link } from "react-router-dom";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import { platformSettingsData, conversationsData, projectsData } from "@/data";

import { usePermission } from '@/hooks/usePermission';
import * as XLSX from 'xlsx';

export function CustomerList() {
    // 獲取用戶權限
   const { hasPermission, isTopAccount } = usePermission();
    const dispatch = useDispatch();
    const { list: customers, loading, pagination } = useSelector(state => state.customers);
    const { list: branches } = useSelector(state => state.branches);
    const user = useSelector(state => state.auth.user) || {};
    const [selectedFile, setSelectedFile] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [customerData, setCustomerData] = useState({
        number: '',           
        name: '',            
        branch_id: user?.branch_id || '',  // 使用可选链操作符
        //branch_name: user?.branch || '',   // 使用可选链操作符
        email: '',           
        id_number: '',       
        birthday: '',        
        address: '',         
        phone_number: '',    
        company_name: '',    
        company_number: '',  
        company_website: '', 
        company_email: '',   
        company_address: '', 
        company_phone_number: '', 
        company_fax_number: '',   
        company_contact_person: '', 
        company_contact_person_phone_number: '', 
        company_contact_person_email: '', 
        line_id: '',         
        line_nickname: '',   
        id_card_front: null, 
        id_card_back: null,  
        remark: '',          
        status: 1,           
        modify: 1            
    });

    // 添加分頁相關的 state
    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = localStorage.getItem('customerListPage');
        return savedPage ? parseInt(savedPage) : 1;
    });
    
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const savedItems = localStorage.getItem('customerListItemsPerPage');
        return savedItems ? parseInt(savedItems) : 10;
    });

    // 計算總頁數
    const totalPages = Math.ceil(authorsTableData.length / itemsPerPage);

    // 添加載入狀態
    const [isLoading, setIsLoading] = useState(false);

    // 添加在其他 state 定義的地方
    const [editingCustomer, setEditingCustomer] = useState(null);

    // 添加錯誤狀態
    const [error, setError] = useState(null);

    // 修改 state 部分，添加新的彈窗控制狀態
    const [openAdd, setOpenAdd] = useState(false);    // 新增客戶彈窗
    const [openEdit, setOpenEdit] = useState(false);  // 編輯客戶彈窗
    const [openView, setOpenView] = useState(false);  // 查看客戶彈窗

    // 添加模式控制狀態
    const [viewMode, setViewMode] = useState('view'); // 'view' 或 'edit'
    const [detailOpen, setDetailOpen] = useState(false);

    // 在 state 初始化或設置數據時處理日期格式
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];  // 只取日期部分 "yyyy-MM-dd"
    };

    // 修改處理頁碼變更的函數
    const handlePageChange = (newPage) => {
        setIsLoading(true);
        setCurrentPage(newPage);
        localStorage.setItem('customerListPage', newPage.toString());
        
        // 0.5秒後關閉載入動畫
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    // 修改處理每頁顯示數量變更的函數
    const handleItemsPerPageChange = (value) => {
        setIsLoading(true);
        setItemsPerPage(value);
        setCurrentPage(1);
        localStorage.setItem('customerListItemsPerPage', value.toString());
        localStorage.setItem('customerListPage', '1');
        
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    // 獲取當前頁的數據
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return authorsTableData.slice(startIndex, endIndex);
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

            const response = await dispatch(importCustomers(file));
            if (response.success) {
                alert(response.message);
                if (response.warnings) {
                    alert(response.warnings);
                }
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
            const response = await dispatch(exportCustomers());
            if (!response.success) {
                alert(response.message || '匯出失敗');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('匯出失敗');
        }
    };

    const handleOpen = () => setOpen(!open);

    // 添加一个生成随机客户编号的函数
    const generateCustomerNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `CUS${year}${month}${day}${random}`;
    };

    // 修改 handleOpenAdd 函数，初始化所有字段
    const handleOpenAdd = () => {
        setCustomerData({
            number: generateCustomerNumber(),
            name: '',
            branch_id: user.branch_id,
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
        setOpenAdd(true);
    };

    const handleOpenEdit = () => setOpenEdit(!openEdit);
    const handleOpenView = () => setOpenView(!openView);

    // 修改處理函數
    const handleOpenDetail = () => setDetailOpen(!detailOpen);

    // 修改添加客戶處理函數
    const handleAddCustomer = () => {
        // 重置表單數據
        setCustomerData({
            number: '',
            name: '',
            // 如果不是最高權限,自動設置分館
            branch_id: user.branch_id,
            //branch_name: user.branch,
            email: '',           // 電子郵件
            id_number: '',       // 身分證字號
            birthday: '',        // 生日
            address: '',         // 地址
            phone_number: '',    // 電話
            company_name: '',    // 公司名稱
            company_number: '',  // 統一編號
            company_website: '', // 公司網站
            company_email: '',   // 公司電子郵件
            company_address: '', // 公司地址
            company_phone_number: '', // 公司電話
            company_fax_number: '',   // 公司傳真
            company_contact_person: '', // 公司聯絡人
            company_contact_person_phone_number: '', // 公司聯絡人電話
            company_contact_person_email: '', // 公司聯絡人電子郵件
            line_id: '',         // LINE ID
            line_nickname: '',   // LINE 暱稱
            id_card_front: null, // 身分證正面
            id_card_back: null,  // 身分證背面
            remark: '',          // 備註
            status: 1,           // 狀態
            modify: 1            // 前端可編輯
        });
        setOpenAdd(true);
    };

    // 處理新增客戶提交
    const handleSubmit = async () => {
        try {
            // 驗證必填欄位
            if (!customerData.name) {
                alert('請填寫客戶姓名');
                return;
            }
            if (!customerData.id_number) {
                alert('請填寫身分證字號');
                return;
            }
            

            // 確保分館ID已設置
            const submitData = {
                ...customerData,
                branch_id: user.branch_id
            };

            console.log('Submitting customer data:', submitData);

            const response = await dispatch(createCustomer(submitData));
            if (response.success) {
                setOpenAdd(false);
                // 清空表單數據，但保留客户编号
                const newCustomerNumber = generateCustomerNumber(); // 生成新的客户编号
                setCustomerData({
                    number: newCustomerNumber, // 设置新的客户编号
                    name: '',
                    branch_id: user.branch_id,
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
                dispatch(fetchCustomers({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
                }));
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Add customer error:', error);
            alert('新增失敗');
        }
    };

    // 處理編輯客戶保存
    const handleSaveEdit = async () => {
        try {
            // 驗證必填欄位
            if (!customerData.name) {
                alert('請填寫客戶姓名');
                return;
            }
            if (!customerData.id_number) {
                alert('請填寫身分證字號');
                return;
            }
            if (!customerData.phone) {
                alert('請填寫電話');
                return;
            }
            if (!customerData.email) {
                alert('請填寫電子郵件');
                return;
            }
            

            // 創建一個新的 FormData 對象
            const formData = new FormData();
            
            // 添加客戶ID
            formData.append('id', customerData.id);
            
            // 手動添加每個欄位，確保使用正確的欄位名稱
            const fields = {
                'number': customerData.number,
                'name': customerData.name,
                'email': customerData.email,
                'id_number': customerData.id_number,
                'birthday': customerData.birthday,
                'address': customerData.address,
                'phone': customerData.phone,  // 注意這裡使用 phone 而不是 phone_number
                'company_name': customerData.company_name,
                'company_number': customerData.company_number,
                'company_website': customerData.company_website,
                'company_email': customerData.company_email,
                'company_address': customerData.company_address,
                'company_phone': customerData.company_phone,  // 注意這裡的欄位名稱
                'company_fax': customerData.company_fax,      // 注意這裡的欄位名稱
                'company_contact_person': customerData.company_contact_person,
                'company_contact_person_phone': customerData.company_contact_person_phone,  // 注意這裡的欄位名稱
                'company_contact_person_email': customerData.company_contact_person_email,
                'line_id': customerData.line_id,
                'line_nickname': customerData.line_nickname,
                'status': customerData.status ? 1 : 0,
                'modify': customerData.modify ? 1 : 0,
                'remark': customerData.remark
            };

            // 將欄位添加到 FormData
            Object.entries(fields).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            // 處理文件上傳
            if (customerData.id_card_front instanceof File) {
                formData.append('id_card_front', customerData.id_card_front);
            }
            if (customerData.id_card_back instanceof File) {
                formData.append('id_card_back', customerData.id_card_back);
            }

            console.log('Updating customer with ID:', customerData.id); // 添加日志
            const response = await dispatch(updateCustomer(formData));
            
            if (response.success) {
                setDetailOpen(false);
                setViewMode('view');
                dispatch(fetchCustomers({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
                }));
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Update customer error:', error);
            alert('更新失敗');
        }
    };

    const handleInputChange = (field) => (e) => {
        setCustomerData({
            ...customerData,
            [field]: e.target.value
        });
    };

    const handleSwitchChange = (field) => (e) => {
        setCustomerData({
            ...customerData,
            [field]: e.target.checked
        });
    };

    // 處理文件上傳
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

    // 處理查看客戶
    const handleView = async (id) => {
        try {
            // 检查用户权限
            if (!user) {
                alert('請先登入');
                return;
            }

            const response = await dispatch(getCustomerInfo(id));
            if (response.success) {
                setCustomerData({
                    ...response.data,
                    birthday: formatDate(response.data.birthday),
                });
                setViewMode('view');
                setDetailOpen(true);
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('View customer error:', error);
            alert('獲取客戶資料失敗');
        }
    };

    // 處理編輯客戶
    const handleEdit = async (id) => {
        try {
            const response = await dispatch(getCustomerInfo(id));
            if (response.success) {
                console.log('Customer data received:', response.data); // 添加日志
                setCustomerData({
                    ...response.data,
                    id: response.data.id, // 确保 ID 被正确设置
                    birthday: formatDate(response.data.birthday)
                });
                setViewMode('edit');
                setDetailOpen(true);
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Edit customer error:', error);
            alert('獲取客戶資料失敗');
        }
    };

    // 處理刪除客戶
    const handleDeleteCustomer = async (id) => {
        if (window.confirm('確定要刪除此客戶嗎？')) {
            try {
                const response = await dispatch(deleteCustomer(id));
                if (response.success) {
                    dispatch(fetchCustomers({
                        page: currentPage,
                        per_page: itemsPerPage,
                        keyword: searchKeyword
                    }));
                } else {
                    alert(response.message);
                }
            } catch (error) {
                console.error('Delete customer error:', error);
                alert('刪除失敗');
            }
        }
    };

    // 修改取消按鈕的處理函數
    const handleCancel = () => {
        setOpenAdd(false);
        setDetailOpen(false);
        setCustomerData({
            number: '',           // 客戶編號
            name: '',            // 客戶姓名
            email: '',           // 電子郵件
            id_number: '',       // 身分證字號
            birthday: '',        // 生日
            address: '',         // 地址
            phone_number: '',    // 電話
            company_name: '',    // 公司名稱
            company_number: '',  // 統一編號
            company_website: '', // 公司網站
            company_email: '',   // 公司電子郵件
            company_address: '', // 公司地址
            company_phone_number: '', // 公司電話
            company_fax_number: '',   // 公司傳真
            company_contact_person: '', // 公司聯絡人
            company_contact_person_phone_number: '', // 公司聯絡人電話
            company_contact_person_email: '', // 公司聯絡人電子郵件
            line_id: '',         // LINE ID
            line_nickname: '',   // LINE 暱稱
            id_card_front: null, // 身分證正面
            id_card_back: null,  // 身分證背面
            remark: '',          // 備註
            status: 1,           // 狀態
            modify: 1            // 前端可編輯
        });
    };

    // 切換模式處理函數
    const toggleViewMode = () => {
        setViewMode(viewMode === 'view' ? 'edit' : 'view');
    };


    // 添加用户权限检查的辅助函数
    const checkUserPermission = () => {
        return user && (user.is_top_account === 1 || user.branch_id);
    };
    // 初始化數據
    useEffect(() => {
        if (user.is_top_account === 1) {
            dispatch(fetchBranches());
        }
        dispatch(fetchCustomers({
            page: currentPage,
            per_page: itemsPerPage,
            keyword: searchKeyword
        }));
    }, [dispatch, currentPage, itemsPerPage, searchKeyword, user.is_top_account]);

    // 在組件頂部添加 state
    const [searchTimeout, setSearchTimeout] = useState(null);

    // 修改搜尋處理函數
    const handleSearch = (e) => {
        const keyword = e.target.value;
        setSearchKeyword(keyword);
        
        // 使用 setTimeout 來實現防抖，避免頻繁請求
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        const timeoutId = setTimeout(() => {
            dispatch(fetchCustomers({
                page: 1, // 搜尋時重置到第一頁
                per_page: pagination.per_page || 10,
                keyword: keyword,
                branch_id: selectedBranch // 添加分館ID参数
            }));
        }, 500); // 500ms 的延遲
        
        setSearchTimeout(timeoutId);
    };

    // 添加分頁組件
    const Pagination = () => {
        const { pagination } = useSelector(state => state.customers);
        const dispatch = useDispatch();

        const handlePrevPage = () => {
            if (pagination.current_page > 1) {
                dispatch(fetchCustomers({
                    page: pagination.current_page - 1,
                    per_page: pagination.per_page,
                    keyword: searchKeyword
                }));
            }
        };

        const handleNextPage = () => {
            if (pagination.current_page < Math.ceil(pagination.total / pagination.per_page)) {
                dispatch(fetchCustomers({
                    page: pagination.current_page + 1,
                    per_page: pagination.per_page,
                    keyword: searchKeyword
                }));
            }
        };

        return (
            <div className="flex items-center gap-4">
                <Button
                    variant="text"
                    className="flex items-center gap-2"
                    onClick={handlePrevPage}
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
                    onClick={handleNextPage}
                    disabled={pagination.current_page >= Math.ceil(pagination.total / pagination.per_page)}
                >
                    下一頁 <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
                </Button>
            </div>
        );
    };
    // 處理匯入
    const handleImport = async (event) => {
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

            const response = await dispatch(importCustomers(file));
            if (response.success) {
                alert(response.message);
                if (response.warnings) {
                    alert(response.warnings);
                }
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

    // 添加處理匯出範例的函數
    const handleExportExample = async () => {
        try {
            const response = await dispatch(exportCustomersExample());
            if (!response.success) {
                alert(response.message || '匯出範例失敗');
            }
        } catch (error) {
            console.error('Export example error:', error);
            alert('匯出範例失敗');
        }
    };

    useEffect(() => {
        // 在组件卸载时清理创建的 URL
        return () => {
            if (customerData.id_card_front instanceof File) {
                URL.revokeObjectURL(URL.createObjectURL(customerData.id_card_front));
            }
            if (customerData.id_card_back instanceof File) {
                URL.revokeObjectURL(URL.createObjectURL(customerData.id_card_back));
            }
        };
    }, [customerData.id_card_front, customerData.id_card_back]);

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
             {hasPermission('顧客資料匯入') && (
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-8 p-6">
                    <Typography variant="h6" color="black" className="mb-4">
                        匯入/ 匯出客戶資料
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
                                className="flex items-center gap-2 px-5"
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                匯入客戶
                            </Button>
                        </label>
                        {selectedFile && (
                            <Typography variant="small" className="text-black">
                                已選擇: {selectedFile.name}
                            </Typography>
                        )}
                        
                        <Button
                            variant="gradient"
                            className="flex items-center gap-2 px-5"
                            onClick={handleExportExcel}
                        >
                            匯出客戶
                        </Button>
                        <Button 
                            variant="gradient" 
                            color="green" 
                            className="flex items-center gap-2 px-5"
                            
                            onClick={handleExportExample}
                        >
                            範例下載
                        </Button>
                        {selectedFile && (
                            <Typography variant="small" className="text-black">
                                已選擇: {selectedFile.name}
                            </Typography>
                        )}
                    </div>
                </CardHeader>
            </Card>
            )}
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-8 p-6 flex justify-between">
                    <Typography variant="h6" color="green" className="flex items-center gap-2">
                        客戶列表
                    </Typography>

                    {/* 只控制新增按鈕的顯示 */}
                    {hasPermission('新增顧客') && (
                        <Button
                            variant="gradient"
                            color="amber"
                            className="flex items-center gap-2"
                            onClick={handleAddCustomer}
                        >
                            新增客戶
                        </Button>
                    )}
                </CardHeader>
                <CardBody className="px-0 pt-0 pb-2">
                    <div className="px-4 py-2">
                        <Select
                            value={itemsPerPage.toString()}
                            onChange={(value) => handleItemsPerPageChange(parseInt(value))}
                            label="每頁顯示筆數"
                        >
                            <Option value="10">10 筆</Option>
                            <Option value="20">20 筆</Option>
                            <Option value="50">50 筆</Option>
                        </Select>
                    </div>
                    <div className="flex justify-between items-center p-4">
                        <div className="w-full md:w-72">
                            <Input 
                                label="搜尋客戶" 
                                value={searchKeyword}
                                onChange={handleSearch}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <Spinner className="h-12 w-12" />
                        </div>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] table-fixed">
                                <thead>
                                    <tr>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[100px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                客戶編號
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[120px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                客戶姓名
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[80px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                分館
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[150px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                公司名稱
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[70px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                狀態
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[100px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                建立時間
                                            </Typography>
                                        </th>
                                        <th className="border-b border-blue-gray-50 py-3 px-3 text-left w-[120px]">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                                操作
                                            </Typography>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                               
                                    {loading ? (
                                        <tr >
                                        <td colSpan="7" className="text-center py-4 flex justify-center items-center w-full">
                                          
                                        </td>
                                    </tr>
                                    ) : customers.length > 0 ? (
                                        customers.map((customer, key) => (
                                            
                                            <tr key={customer.id}>
                                                <td className="py-3 px-3 w-[100px]">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 truncate" title={customer.number}>
                                                        {customer.number}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-3 w-[120px]">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 truncate" title={customer.name}>
                                                        {customer.name}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-3 w-[80px]">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 truncate" title={customer.branch_name}>
                                                        {customer.branch_name || '-'}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-3 w-[150px]">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 truncate" title={customer.company_name}>
                                                        {customer.company_name || '-'}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-3 w-[70px]">
                                                    <Chip
                                                        variant="gradient"
                                                        color={customer.status ? "green" : "blue-gray"}
                                                        value={customer.status ? "啟用" : "禁用"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </td>
                                                <td className="py-3 px-3 w-[100px]">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 truncate">
                                                        {customer.created_at?.split(' ')[0] || '-'}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-3 w-[120px]">
                                                    <div className="flex gap-1 flex-nowrap">
                                                    {hasPermission('查看顧客') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="blue"
                                                            onClick={() => handleView(customer.id)}
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    )}
                                                    {hasPermission('編輯顧客') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="green"
                                                            onClick={() => handleEdit(customer.id)}
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </IconButton>
                                                        )}
                                                         {hasPermission('刪除顧客') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="red"
                                                            onClick={() => handleDeleteCustomer(customer.id)}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </IconButton>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                <Typography>尚無資料</Typography>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                            <div className="flex justify-center p-4">
                                <Pagination />
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>

            {/* 新增客戶彈窗 */}
            <Dialog open={openAdd} handler={handleOpenAdd} size="xl">
                <DialogHeader>新增客戶</DialogHeader>
                <DialogBody divider className="h-[30rem] sm:h-[35em] overflow-y-scroll">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 只有最高權限可以選擇分館 */}
                        {user.is_top_account === 1 ? (
                            <Select
                                label="分館"
                                value={customerData.branch_id?.toString()}
                                onChange={(value) => setCustomerData({ 
                                    ...customerData, 
                                    branch_id: parseInt(value),
                                    branch_name: branches?.find(b => b.id === parseInt(value))?.name || ''
                                })}
                                required
                            >
                                {(branches || []).map((branch) => (
                                    <Option key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </Option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                label="分館"
                                value={user.branch}
                                disabled
                            />
                        )}
                        {/* 基本資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mb-2">
                            基本資料
                        </Typography>
                        <Input
                            label="客戶編號"
                            value={customerData.number}
                            onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
                            disabled  // 添加 disabled 属性
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
                            value={formatDate(customerData.birthday)}
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
                            value={customerData.email}
                            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                            type="email"
                            required
                        />
                        <div className="col-span-2">
                            <Input
                                label="地址"
                                value={customerData.address}
                                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                            />
                        </div>

                        {/* 公司資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            公司資料
                        </Typography>
                        <Input
                            label="公司名稱"
                            value={customerData.company_name}
                            onChange={(e) => setCustomerData({ ...customerData, company_name: e.target.value })}
                        />
                        <Input
                            label="統一編號"
                            value={customerData.company_number}
                            onChange={(e) => setCustomerData({ ...customerData, company_number: e.target.value })}
                        />
                        <Input
                            label="公司電話"
                            value={customerData.company_phone_number}
                            onChange={(e) => setCustomerData({ ...customerData, company_phone_number: e.target.value })}
                        />
                        <Input
                            label="公司傳真"
                            value={customerData.company_fax_number}
                            onChange={(e) => setCustomerData({ ...customerData, company_fax_number: e.target.value })}
                        />
                        <Input
                            label="公司網站"
                            value={customerData.company_website}
                            onChange={(e) => setCustomerData({ ...customerData, company_website: e.target.value })}
                        />
                        <Input
                            label="公司電子郵件"
                            value={customerData.company_email}
                            onChange={(e) => setCustomerData({ ...customerData, company_email: e.target.value })}
                            type="email"
                        />
                        <div className="col-span-2">
                            <Input
                                label="公司地址"
                                value={customerData.company_address}
                                onChange={(e) => setCustomerData({ ...customerData, company_address: e.target.value })}
                            />
                        </div>

                        {/* 聯絡人資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            聯絡人資料
                        </Typography>
                        <Input
                            label="聯絡人姓名"
                            value={customerData.company_contact_person}
                            onChange={(e) => setCustomerData({ ...customerData, company_contact_person: e.target.value })}
                        />
                        <Input
                            label="聯絡人電話"
                            value={customerData.company_contact_person_phone_number}
                            onChange={(e) => setCustomerData({ ...customerData, company_contact_person_phone_number: e.target.value })}
                        />
                        <Input
                            label="聯絡人電子郵件"
                            value={customerData.company_contact_person_email}
                            onChange={(e) => setCustomerData({ ...customerData, company_contact_person_email: e.target.value })}
                            type="email"
                        />

                        {/* LINE 資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            LINE 資料
                        </Typography>
                        <Input
                            label="LINE ID"
                            value={customerData.line_id}
                            onChange={(e) => setCustomerData({ ...customerData, line_id: e.target.value })}
                        />
                        <Input
                            label="LINE 暱稱"
                            value={customerData.line_nickname}
                            onChange={(e) => setCustomerData({ ...customerData, line_nickname: e.target.value })}
                        />

                        {/* 其他設定 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            其他設定
                        </Typography>
                        <div className="col-span-2">
                            <Textarea
                                label="備註"
                                value={customerData.remark}
                                onChange={(e) => setCustomerData({ ...customerData, remark: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                label="狀態"
                                checked={customerData.status === 1}
                                onChange={(e) => setCustomerData({ ...customerData, status: e.target.checked ? 1 : 0 })}
                            />
                            <span>{customerData.status === 1 ? '啟用' : '停用'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                label="前端可編輯"
                                checked={customerData.modify === 1}
                                onChange={(e) => setCustomerData({ ...customerData, modify: e.target.checked ? 1 : 0 })}
                            />
                        </div>

                        {/* 身分證上傳 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            身分證影本上傳
                        </Typography>
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            {/* 身分證正面 */}
                            <div className="flex flex-col gap-2">
                                <Typography variant="small" color="blue-gray" className="font-semibold">
                                    身分證正面
                                </Typography>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange('id_card_front')}
                                    className="mb-2"
                                />
                                {customerData.id_card_front && (
                                    <img 
                                        src={
                                            customerData.id_card_front instanceof File 
                                                ? URL.createObjectURL(customerData.id_card_front)
                                                : customerData.id_card_front
                                        }
                                        alt="身分證正面預覽" 
                                        className="w-full max-w-[300px] h-auto mt-2"
                                    />
                                )}
                            </div>

                            {/* 身分證背面 */}
                            <div className="flex flex-col gap-2">
                                <Typography variant="small" color="blue-gray" className="font-semibold">
                                    身分證背面
                                </Typography>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange('id_card_back')}
                                    className="mb-2"
                                />
                                {customerData.id_card_back && (
                                    <img 
                                        src={
                                            customerData.id_card_back instanceof File 
                                                ? URL.createObjectURL(customerData.id_card_back)
                                                : customerData.id_card_back
                                        }
                                        alt="身分證背面預覽" 
                                        className="w-full max-w-[300px] h-auto mt-2"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button variant="outlined" color="red" onClick={handleCancel}>
                        取消
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleSubmit}>
                        新增
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* 查看客戶彈窗 */}
            <Dialog open={detailOpen} handler={handleOpenDetail} size="xl">
                <DialogHeader className="flex justify-between items-center">
                    <Typography variant="h6">
                        {viewMode === 'view' ? '查看客戶資料' : '編輯客戶資料'}
                    </Typography>
                    <Button
                        variant="text"
                        color={viewMode === 'view' ? 'blue' : 'gray'}
                        className="flex items-center gap-2 hidden"
                        onClick={toggleViewMode}
                    >
                        {viewMode === 'view' ? '切換至編輯模式' : '切換至查看模式'}
                    </Button>
                </DialogHeader>
                <DialogBody divider className="h-[40rem] overflow-y-scroll">
                    
                    
                        {viewMode === 'view' ? (
                            <>
                           <div className="relative mt-8 h-36 w-full overflow-hidden rounded-xl bg-[url('/img/home-decor-1.jpeg')] bg-cover	bg-bottom">
                                <div className="absolute inset-0 h-full w-full bg-gray-900/20" />
                            </div>
                                <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
                                    <CardBody className="p-4">
                                    <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                                        <div className="flex items-center gap-6">
                                        <Avatar
                                            src="/img/logo_example.jpg"
                                            alt="bruce-mars"
                                            size="xl"
                                            variant="rounded"
                                            className="rounded-lg shadow-lg shadow-blue-gray-500/40"
                                        />
                                        <div>
                                            <Typography variant="h5" color="blue-gray" className="mb-1">
                                            {customerData.company_name}
                                            </Typography>
                                            <Typography
                                            variant="small"
                                            className="font-normal text-blue-gray-600"
                                            >
                                            {customerData.number}
                                            </Typography>
                                        </div>
                                        </div>
                                        <div className="w-96">
                                        <Tabs value="app">
                                            <TabsHeader>
                                            <Tab value="app">
                                                <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                瀏覽模式
                                            </Tab>
                                            
                                            <Tab value="settings" onClick={toggleViewMode}>
                                                <PencilIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                編輯模式
                                            </Tab>
                                            </TabsHeader>
                                        </Tabs>
                                        </div>
                                    </div>
                                    <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-1 xl:grid-cols-1">
                                        <div>
                                            <Typography variant="h6" color="blue-gray" className="mb-3">
                                                狀態
                                            </Typography>
                                            <Chip
                                                variant="gradient"
                                                color={customerData.status === 1 ? "green" : "blue-gray"}
                                                value={customerData.status === 1 ? "啟用" : "停用"}
                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                            />
                                        </div>
                                        <ProfileInfoCard
                                        title="基本資料"
                                        description={customerData.remark || '尚無資料'}
                                        details={{
                                            "客戶編號": customerData.number,
                                            "客戶姓名": customerData.name,
                                            "身分證字號": customerData.id_number,
                                            "生日": customerData.birthday,
                                            "電話": customerData.phone,
                                            "電子郵件": customerData.email,
                                            "地址": customerData.address,
                                            
                                        }}
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                                        <ProfileInfoCard
                                        title="公司資料"
                                        details={{
                                            "公司名稱": customerData.company_name,
                                            "統一編號": customerData.company_number,
                                            "公司電話": customerData.company_phone_number,
                                            "公司傳真": customerData.company_fax_number,
                                            "公司網站": customerData.company_website,
                                            "公司電子郵件": customerData.company_email,
                                            "公司地址": customerData.company_address,
                                            
                                        }}
                                        
                                        />
                                        <ProfileInfoCard
                                            title="聯絡人資料"
                                            details={{
                                                "聯絡人姓名": customerData.company_contact_person,
                                                "聯絡人電話": customerData.company_contact_person_phone_number,
                                                "聯絡人電子郵件": customerData.company_contact_person_email,
                                                "公司電子郵件": customerData.company_email,
                                                "公司地址": customerData.company_address,
                                                social: (
                                                    <>
                                                <div className="flex items-center gap-4">
                                                    <i className="fa-brands fa-line text-green-700" /><Typography>{customerData.line_nickname}</Typography>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Input label="Line ID" value={customerData.line_id} readOnly></Input>
                                            </div>
                                            </>
                                                ),
                                            }}
                                            
                                            />
                                            </div>
                                    </div>
                                
                                    </CardBody>
                                </Card>     
                           
                                
                            </>
                        ) : (
                            <>
                             <div className="relative mt-8 h-36 w-full overflow-hidden rounded-xl bg-[url('/img/home-decor-1.jpeg')] bg-cover	bg-bottom">
                                <div className="absolute inset-0 h-full w-full bg-gray-900/20" />
                            </div>
                            <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
                            <CardBody className="p-4">
                            <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                                        <div className="flex items-center gap-6">
                                        <Avatar
                                            src="/img/logo_example.jpg"
                                            alt="bruce-mars"
                                            size="xl"
                                            variant="rounded"
                                            className="rounded-lg shadow-lg shadow-blue-gray-500/40"
                                        />
                                        <div>
                                            <Typography variant="h5" color="blue-gray" className="mb-1">
                                            <Input
                                                label="公司名稱"
                                                value={customerData.company_name}
                                                onChange={(e) => setCustomerData({ ...customerData, company_name: e.target.value })}
                                            />
                                                        </Typography>
                                                        <Typography
                                                        variant="small"
                                                        className="font-normal text-blue-gray-600"
                                                        >
                                                        <Input
                                                label="客戶編號"
                                                value={customerData.number}
                                                onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
                                            />
                                            </Typography>
                                        </div>
                                        </div>
                                        <div className="w-80">
                                            <Tabs value="settings">
                                                <TabsHeader>
                                                <Tab value="app" onClick={toggleViewMode}>
                                                    <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                    瀏覽模式
                                                </Tab>
                                                <Tab value="settings">
                                                    <PencilIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                    編輯模式
                                                </Tab>
                                                </TabsHeader>
                                            </Tabs>
                                        </div>
                                    </div>
                                    <div className="gird-cols-1 mb-12 grid gap-4 px-4 lg:grid-cols-1 xl:grid-cols-1">
                                        <div>
                                            <Typography variant="h6" color="blue-gray" className="mb-3">
                                                狀態
                                            </Typography>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                        label="狀態"
                                                        checked={customerData.status === 1}
                                                        onChange={(e) => setCustomerData({ ...customerData, status: e.target.checked ? 1 : 0 })}
                                                    />
                                                <span>{customerData.status === 1 ? '啟用' : '停用'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    label="前端可編輯"
                                                    checked={customerData.modify === 1}
                                                    onChange={(e) => setCustomerData({ ...customerData, modify: e.target.checked ? 1 : 0 })}
                                                />
                                            </div>
                                            <Typography variant="h6" color="blue-gray" className="mb-3">
                                                其他設定
                                            </Typography>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Typography variant="h6" color="blue-gray" className="col-span-2 mb-2 flex items-center justify-between">
                                                基本資料
                                                
                                        </Typography>
                                        <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                
                                                label="客戶編號"
                                                value={customerData.number}
                                                onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="客戶姓名"
                                                value={customerData.name}
                                                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                                required
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="身分證字號"
                                                value={customerData.id_number}
                                                onChange={(e) => setCustomerData({ ...customerData, id_number: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                type="date"
                                                label="生日"
                                                value={formatDate(customerData.birthday)}
                                                onChange={(e) => setCustomerData({ ...customerData, birthday: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="電話"
                                                value={customerData.phone}
                                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="電子郵件"
                                                value={customerData.email}
                                                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                                type="email"
                                            />
                                            </div> 
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="地址"
                                                    value={customerData.address}
                                                    onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                                                />
                                            </div> 
                                         
                                            <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                                                公司資料
                                            </Typography>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="公司名稱"
                                                value={customerData.company_name}
                                                onChange={(e) => setCustomerData({ ...customerData, company_name: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="統一編號"
                                                value={customerData.company_number}
                                                onChange={(e) => setCustomerData({ ...customerData, company_number: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="公司電話"
                                                value={customerData.company_phone_number}
                                                onChange={(e) => setCustomerData({ ...customerData, company_phone_number: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="公司傳真"
                                                value={customerData.company_fax_number}
                                                onChange={(e) => setCustomerData({ ...customerData, company_fax_number: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="公司網站"
                                                value={customerData.company_website}
                                                onChange={(e) => setCustomerData({ ...customerData, company_website: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="公司電子郵件"
                                                value={customerData.company_email}
                                                onChange={(e) => setCustomerData({ ...customerData, company_email: e.target.value })}
                                                type="email"
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="公司地址"
                                                    value={customerData.company_address}
                                                    onChange={(e) => setCustomerData({ ...customerData, company_address: e.target.value })}
                                                />
                                            </div>
                                            <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                                                聯絡人資料
                                            </Typography>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="聯絡人姓名"
                                                value={customerData.company_contact_person}
                                                onChange={(e) => setCustomerData({ ...customerData, company_contact_person: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="聯絡人電話"
                                                value={customerData.company_contact_person_phone_number}
                                                onChange={(e) => setCustomerData({ ...customerData, company_contact_person_phone_number: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="聯絡人電子郵件"
                                                value={customerData.company_contact_person_email}
                                                onChange={(e) => setCustomerData({ ...customerData, company_contact_person_email: e.target.value })}
                                                type="email"
                                            />
                                            </div>
                                            <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                                                LINE 資料
                                            </Typography>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="LINE ID"
                                                value={customerData.line_id}
                                                onChange={(e) => setCustomerData({ ...customerData, line_id: e.target.value })}
                                            />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                            <Input
                                                label="LINE 暱稱"
                                                value={customerData.line_nickname}
                                                onChange={(e) => setCustomerData({ ...customerData, line_nickname: e.target.value })}
                                            />
                                            </div>
                                            <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                                                其他設定
                                            </Typography>
                                            <div className="col-span-2">
                                                <Textarea
                                                    label="備註"
                                                    value={customerData.remark}
                                                    onChange={(e) => setCustomerData({ ...customerData, remark: e.target.value })}
                                                />
                                            </div>
                                            


                                        </div>
                                        
                            </div>
                            </CardBody>
                            </Card>  
                            
                                
                                
                            </>
                        )}

                    
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button 
                        variant="outlined" 
                        color="red" 
                        onClick={handleCancel}
                    >
                        {viewMode === 'view' ? '關閉' : '取消'}
                    </Button>
                    {viewMode === 'edit' && (
                        <Button 
                            variant="gradient" 
                            color="green" 
                            onClick={handleSaveEdit}
                        >
                            保存
                        </Button>
                    )}
                </DialogFooter>
            </Dialog>

            {error && (
                <div className="text-red-500 text-center p-4">
                    {error}
                </div>
            )}
            {checkUserPermission() ? (
                // 正常渲染内容
                <div>
                    {/* 您的现有内容 */}
                </div>
            ) : (
                // 未登录或无权限时显示的内容
                <div className="text-center p-4">
                    <Typography variant="h6" color="blue-gray">
                        請先登入或確認您的權限
                    </Typography>
                </div>
            )}

          
        </div>
    );
}

export default CustomerList;
  