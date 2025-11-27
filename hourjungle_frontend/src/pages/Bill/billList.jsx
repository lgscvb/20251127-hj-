import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Chip,
    Button,
    IconButton,
    Input,
    Spinner,
    Select,
    Option,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Textarea,
    Switch,
    Avatar,
    Tab,
    Tabs,
    TabsHeader,
} from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon, EyeIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, HomeIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBills, getBillInfo, updateBill, deleteBill, createBill, fetchCustomers } from "@/redux/actions";
import { usePermission } from '@/hooks/usePermission';
import { ProfileInfoCard } from "@/widgets/cards";

export function BillList() {
    const { hasPermission } = usePermission();
    const dispatch = useDispatch();
    const [searchKeyword, setSearchKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [viewMode, setViewMode] = useState('view');
    const [billData, setBillData] = useState({});
    const [searchField, setSearchField] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);

    // 使用 useMemo 优化 bills 数据的选择
    const bills = useSelector(state => {
        console.log('Redux State:', state);  // 输出整个 Redux 状态
        console.log('Bills State:', state.bills);  // 输出 bills 相关的状态
        return state.bills?.list || [];
    });
    
    const pagination = useSelector(state => state.bills?.pagination || {
        current_page: 1,
        per_page: 10,
        total: 0
    });

    // 獲取客戶列表數據，用於創建發票時選擇客戶
    const customers = useSelector(state => state.customers?.list || []);

    // 获取发票列表数据
    useEffect(() => {
        setIsLoading(true);
        console.log('Fetching bills with params:', {  // 输出请求参数
            page: currentPage,
            per_page: itemsPerPage,
            keyword: searchKeyword
        });

        dispatch(fetchBills({
            page: currentPage,
            per_page: itemsPerPage,
            keyword: searchKeyword
        }))
        .then(response => {
            console.log('Fetch bills response:', response);  // 输出请求响应
        })
        .catch(error => {
            console.error('Fetch bills error:', error);  // 输出错误信息
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, [dispatch, currentPage, itemsPerPage, searchKeyword]);

    // 獲取客戶列表數據，用於創建發票時選擇客戶
    useEffect(() => {
        dispatch(fetchCustomers());
    }, [dispatch]);

    // 处理搜索
    const handleSearch = (e) => {
        const keyword = e.target.value;
        setSearchKeyword(keyword);
        setCurrentPage(1);
    };

    // 处理每页显示数量变更
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(parseInt(value));
        setCurrentPage(1);
    };

    // 查看發票詳情
    const handleView = async (id) => {
        try {
            const response = await dispatch(getBillInfo(id));
            if (response.success) {
                setBillData(response.data);
                setViewMode('view');
                setDetailOpen(true);
            } else {
                alert(response.message || '獲取發票詳情失敗');
            }
        } catch (error) {
            console.error('View bill error:', error);
            alert('獲取發票詳情失敗');
        }
    };

    // 编辑發票
    const handleEdit = async (id) => {
        try {
            const response = await dispatch(getBillInfo(id));
            if (response.success) {
                setBillData(response.data);
                setViewMode('edit');
                setDetailOpen(true);
            } else {
                alert(response.message || '獲取發票詳情失敗');
            }
        } catch (error) {
            console.error('Edit bill error:', error);
            alert('獲取發票詳情失敗');
        }
    };

    // 删除發票
    const handleDelete = async (id) => {
        if (window.confirm('確定要刪除此發票嗎？')) {
            try {
                const response = await dispatch(deleteBill(id));
                if (response.success) {
                    dispatch(fetchBills({
                        page: currentPage,
                        per_page: itemsPerPage,
                        keyword: searchKeyword
                    }));
                } else {
                    alert(response.message || '刪除發票失敗');
                }
            } catch (error) {
                console.error('Delete bill error:', error);
                alert('刪除發票失敗');
            }
        }
    };

    // 保存編輯
    const handleSaveEdit = async () => {
        try {
            const response = await dispatch(updateBill(billData));
            if (response.success) {
                setDetailOpen(false);
                setViewMode('view');
                dispatch(fetchBills({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
                }));
            } else {
                alert(response.message || '更新發票失敗');
            }
        } catch (error) {
            console.error('Update bill error:', error);
            alert('更新發票失敗');
        }
    };

    // 切換檢視/編輯模式
    const toggleViewMode = () => {
        setViewMode(viewMode === 'view' ? 'edit' : 'view');
    };

    // 關閉對話框
    const handleClose = () => {
        setDetailOpen(false);
        setBillData({});
    };

    // 處理輸入欄位變更
    const handleInputChange = (field) => (e) => {
        setBillData({
            ...billData,
            [field]: e.target.value
        });
    };

    // 處理開關變更
    const handleSwitchChange = (field) => (e) => {
        setBillData({
            ...billData,
            [field]: e.target.checked ? 1 : 0
        });
    };

    // 分页组件
    const Pagination = () => {
        console.log('Pagination info:', {  // 输出分页信息
            currentPage,
            itemsPerPage,
            total: pagination.total
        });

        const handlePrevPage = () => {
            if (currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        };

        const handleNextPage = () => {
            if (pagination && currentPage < Math.ceil(pagination.total / pagination.per_page)) {
                setCurrentPage(prev => prev + 1);
            }
        };

        return (
            <div className="flex items-center gap-4">
                <Button
                    variant="text"
                    className="flex items-center gap-2"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> 上一頁
                </Button>
                <Typography color="gray" className="font-normal text-sm">
                    第 {currentPage} / {Math.max(1, Math.ceil(pagination.total / pagination.per_page))} 頁
                </Typography>
                <Button
                    variant="text"
                    className="flex items-center gap-2"
                    onClick={handleNextPage}
                    disabled={!pagination || currentPage >= Math.ceil(pagination.total / pagination.per_page)}
                >
                    下一頁 <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    console.log('Rendering bills:', bills);  // 输出渲染的账单数据

    const requiredFields = {
        'invoice_number': '发票号码',
        'invoice_period': '发票期别',
        'date': '日期',
        'total_amount': '总金额',
        'tax_type': '税别'
    };

    // 前端筛选逻辑
    const filteredBills = useMemo(() => {
        if (!searchKeyword) return bills;
        
        const keyword = searchKeyword.toLowerCase();
        
        return bills.filter(bill => {
            if (searchField === 'all') {
                return (bill.invoice_number && bill.invoice_number.toLowerCase().includes(keyword)) ||
                       (bill.invoice_period && bill.invoice_period.toLowerCase().includes(keyword)) ||
                       (bill.date && bill.date.toLowerCase().includes(keyword)) ||
                       (bill.company_name && bill.company_name.toLowerCase().includes(keyword)) ||
                       (bill.customer_name && bill.customer_name.toLowerCase().includes(keyword)) ||
                       (bill.total_amount && bill.total_amount.toString().includes(keyword)) ||
                       (bill.tax_type && bill.tax_type.toLowerCase().includes(keyword));
            }
            
            // 针对特定字段搜索
            const fieldValue = bill[searchField];
            if (!fieldValue) return false;
            
            return typeof fieldValue === 'string' 
              ? fieldValue.toLowerCase().includes(keyword)
              : fieldValue.toString().includes(keyword);
        });
    }, [bills, searchKeyword, searchField]);

    // 創建發票
    const handleCreateBill = () => {
        // 初始化創建發票的表單數據
        setBillData({
            customer_id: '',
            customer_number: '',
            customer_name: '',
            company_name: '',
            invoice_number: '',
            invoice_period: '',
            date: '',
            time: '',
            buyer: '',
            address: '',
            total_amount: '',
            tax_type: '',
            has_stamp: 0,
            seller_tax_id: '',
            remark: ''
        });
        setOpenCreate(true);
    };

    // 處理客戶選擇變更
    const handleCustomerSelect = (id) => {
        const selectedCustomer = customers.find(c => c.id.toString() === id);
        if (selectedCustomer) {
            setBillData({
                ...billData,
                customer_id: selectedCustomer.id,
                customer_number: selectedCustomer.number || '',
                customer_name: selectedCustomer.name || '',
                company_name: selectedCustomer.company_name || '',
                buyer: selectedCustomer.name || selectedCustomer.company_name || '',
                address: selectedCustomer.address || selectedCustomer.company_address || ''
            });
        }
    };

    // 提交創建發票
    const handleSubmitCreate = async () => {
        // 驗證必填欄位
        const requiredFields = ['customer_id', 'invoice_number', 'invoice_period', 'date', 'total_amount'];
        const missingFields = requiredFields.filter(field => !billData[field]);
        
        if (missingFields.length > 0) {
            alert('請填寫所有必填欄位: ' + missingFields.join(', '));
            return;
        }

        try {
            const response = await dispatch(createBill(billData));
            if (response.success) {
                setOpenCreate(false);
                dispatch(fetchBills({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
                }));
                alert('發票創建成功');
            } else {
                alert(response.message || '創建發票失敗');
            }
        } catch (error) {
            console.error('Create bill error:', error);
            alert('創建發票失敗');
        }
    };

    // 關閉創建對話框
    const handleCloseCreate = () => {
        setOpenCreate(false);
        setBillData({});
    };

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-8 p-6">
                    <div className="flex justify-between items-center">
                        <Typography variant="h6" color="green" className="flex items-center gap-2">
                            發票列表
                        </Typography>
                        {hasPermission('新增發票') && (
                            <Button 
                                size="sm" 
                                color="green" 
                                className="flex items-center gap-2"
                                onClick={handleCreateBill}
                            >
                                <PlusIcon strokeWidth={2} className="h-4 w-4" /> 新增發票
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="px-0 pt-0 pb-2">
                    <div className="px-4 py-2">
                        <Select
                            value={itemsPerPage.toString()}
                            onChange={(value) => handleItemsPerPageChange(value)}
                            label="每頁顯示筆數"
                        >
                            <Option value="10">10 筆</Option>
                            <Option value="20">20 筆</Option>
                            <Option value="50">50 筆</Option>
                        </Select>
                    </div>
                    <div className="flex justify-between items-center p-4">
                        <div className="w-full md:w-72 flex gap-2">
                            <Select
                                value={searchField}
                                onChange={(value) => setSearchField(value)}
                                label="搜尋欄位"
                            >
                                <Option value="all">全部</Option>
                                <Option value="invoice_number">發票號碼</Option>
                                <Option value="invoice_period">發票期別</Option>
                                <Option value="date">日期</Option>
                                <Option value="company_name">公司名稱</Option>
                                <Option value="customer_name">客戶名稱</Option>
                                <Option value="total_amount">總金額</Option>
                                <Option value="tax_type">稅別</Option>
                            </Select>
                            
                            <Input 
                                label="搜尋發票" 
                                value={searchKeyword}
                                onChange={handleSearch}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                
                            />
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <Spinner className="h-12 w-12" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-scroll">
                                <table className="w-full min-w-[640px] table-auto">
                                    <thead>
                                        <tr>
                                            {["發票號碼", "發票期別", "日期", "公司名稱", "客戶名稱", "總金額", "稅別", "狀態", "操作"].map((el) => (
                                                <th
                                                    key={el}
                                                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                                >
                                                    <Typography
                                                        variant="small"
                                                        className="text-[11px] font-bold uppercase text-blue-gray-400 ell"
                                                    >
                                                        {el}
                                                    </Typography>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBills.map((bill) => (
                                            <tr key={bill.id}>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {bill.invoice_number || ''}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {bill.invoice_period || ''}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {bill.date || ''}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                        <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {bill.company_name || ''}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {bill.customer_name || ''}
                                                    </Typography>
                                                </td>

                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        ${bill.total_amount || ''}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {bill.tax_type || ''}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Chip
                                                        variant="gradient"
                                                        color={bill.has_stamp ? "green" : "blue-gray"}
                                                        value={bill.has_stamp ? "已蓋章" : "未蓋章"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </td>
                                                <td className="py-3 px-5">
                                                    <div className="flex gap-2">
                                                        {hasPermission('查看發票') && (
                                                            <IconButton
                                                                variant="text"
                                                                color="blue"
                                                                onClick={() => handleView(bill.id)}
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </IconButton>
                                                        )}
                                                        {hasPermission('編輯發票') && (
                                                            <IconButton
                                                                variant="text"
                                                                color="green"
                                                                onClick={() => handleEdit(bill.id)}
                                                            >
                                                                <PencilSquareIcon className="h-4 w-4" />
                                                            </IconButton>
                                                        )}
                                                        {hasPermission('刪除發票') && (
                                                            <IconButton
                                                                variant="text"
                                                                color="red"
                                                                onClick={() => handleDelete(bill.id)}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </IconButton>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
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

            {/* 查看/編輯發票彈窗 */}
            <Dialog open={detailOpen} handler={() => setDetailOpen(!detailOpen)} size="xl">
                <DialogHeader className="flex justify-between items-center">
                    <Typography variant="h6">
                        {viewMode === 'view' ? '查看發票資料' : '編輯發票資料'}
                    </Typography>
                </DialogHeader>
                <DialogBody divider className="h-[40rem] overflow-y-scroll">
                    {viewMode === 'view' ? (
                        <>
                            <div className="relative mt-8 h-36 w-full overflow-hidden rounded-xl bg-[url('/img/home-decor-1.jpeg')] bg-cover bg-bottom">
                                <div className="absolute inset-0 h-full w-full bg-gray-900/20" />
                            </div>
                            <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
                                <CardBody className="p-4">
                                    <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                                        <div className="flex items-center gap-6">
                                            <Avatar
                                                src="/img/logo_example.jpg"
                                                alt="invoice"
                                                size="xl"
                                                variant="rounded"
                                                className="rounded-lg shadow-lg shadow-blue-gray-500/40"
                                            />
                                            <div>
                                                <Typography variant="h5" color="blue-gray" className="mb-1">
                                                    {billData.invoice_number || ''}
                                                </Typography>
                                                <Typography
                                                    variant="small"
                                                    className="font-normal text-blue-gray-600"
                                                >
                                                    {billData.date || ''}
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
                                                    {hasPermission('編輯發票') && (
                                                        <Tab value="settings" onClick={toggleViewMode}>
                                                            <PencilIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                                                            編輯模式
                                                        </Tab>
                                                    )}
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
                                                color={billData.has_stamp ? "green" : "blue-gray"}
                                                value={billData.has_stamp ? "已蓋章" : "未蓋章"}
                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                            />
                                        </div>
                                        <ProfileInfoCard
                                            title="發票資料"
                                            description={billData.remark || '尚無資料'}
                                            details={{
                                                "發票號碼": billData.invoice_number || '',
                                                "發票期別": billData.invoice_period || '',
                                                "日期": billData.date || '',
                                                "總金額": `$${billData.total_amount || ''}`,
                                                "稅別": billData.tax_type || '',
                                                "公司名稱": billData.company_name || '',
                                                "客戶名稱": billData.customer_name || ''
                                            }}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </>
                    ) : (
                        <>
                            <div className="relative mt-8 h-36 w-full overflow-hidden rounded-xl bg-[url('/img/home-decor-1.jpeg')] bg-cover bg-bottom">
                                <div className="absolute inset-0 h-full w-full bg-gray-900/20" />
                            </div>
                            <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
                                <CardBody className="p-4">
                                    <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                                        <div className="flex items-center gap-6">
                                            <Avatar
                                                src="/img/logo_example.jpg"
                                                alt="invoice"
                                                size="xl"
                                                variant="rounded"
                                                className="rounded-lg shadow-lg shadow-blue-gray-500/40"
                                            />
                                            <div>
                                                <Typography variant="h5" color="blue-gray" className="mb-1">
                                                    <Input
                                                        label="發票號碼"
                                                        value={billData.invoice_number || ''}
                                                        onChange={handleInputChange('invoice_number')}
                                                    />
                                                </Typography>
                                                <Typography
                                                    variant="small"
                                                    className="font-normal text-blue-gray-600"
                                                >
                                                    <Input
                                                        type="date"
                                                        label="日期"
                                                        value={billData.date || ''}
                                                        onChange={handleInputChange('date')}
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
                                                    label="蓋章狀態"
                                                    checked={billData.has_stamp === 1}
                                                    onChange={handleSwitchChange('has_stamp')}
                                                />
                                                <span>{billData.has_stamp ? '已蓋章' : '未蓋章'}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Typography variant="h6" color="blue-gray" className="col-span-2 mb-2 flex items-center justify-between">
                                                發票資料
                                            </Typography>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="發票號碼"
                                                    value={billData.invoice_number || ''}
                                                    onChange={handleInputChange('invoice_number')}
                                                />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="發票期別"
                                                    value={billData.invoice_period || ''}
                                                    onChange={handleInputChange('invoice_period')}
                                                />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    type="date"
                                                    label="日期"
                                                    value={billData.date || ''}
                                                    onChange={handleInputChange('date')}
                                                />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="總金額"
                                                    value={billData.total_amount || ''}
                                                    onChange={handleInputChange('total_amount')}
                                                />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="稅別"
                                                    value={billData.tax_type || ''}
                                                    onChange={handleInputChange('tax_type')}
                                                />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="公司名稱"
                                                    value={billData.company_name || ''}
                                                    onChange={handleInputChange('company_name')}
                                                />
                                            </div>
                                            <div className="col-span-2 lg:col-span-1">
                                                <Input
                                                    label="客戶名稱"
                                                    value={billData.customer_name || ''}
                                                    onChange={handleInputChange('customer_name')}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Textarea
                                                    label="備註"
                                                    value={billData.remark || ''}
                                                    onChange={handleInputChange('remark')}
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
                        onClick={handleClose}
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

            {/* 創建發票對話框 */}
            <Dialog open={openCreate} handler={() => setOpenCreate(!openCreate)} size="xl">
                <DialogHeader className="flex justify-between items-center">
                    <Typography variant="h6">
                        新增發票
                    </Typography>
                </DialogHeader>
                <DialogBody divider className="h-[40rem] overflow-y-scroll">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mb-2">
                            基本資料
                        </Typography>
                        <div className="col-span-2 lg:col-span-1">
                            <Select
                                label="選擇客戶 *"
                                onChange={(value) => handleCustomerSelect(value)}
                                required
                            >
                                {customers.map((customer) => (
                                    <Option key={customer.id} value={customer.id.toString()}>
                                        {customer.company_name || customer.name} ({customer.number})
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                label="發票號碼 *"
                                value={billData.invoice_number || ''}
                                onChange={handleInputChange('invoice_number')}
                            />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                label="發票期別 *"
                                value={billData.invoice_period || ''}
                                onChange={handleInputChange('invoice_period')}
                            />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                type="date"
                                label="日期 *"
                                value={billData.date || ''}
                                onChange={handleInputChange('date')}
                            />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                label="總金額 *"
                                value={billData.total_amount || ''}
                                onChange={handleInputChange('total_amount')}
                            />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                label="稅別"
                                value={billData.tax_type || ''}
                                onChange={handleInputChange('tax_type')}
                            />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                label="買方名稱"
                                value={billData.buyer || ''}
                                onChange={handleInputChange('buyer')}
                            />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <Input
                                label="賣方統一編號"
                                value={billData.seller_tax_id || ''}
                                onChange={handleInputChange('seller_tax_id')}
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label="地址"
                                value={billData.address || ''}
                                onChange={handleInputChange('address')}
                            />
                        </div>
                        <div className="col-span-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    label="蓋章狀態"
                                    checked={billData.has_stamp === 1}
                                    onChange={handleSwitchChange('has_stamp')}
                                />
                                <span>{billData.has_stamp ? '已蓋章' : '未蓋章'}</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <Textarea
                                label="備註"
                                value={billData.remark || ''}
                                onChange={handleInputChange('remark')}
                            />
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button 
                        variant="outlined" 
                        color="red" 
                        onClick={handleCloseCreate}
                    >
                        取消
                    </Button>
                    <Button 
                        variant="gradient" 
                        color="green" 
                        onClick={handleSubmitCreate}
                    >
                        保存
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

export default BillList;
  