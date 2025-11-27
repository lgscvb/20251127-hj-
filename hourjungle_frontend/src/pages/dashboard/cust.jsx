import {
    Card,
    CardHeader,
    CardBody,
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
} from "@material-tailwind/react";
import { authorsTableData } from "@/data";
import { useState, useEffect } from "react";
import { ArrowRightIcon, ArrowLeftIcon, EyeIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerInfo } from "@/redux/actions";

export function cust() {
    const dispatch = useDispatch();
    const { list: customers, loading, pagination } = useSelector(state => state.customers);
    const [selectedFile, setSelectedFile] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [customerData, setCustomerData] = useState({
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

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 检查文件类型
            if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
                file.type === "application/vnd.ms-excel") {
                setSelectedFile(file);
                // TODO: 处理文件上传逻辑
                console.log("File selected:", file);
            } else {
                alert("请上传Excel文件格式(.xlsx或.xls)");
            }
        }
    };

    const handleDownloadTemplate = () => {
        // TODO: 实现下载模板的逻辑
        // 这里是示例链接，需要替换为实际的模板文件URL
        const templateUrl = '/templates/customer-template.xlsx';
        const link = document.createElement('a');
        link.href = templateUrl;
        link.download = '客户资料导入模板.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpen = () => setOpen(!open);

    // 修改處理函數
    const handleOpenAdd = () => {
        // 重置表單數據
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
        // 打開新增客戶彈窗
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
        // 打開新增客戶彈窗
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

            const formData = new FormData();
            Object.keys(customerData).forEach(key => {
                if (customerData[key] !== null && customerData[key] !== undefined) {
                    formData.append(key, customerData[key]);
                }
            });

            // 處理文件上傳
            if (customerData.id_card_front instanceof File) {
                formData.append('id_card_front', customerData.id_card_front);
            }
            if (customerData.id_card_back instanceof File) {
                formData.append('id_card_back', customerData.id_card_back);
            }

            const response = await dispatch(createCustomer(formData));
            if (response.success) {
                setOpenAdd(false);
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
            const response = await dispatch(getCustomerInfo(id));
            if (response.success) {
                setCustomerData({
                    ...response.data,
                    birthday: formatDate(response.data.birthday),  // 格式化生日日期
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
                setCustomerData(response.data);
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

    // 初始化數據
    useEffect(() => {
        dispatch(fetchCustomers({
            page: currentPage,
            per_page: itemsPerPage,
            keyword: searchKeyword
        }));
    }, [dispatch, currentPage, itemsPerPage, searchKeyword]);

    // 處理搜索
    const handleSearch = () => {
        setCurrentPage(1);
        dispatch(fetchCustomers({
            page: 1,
            per_page: itemsPerPage,
            keyword: searchKeyword
        }));
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
                <Typography color="gray" className="font-normal">
                    第 {pagination.current_page} 頁，共 {Math.ceil(pagination.total / pagination.per_page)} 頁
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

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
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
                                className="flex items-center gap-2"
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                選擇檔案上傳
                            </Button>
                        </label>
                        {selectedFile && (
                            <Typography variant="small" className="text-black">
                                已選擇: {selectedFile.name}
                            </Typography>
                        )}
                        <Button
                            variant="gradient"
                            color="green"
                            className="flex items-center gap-2"
                            onClick={handleDownloadTemplate}
                        >
                            下載範例
                        </Button>
                        <Button
                            variant="gradient"
                            className="flex items-center gap-2"
                        >
                            匯出客戶列表
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-8 p-6 flex justify-between">
                    <Typography variant="h6" color="black">
                        客戶列表
                    </Typography>
                    
                    
                    <Button
                        variant="gradient"
                        color="amber"
                        className="flex items-center gap-2"
                        onClick={handleAddCustomer}
                    >
                        新增客戶
                    </Button>
                </CardHeader>
                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
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
                        <div className="w-72 flex items-center gap-2">
                            <Input
                                label="搜尋"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" onClick={handleSearch} />}
                            />
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <Spinner className="h-12 w-12" />
                        </div>
                    ) : (
                        <>
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {["商標","客戶編號", "客戶姓名", "公司名稱", "狀態", "新增時間", "操作"].map((el) => (
                                            <th
                                                key={el}
                                                className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                            >
                                                <Typography
                                                    variant="small"
                                                    className="text-[11px] font-bold uppercase text-blue-gray-400"
                                                >
                                                    {el}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4">
                                                <Spinner />
                                            </td>
                                        </tr>
                                    ) : customers.length > 0 ? (
                                        customers.map((customer, key) => (
                                            <tr key={customer.id}>
                                                <td className="py-3 px-5">
                                                    <img src={customer.img} alt="商標" className="w-10 h-10" />
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {customer.number}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {customer.name}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {customer.company_name}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Chip
                                                        variant="gradient"
                                                        color={customer.status ? "green" : "blue-gray"}
                                                        value={customer.status ? "啟用" : "禁用"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {customer.created_at}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <div className="flex gap-2">
                                                        <IconButton
                                                            variant="text"
                                                            color="blue"
                                                            onClick={() => handleView(customer.id)}
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </IconButton>
                                                        <IconButton
                                                            variant="text"
                                                            color="green"
                                                            onClick={() => handleEdit(customer.id)}
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </IconButton>
                                                        <IconButton
                                                            variant="text"
                                                            color="red"
                                                            onClick={() => handleDeleteCustomer(customer.id)}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4">
                                                <Typography>尚無資料</Typography>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="flex justify-center p-4">
                                <Pagination />
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>

            {/* 新增客戶彈窗 */}
            <Dialog open={openAdd} handler={handleOpenAdd} size="xl">
                <DialogHeader>新增客戶資料</DialogHeader>
                <DialogBody divider className="h-[40rem] overflow-y-scroll">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 基本資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mb-2">
                            基本資料
                        </Typography>
                        <Input
                            label="客戶編號"
                            value={customerData.number}
                            onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
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
                        />
                        <Input
                            label="電子郵件"
                            value={customerData.email}
                            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                            type="email"
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
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.type.startsWith('image/')) {
                                                setCustomerData({
                                                    ...customerData,
                                                    id_card_front: file
                                                });
                                            } else {
                                                alert('請上傳圖片檔案');
                                            }
                                        }
                                    }}
                                    className="mb-2"
                                />
                                {customerData.id_card_front && (
                                    <img 
                                        src={URL.createObjectURL(customerData.id_card_front)}
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
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.type.startsWith('image/')) {
                                                setCustomerData({
                                                    ...customerData,
                                                    id_card_back: file
                                                });
                                            } else {
                                                alert('請上傳圖片檔案');
                                            }
                                        }
                                    }}
                                    className="mb-2"
                                />
                                {customerData.id_card_back && (
                                    <img 
                                        src={URL.createObjectURL(customerData.id_card_back)}
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
                        className="flex items-center gap-2"
                        onClick={toggleViewMode}
                    >
                        {viewMode === 'view' ? '切換至編輯模式' : '切換至查看模式'}
                    </Button>
                </DialogHeader>
                <DialogBody divider className="h-[40rem] overflow-y-scroll">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 基本資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mb-2">
                            基本資料
                        </Typography>
                        {viewMode === 'view' ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        客戶編號
                                    </Typography>
                                    <Typography>{customerData.number}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        客戶姓名
                                    </Typography>
                                    <Typography>{customerData.name}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        身分證字號
                                    </Typography>
                                    <Typography>{customerData.id_number}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        生日
                                    </Typography>
                                    <Typography>{customerData.birthday}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        電話
                                    </Typography>
                                    <Typography>{customerData.phone}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        電子郵件
                                    </Typography>
                                    <Typography>{customerData.email}</Typography>
                                </div>
                                <div className="col-span-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        地址
                                    </Typography>
                                    <Typography>{customerData.address}</Typography>
                                </div>
                            </>
                        ) : (
                            <>
                                <Input
                                    label="客戶編號"
                                    value={customerData.number}
                                    onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
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
                                />
                                <Input
                                    label="電子郵件"
                                    value={customerData.email}
                                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                    type="email"
                                />
                                <div className="col-span-2">
                                    <Input
                                        label="地址"
                                        value={customerData.address}
                                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {/* 公司資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            公司資料
                        </Typography>
                        {viewMode === 'view' ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        公司名稱
                                    </Typography>
                                    <Typography>{customerData.company_name}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        統一編號
                                    </Typography>
                                    <Typography>{customerData.company_number}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        公司電話
                                    </Typography>
                                    <Typography>{customerData.company_phone_number}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        公司傳真
                                    </Typography>
                                    <Typography>{customerData.company_fax_number}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        公司網站
                                    </Typography>
                                    <Typography>{customerData.company_website}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        公司電子郵件
                                    </Typography>
                                    <Typography>{customerData.company_email}</Typography>
                                </div>
                                <div className="col-span-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        公司地址
                                    </Typography>
                                    <Typography>{customerData.company_address}</Typography>
                                </div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

                        {/* 聯絡人資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            聯絡人資料
                        </Typography>
                        {viewMode === 'view' ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        聯絡人姓名
                                    </Typography>
                                    <Typography>{customerData.company_contact_person}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        聯絡人電話
                                    </Typography>
                                    <Typography>{customerData.company_contact_person_phone_number}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        聯絡人電子郵件
                                    </Typography>
                                    <Typography>{customerData.company_contact_person_email}</Typography>
                                </div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

                        {/* LINE 資料 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            LINE 資料
                        </Typography>
                        {viewMode === 'view' ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        LINE ID
                                    </Typography>
                                    <Typography>{customerData.line_id}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        LINE 暱稱
                                    </Typography>
                                    <Typography>{customerData.line_nickname}</Typography>
                                </div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

                        {/* 其他設定 */}
                        <Typography variant="h6" color="blue-gray" className="col-span-2 mt-4 mb-2">
                            其他設定
                        </Typography>
                        {viewMode === 'view' ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        備註
                                    </Typography>
                                    <Typography>{customerData.remark}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        狀態
                                    </Typography>
                                    <Chip
                                        variant="gradient"
                                        color={customerData.status === 1 ? "green" : "blue-gray"}
                                        value={customerData.status === 1 ? "啟用" : "停用"}
                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
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
        </div>
    );
}

export default cust;
  