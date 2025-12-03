import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Chip,
    IconButton,
    Button,
    Spinner,
    Input,
    Select,
    Option,
} from "@material-tailwind/react";
import {
    EyeIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, getProjectInfo } from "@/redux/actions";
import { usePermission } from '@/hooks/usePermission';
import { formatDate } from '@/utils/dateUtils';

// 付款方案選項
const PAYMENT_PLANS = [
    { value: 1, label: "月繳", months: 1 },
    { value: 2, label: "季繳(3個月)", months: 3 },
    { value: 3, label: "半年繳(6個月)", months: 6 },
    { value: 4, label: "年繳(12個月)", months: 12 }
];

// 合約類型選項
const CONTRACT_TYPES = [
    { value: "1", label: "1年約" },
    { value: "2", label: "2年約" }
];

const TABLE_HEADERS = [
    "專案名稱",
    "客戶名稱",
    "商務項目",
    "付款方案",
    "合約類型",
    "起租時間",
    "合約到期日",
    "結束原因",
    "操作"
];

export function ArchivedProjects() {
    const dispatch = useDispatch();
    const { list: projects, loading, pagination } = useSelector(state => state.projects);
    const { hasPermission, isTopAccount } = usePermission();
    const user = useSelector(state => state.auth.user);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 篩選已結束的合約（合約到期日 < 今天）
    const archivedProjects = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return projects.filter(project => {
            if (!project.end_day) return false;
            const endDate = new Date(project.end_day.split('T')[0]);
            return endDate < today;
        }).filter(project => {
            if (!searchKeyword) return true;
            const keyword = searchKeyword.toLowerCase();
            return (
                project.projectName?.toLowerCase().includes(keyword) ||
                project.customerName?.toLowerCase().includes(keyword) ||
                project.businessItemName?.toLowerCase().includes(keyword)
            );
        });
    }, [projects, searchKeyword]);

    // 分頁數據
    const paginatedProjects = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return archivedProjects.slice(start, start + itemsPerPage);
    }, [archivedProjects, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(archivedProjects.length / itemsPerPage);

    // 初始化數據
    useEffect(() => {
        dispatch(fetchProjects({
            page: 1,
            per_page: 9999, // 獲取所有專案以便前端篩選
            branch_id: !isTopAccount ? user?.branch_id : undefined
        }));
    }, [dispatch, isTopAccount, user?.branch_id]);

    // 處理頁碼變更
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // 判斷結束原因
    const getEndReason = (project) => {
        if (project.contract_status === 3) {
            return { text: "已終止", color: "red" };
        }
        return { text: "合約到期", color: "gray" };
    };

    // 處理查看按鈕
    const handleView = async (projectId) => {
        try {
            const result = await dispatch(getProjectInfo(projectId));
            if (result.success) {
                // 可以開啟詳情彈窗或導航到詳情頁
                alert(`專案名稱: ${result.data.projectName}\n客戶: ${result.data.customerName}\n合約到期日: ${formatDate(result.data.end_day)}`);
            } else {
                alert(result.message || '獲取專案資訊失敗');
            }
        } catch (error) {
            console.error('獲取專案資訊失敗:', error);
            alert('獲取專案資訊失敗');
        }
    };

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-2 p-6 flex justify-between items-center">
                    <Typography variant="h6" color="white">
                        已結束合約
                    </Typography>
                    <Typography variant="small" color="white">
                        共 {archivedProjects.length} 筆
                    </Typography>
                </CardHeader>
                <CardBody className="px-0 pt-0 pb-2">
                    {/* 搜尋區域 */}
                    <div className="flex flex-wrap items-center p-4 gap-3">
                        <div className="w-72">
                            <Input
                                type="text"
                                label="關鍵字搜尋"
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchKeyword}
                                onChange={(e) => {
                                    setSearchKeyword(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
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
                                            className="border-b border-blue-gray-50 py-3 px-5 text-left"
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
                                        <td colSpan={TABLE_HEADERS.length} className="text-center py-4">
                                            <Spinner className="h-8 w-8 mx-auto" color="gray" />
                                        </td>
                                    </tr>
                                ) : paginatedProjects.length > 0 ? (
                                    paginatedProjects.map((project) => {
                                        const endReason = getEndReason(project);
                                        return (
                                            <tr
                                                key={project.id}
                                                className="bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {project.projectName}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {project.customerName}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {project.businessItemName || '-'}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {PAYMENT_PLANS.find(t => t.value === project.payment_period)?.label || '-'}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {CONTRACT_TYPES.find(t => t.value === String(project.contractType))?.label || '-'}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {formatDate(project.start_day)}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Typography variant="small" className="text-xs font-semibold text-blue-gray-600">
                                                        {formatDate(project.end_day)}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <Chip
                                                        variant="gradient"
                                                        color={endReason.color}
                                                        value={endReason.text}
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={TABLE_HEADERS.length} className="text-center py-4">
                                            <Typography>尚無已結束的合約</Typography>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 分頁區域 */}
                    {totalPages > 1 && (
                        <div className="flex justify-center p-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="text"
                                    className="flex items-center gap-2"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> 上一頁
                                </Button>
                                <Typography color="gray" className="font-normal text-sm">
                                    第 {currentPage} / {totalPages} 頁
                                </Typography>
                                <Button
                                    variant="text"
                                    className="flex items-center gap-2"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                >
                                    下一頁 <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

export default ArchivedProjects;
