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
import { fetchBusinessItems, createBusinessItem, updateBusinessItem, deleteBusinessItem, getBusinessItemInfo, importBusinessItems, exportBusinessItems, exportBusinessItemsExample } from "@/redux/actions";
import { createSelector } from 'reselect';
import { PermissionWrapper } from '@/components/PermissionWrapper';
import { usePermission } from '@/hooks/usePermission';
import * as XLSX from 'xlsx';




// 修改 memoized 選擇器
const selectBusinessItems = createSelector(
    state => state.businessItems,
    businessItems => {
        console.log('Selector state:', businessItems);
        return {
            list: businessItems?.list || [],
            loading: businessItems?.loading || false,
            pagination: businessItems?.pagination || {
                current_page: 1,
                per_page: 10,
                total: 0
            }
        };
    }
);

export function BusinessItemList() {
    const { hasPermission, isTopAccount } = usePermission();
    const user = useSelector(state => state.auth.user) || {};
    const dispatch = useDispatch();
    const { list: businessItems, loading } = useSelector(state => state.businessItems);
    const [selectedFile, setSelectedFile] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [businessItemData, setBusinessItemData] = useState({
        number: '',
        name: '',
        price: 0,
        deposit: 0,
        status: 1,
        remarks: ''
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
    const [isLoading, setIsLoading] = useState(true);

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
        setCurrentPage(newPage);
        dispatch(fetchBusinessItems({
            page: newPage,
            per_page: itemsPerPage,
            keyword: searchKeyword
        }));
    };

    // 修改處理每頁顯示數量變更的函數
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(value);
        setCurrentPage(1);
        dispatch(fetchBusinessItems({
            page: 1,
            per_page: value,
            keyword: searchKeyword
        }));
    };

    // 獲取當前頁的數據
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return authorsTableData.slice(startIndex, endIndex);
    };

    

    const handleExportExcel = async () => {
        try {
            const response = await dispatch(exportBusinessItems());
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
            const response = await dispatch(exportBusinessItemsExample());
            if (!response.success) {
                alert(response.message || '下載範例失敗');
            }
        } catch (error) {
            console.error('Download template error:', error);
            alert('下載範例失敗');
        }
    };

    const handleOpen = () => setOpen(!open);

    // 修改處理函數
    const handleAddBusinessItem = () => {
        setBusinessItemData({
            number: '',
            name: '',
            price: 0,
            deposit: 0,
            status: 1,
            remarks: ''
        });
        setOpenAdd(true);
    };
    const handleOpenEdit = () => setOpenEdit(!openEdit);
    const handleOpenView = () => setOpenView(!openView);

    // 修改處理函數
    const handleOpenDetail = () => setDetailOpen(!detailOpen);

    // 處理新增業務項目提交
    const handleSubmit = async () => {
        try {
            if (!businessItemData.name) {
                alert('請填寫業務名稱');
                return;
            }

            const submitData = {
                ...businessItemData,
                branch_id: user.branch_id,
                price: parseFloat(businessItemData.price) || 0,
                deposit: parseFloat(businessItemData.deposit) || 0
            };

            const response = await dispatch(createBusinessItem(submitData));
            if (response.success) {
                setOpenAdd(false);
                dispatch(fetchBusinessItems({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
                }));
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Add business item error:', error);
            alert('新增失敗');
        }
    };

    // 處理編輯業務項目保存
    const handleSaveEdit = async () => {
        try {
            if (!businessItemData.name) {
                alert('請填寫業務名稱');
                return;
            }

            const formData = {
                id: businessItemData.id,
                number: businessItemData.number,
                name: businessItemData.name,
                price: parseFloat(businessItemData.price) || 0,
                deposit: parseFloat(businessItemData.deposit) || 0,
                status: businessItemData.status,
                remarks: businessItemData.remarks
            };

            const response = await dispatch(updateBusinessItem(formData));
            if (response.success) {
                setDetailOpen(false);
                setViewMode('view');
                dispatch(fetchBusinessItems({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
                }));
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Update business item error:', error);
            alert('更新失敗');
        }
    };



    // 處理查看業務項目
    const handleView = async (id) => {
        try {
            const response = await dispatch(getBusinessItemInfo(id));
            if (response.success) {
                setBusinessItemData(response.data);
                setViewMode('view');
                setDetailOpen(true);
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Get business item error:', error);
            alert('獲取資料失敗');
        }
    };

    // 處理編輯業務項目
    const handleEdit = async (id) => {
        try {
            const response = await dispatch(getBusinessItemInfo(id));
            if (response.success) {
                setBusinessItemData(response.data);
                setViewMode('edit');
                setDetailOpen(true);
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Get business item error:', error);
            alert('獲取資料失敗');
        }
    };

    // 處理刪除業務項目
    const handleDeleteBusinessItem = async (id) => {
        if (window.confirm('確定要刪除此業務項目嗎？')) {
            try {
                const response = await dispatch(deleteBusinessItem(id));
                if (response.success) {
                    dispatch(fetchBusinessItems({
                        page: currentPage,
                        per_page: itemsPerPage,
                        keyword: searchKeyword
                    }));
                } else {
                    alert(response.message);
                }
            } catch (error) {
                console.error('Delete business item error:', error);
                alert('刪除失敗');
            }
        }
    };

    // 修改取消按鈕的處理函數
    const handleCancel = () => {
        setBusinessItemData({
            number: '',
            name: '',
            price: 0,
            deposit: 0,
            status: 1,
            remarks: ''
        });
        setOpenAdd(false);
        setDetailOpen(false);
        setViewMode('view');
    };

    // 切換模式處理函數
    const toggleViewMode = () => {
        setViewMode(viewMode === 'view' ? 'edit' : 'view');
    };

    // 在其他 imports 和 state 定義之後添加
    useEffect(() => {
        // 检查用户状态，如果未登录则重定向到登录页
        if (!user && !isLoading) {
            window.location.href = '/auth/sign-in';
            return;
        }

        // 获取业务项目列表
        if (user) {
            dispatch(fetchBusinessItems({
                page: currentPage,
                per_page: itemsPerPage,
                keyword: searchKeyword
            }));
            setIsLoading(false);
        }
    }, [user, dispatch, currentPage, itemsPerPage, searchKeyword]);

    // 添加搜尋處理函數
    const handleSearch = () => {
        dispatch(fetchBusinessItems({
            page: 1, // 搜尋時回到第一頁
            per_page: itemsPerPage,
            keyword: searchKeyword
        }));
    };

    // 修改分頁組件
    const Pagination = () => {
        // 使用同一個 memoized 選擇器
        const { pagination } = useSelector(selectBusinessItems);
        const dispatch = useDispatch();

        const handlePrevPage = () => {
            if (pagination.current_page > 1) {
                dispatch(fetchBusinessItems({
                    page: pagination.current_page - 1,
                    per_page: pagination.per_page,
                    keyword: searchKeyword
                }));
            }
        };

        const handleNextPage = () => {
            if (pagination.current_page < Math.ceil(pagination.total / pagination.per_page)) {
                dispatch(fetchBusinessItems({
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

    // 在其他 state 定義之後添加這些處理函數
    const handleOpenAdd = () => {
        // 重置表單數據，並自動帶入當前用戶的分館資訊
        setBusinessItemData({
            number: '',
            name: '',
            price: 0,
            deposit: 0,
            branch_id: user.branch_id, // 直接設置當前用戶的分館ID
            branch_name: user.branch,  // 直接設置當前用戶的分館名稱
            remarks: '',
            status: 1
        });
        setOpenAdd(true);
    };

    // 在表格渲染部分添加日誌
    console.log('Business items from state:', businessItems);

    // 修改渲染逻辑，添加加载状态检查
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // 确保用户已登录
    if (!user) {
        return null; // 或显示一个加载中的状态
    }

    // 在 getCurrentPageData 函數後添加
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

            const response = await dispatch(importBusinessItems(file));
            if (response.success) {
                alert(response.message);
                if (response.warnings) {
                    alert(response.warnings);
                }
                // 重新獲取列表
                dispatch(fetchBusinessItems({
                    page: currentPage,
                    per_page: itemsPerPage,
                    keyword: searchKeyword
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

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            {hasPermission('業務項目匯入') && (
            <Card>
                <CardHeader variant="gradient" color="white" className="mb-8 p-6">
                    <Typography variant="h6" color="black" className="mb-4">
                        匯入/ 匯出業務項目
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
                                匯入業務項目
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
                            匯出業務項目
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
                    <Typography variant="h6" color="green" className="flex items-center gap-2">
                        業務項目列表
                    </Typography>
                     {hasPermission('新增業務項目') && (
                    <Button
                        variant="gradient"
                        color="green"
                        className="flex items-center gap-2"
                        onClick={handleOpenAdd}
                    >
                        新增業務項目
                        </Button>
                    )}
                </CardHeader>
                <CardBody>
                    <div className="flex justify-between items-center p-4">
                        <div className="w-72 flex items-center gap-2">
                            <Input
                                label="搜尋"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                                icon={<MagnifyingGlassIcon className="h-5 w-5 cursor-pointer" onClick={handleSearch} />}
                            />
                        </div>
                        <div className="w-40">
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
                                        {["業務編號", "業務名稱", "金額", "押金", "分館", "狀態", "備註", "建立時間", "操作"].map((el) => (
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
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4">
                                            <Spinner className="h-8 w-8 mx-auto" />
                                            </td>
                                        </tr>
                                        
                                    ) : businessItems.length > 0 ? (
                                        console.log('Rendering business items:', businessItems) ||
                                        businessItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {item.number}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {item.name}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        ${item.price.toLocaleString()}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        ${item.deposit.toLocaleString()}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {item.branch_name}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Chip
                                                        variant="gradient"
                                                        color={item.status ? "green" : "blue-gray"}
                                                        value={item.status ? "啟用" : "停用"}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {item.remarks}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {item.created_at}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <div className="flex gap-2">
                                                        {hasPermission('查看業務項目') && (
                                                        <IconButton
                                                            variant="text"
                                                            color="blue"
                                                            onClick={() => handleView(item.id)}
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </IconButton>
                                                        )}
                                                     
                                                            {hasPermission('編輯業務項目') && (
                                                            <IconButton
                                                                variant="text"
                                                                color="green"
                                                                onClick={() => handleEdit(item.id)}
                                                            >
                                                                <PencilSquareIcon className="h-4 w-4" />
                                                            </IconButton>
                                                            )}
                                                         {hasPermission('刪除業務項目') && (
                                                            <IconButton
                                                                variant="text"
                                                                color="red"
                                                                onClick={() => handleDeleteBusinessItem(item.id)}
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
                            <div className="flex justify-center p-2">
                                <Pagination />
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>

            {/* 新增業務項目彈窗 */}
            <Dialog open={openAdd} handler={handleOpenAdd} size="xl">
                <DialogHeader>新增業務項目</DialogHeader>
                <DialogBody divider>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="業務編號"
                            value={businessItemData.number}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, number: e.target.value })}
                        />
                        <Input
                            label="業務名稱"
                            value={businessItemData.name}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, name: e.target.value })}
                            required
                        />
                        <Input
                            type="number"
                            label="金額"
                            value={businessItemData.price}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, price: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                            type="number"
                            label="押金"
                            value={businessItemData.deposit}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, deposit: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                            label="分館"
                            value={user.branch}
                            disabled
                        />
                        <div className="col-span-2">
                            <Textarea
                                label="備註"
                                value={businessItemData.remarks}
                                onChange={(e) => setBusinessItemData({ ...businessItemData, remarks: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                label="狀態"
                                checked={businessItemData.status === 1}
                                onChange={(e) => setBusinessItemData({ ...businessItemData, status: e.target.checked ? 1 : 0 })}
                            />
                            <span>{businessItemData.status === 1 ? '啟用' : '停用'}</span>
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

            {/* 查看/編輯業務項目彈窗 */}
            <Dialog open={detailOpen} handler={handleOpenDetail} size="xl">
                <DialogHeader className="flex justify-between items-center">
                    <Typography variant="h6">
                        {viewMode === 'view' ? '查看業務項目' : '編輯業務項目'}
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
                <DialogBody divider>
                    <div className="grid grid-cols-2 gap-4">
                    {viewMode === 'view' ? (
                           <>
                           <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                    業務編號
                                    </Typography>
                                    <Typography>{businessItemData.number}</Typography>
                            </div>
                            <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                    業務名稱
                                    </Typography>
                                    <Typography>{businessItemData.name}</Typography>
                            </div>
                            <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        金額
                                    </Typography>
                                    <Typography>${businessItemData.price?.toLocaleString()}</Typography>
                            </div>
                            <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        押金
                                    </Typography>
                                    <Typography>${businessItemData.deposit?.toLocaleString()}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        備註
                                    </Typography>
                                    <Typography>{businessItemData.remarks}</Typography>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="small" color="blue-gray" className="font-semibold">
                                        狀態
                                    </Typography>
                                    <Chip
                                        variant="gradient"
                                        color={businessItemData.status === 1 ? "green" : "blue-gray"}
                                        value={businessItemData.status === 1 ? "啟用" : "停用"}
                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                    />
                                </div>
                               
                           </>
                        ) : (
                            <>
                        <Input
                            label="業務編號"
                            value={businessItemData.number}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, number: e.target.value })}
                            
                        />
                        <Input
                            label="業務名稱"
                            value={businessItemData.name}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, name: e.target.value })}
                            
                            required
                        />
                        <Input
                            type="number"
                            label="金額"
                            value={businessItemData.price}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, price: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                            type="number"
                            label="押金"
                            value={businessItemData.deposit}
                            onChange={(e) => setBusinessItemData({ ...businessItemData, deposit: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="col-span-2">
                            <Textarea
                                label="備註"
                                value={businessItemData.remarks}
                                onChange={(e) => setBusinessItemData({ ...businessItemData, remarks: e.target.value })}
                                
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                label="狀態"
                                checked={businessItemData.status === 1}
                                onChange={(e) => setBusinessItemData({ ...businessItemData, status: e.target.checked ? 1 : 0 })}
                                
                            />
                            <span>{businessItemData.status === 1 ? '啟用' : '停用'}</span>
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

            {error && (
                <div className="text-red-500 text-center p-4">
                    {error}
                </div>
            )}
        </div>
    );
}

export default BusinessItemList;
  