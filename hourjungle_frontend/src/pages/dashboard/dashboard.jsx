import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Tooltip,
  Progress,
  Button,
  Chip,
  Spinner
} from "@material-tailwind/react";
import {
  EllipsisVerticalIcon,
  ArrowUpIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  BriefcaseIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import { chartsConfig } from "@/configs";
import { CheckCircleIcon, ChatBubbleLeftEllipsisIcon, ClockIcon, BanknotesIcon, ChartBarIcon } from "@heroicons/react/24/solid";

import { 
    fetchBranches, 
    fetchDashboard, 
    fetchProjects, 
    getProjectInfo, 
    sendLineMessage,
    fetchLineBotList
} from "@/redux/actions";
import { usePermission } from '@/hooks/usePermission';
import { isNearPayment, isOverdue, formatDate, shouldShowRenewalNotice, handleSendNotification } from '@/utils/dateUtils';

// 添加表格標題常量
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
// 添加判斷合約到期的函數
const getContractStatus = (endDay, nextPayDay) => {
    if (!endDay) return '';
    
    const today = new Date();
    const contractEndDate = new Date(endDay);
    const payDate = new Date(nextPayDay);
    const diffDays = Math.ceil((contractEndDate - today) / (1000 * 60 * 60 * 24));
    
    // 合約已過期
    if (diffDays < 0) {
        return 'bg-gray-100'; // 灰色
    }
    // 合約即將到期（30天內）
    if (diffDays <= 30) {
        return 'bg-blue-50'; // 淺藍色
    }
    // 付款相關狀態
    if (payDate < today) {
        return 'bg-red-50'; // 已逾期
    }
    if (Math.ceil((payDate - today) / (1000 * 60 * 60 * 24)) <= 5) {
        return 'bg-amber-50'; // 即將到期
    }
    return '';
};

export function Dashboard() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { data: dashboardData, loading } = useSelector((state) => state.dashboard);
    const { list: projects, loading: projectsLoading } = useSelector(state => state.projects);
    const { hasPermission, isTopAccount } = usePermission();
    const { list: customers } = useSelector((state) => state.customers);
    const { list: lineBots } = useSelector(state => state.lineBot);
    const { list: branches } = useSelector((state) => state.branches);

    // 獲取 Dashboard 數據
    useEffect(() => {
        dispatch(fetchDashboard());
        dispatch(fetchProjects({
            page: 1,
            per_page: 50, // 增加每頁數量以確保獲取所有需要提醒的專案
            status: 1, // 只獲取啟用的專案
            branch_id: !isTopAccount ? user?.branch_id : undefined
        }));
        dispatch(fetchLineBotList());
        if (isTopAccount) {
            dispatch(fetchBranches()); // 如果是最高權限帳號，獲取所有分館資料
        }
    }, [dispatch, isTopAccount, user?.branch_id]);

    // 篩選需要提醒的專案（即將到期或已過期）
    const reminderProjects = projects.filter(project => 
        isNearPayment(project.next_pay_day) || isOverdue(project.next_pay_day)
    ).sort((a, b) => new Date(a.next_pay_day) - new Date(b.next_pay_day)); // 按到期日期排序

    // 獲取當前分館名稱
    const getCurrentBranchName = () => {
        if (!user) return "未登入";
        if (user.is_top_account) return "所有分館";
        return user.branch || "未知分館";
    };

    // 使用 API 返回的圖表數據
    const completedTasksChart = {
        height: 220,
        series: [
            {
                type: "line",
                name: "應收款項",
                data: dashboardData?.charts?.receivable || []
            },
            {
                type: "line",
                name: "實收款項",
                data: dashboardData?.charts?.receipt || []
            },
            {
                type: "bar",
                name: "未收款項",
                data: dashboardData?.charts?.unpaid || [],
            }
        ],
        options: {
            ...chartsConfig,
            colors: ["#388e3c", "#1e88e5", "#d32f2f"],
            stroke: {
                lineCap: "round",
                width: [3, 3, 0] // 設置線條寬度，柱狀圖設為0
            },
            markers: {
                size: 5
            },
            plotOptions: {
                bar: {
                    columnWidth: '30%', // 設置柱子寬度
                    borderRadius: 2,    // 設置柱子圓角
                    opacity: 0.8       // 設置透明度
                }
            },
            xaxis: {
                ...chartsConfig.xaxis,
                categories: dashboardData?.charts?.month || []
            }
        }
    };

    // 修改統計圖表數據
    const statisticsChartsData = [
        {
            color: "white",
            title: getCurrentBranchName(),
            description: "每月營業額",
            footer: "每月更新",
            chart: completedTasksChart
        }
    ];

    // 使用 API 返回的統計卡片數據
    const statisticsCardsData = [
        {
            color: "gray",
            icon: BanknotesIcon,
            title: "本月應收金額",
            value: `$${dashboardData?.this_month_receivable?.toLocaleString() || 0}`,
            footer: {
                color: "text-green-500",
                value: "+55%",
                label: "than last month"
            }
        },
        {
            color: "orange",
            icon: ChartBarIcon,
            title: "本月實收金額",
            value: `$${dashboardData?.this_month_receipt?.toLocaleString() || 0}`,
            footer: {
                color: "text-green-500",
                value: "+3%",
                label: "than last month"
            }
        },
        {
            color: "brown",
            icon: BanknotesIcon,
            title: "本月未收金額",
            value: `$${dashboardData?.this_month_unpaid?.toLocaleString() || 0}`,
            footer: {
                color: "text-red-500",
                value: "-2%",
                label: "than last month"
            }
        },
        {
            color: "teal",
            icon: ChartBarIcon,
            title: "年度應收金額",
            value: `$${dashboardData?.this_year_receivable?.toLocaleString() || 0}`,
            footer: {
                color: "text-green-500",
                value: "+5%",
                label: "than last year"
            }
        },
        {
            color: "blue",
            icon: ChartBarIcon,
            title: "年度實收金額",
            value: `$${dashboardData?.this_year_receipt?.toLocaleString() || 0}`,
            footer: {
                color: "text-green-500",
                value: "+5%",
                label: "than last year"
            }
        },
        {
            color: "red",
            icon: ChartBarIcon,
            title: "年度未收金額",
            value: `$${dashboardData?.this_year_unpaid?.toLocaleString() || 0}`,
            footer: {
                color: "text-red-500",
                value: "+5%",
                label: "than last year"
            }
        }
    ];

    // 顯示載入中狀態
    if (loading) {
        return (
            <div className="mt-12 flex justify-center">
                <Spinner className="h-12 w-12" color="green" />
            </div>
        );
    }

    return (
        <div className="mt-12">
            {/* 分館資訊顯示區域 */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Typography variant="h3" color="blue-gray" className="mb-2">
                            {getCurrentBranchName()}
                        </Typography>
                        <Typography variant="lead" color="gray" className="font-normal">
                            歡迎回來，{user?.nickname}
                        </Typography>
                    </div>
                    <div className="hidden md:block">
                        <Typography variant="small" className="text-blue-gray-600">
                            最後登入時間：{new Date(user?.last_login).toLocaleString('zh-TW')}
                        </Typography>
                    </div>
                </div>

                {!isTopAccount && user?.branch && (
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
                        {/* 個人資訊卡片 */}
                        <Card className="bg-white shadow-lg">
                            <CardHeader 
                                variant="gradient" 
                                color="green" 
                                className="p-4 flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <UserCircleIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <Typography variant="h6" color="white">
                                        個人資訊
                                    </Typography>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-gray-50/50">
                                        <BuildingOfficeIcon className="w-5 h-5 text-blue-gray-500" />
                                        <div>
                                            <Typography variant="small" color="blue-gray" className="font-medium">
                                                分館
                                            </Typography>
                                            <Typography variant="h6" color="blue-gray">
                                                {user.branch}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-gray-50/50">
                                        <UserIcon className="w-5 h-5 text-blue-gray-500" />
                                        <div>
                                            <Typography variant="small" color="blue-gray" className="font-medium">
                                                帳號資訊
                                            </Typography>
                                            <Typography color="blue-gray">
                                                {user.account} ({user.nickname})
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-gray-50/50">
                                        <BriefcaseIcon className="w-5 h-5 text-blue-gray-500" />
                                        <div>
                                            <Typography variant="small" color="blue-gray" className="font-medium">
                                                職位
                                            </Typography>
                                            <Typography color="blue-gray">
                                                {user.role_name}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-gray-50/50">
                                            <PhoneIcon className="w-5 h-5 text-blue-gray-500" />
                                            <div>
                                                <Typography variant="small" color="blue-gray" className="font-medium">
                                                    電話
                                                </Typography>
                                                <Typography color="blue-gray">
                                                    {user.phone}
                                                </Typography>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-gray-50/50">
                                            <EnvelopeIcon className="w-5 h-5 text-blue-gray-500" />
                                            <div>
                                                <Typography variant="small" color="blue-gray" className="font-medium">
                                                    Email
                                                </Typography>
                                                <Typography color="blue-gray">
                                                    {user.email}
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 可以在這裡添加更多卡片，例如業績統計、待辦事項等 */}
                    </div>
                )}
            </div>

            {/* 如果是最高權限帳號，顯示所有分館的統計資料 */}
           

            {/* 營業額圖表區域 */}
            <div className="mb-12">
                <Card>
                    <CardHeader variant="gradient" color="green" className="p-6">
                        <Typography variant="h6" color="white">
                            營業額曲線表
                        </Typography>
                    </CardHeader>
                    <CardBody className="p-6">
                        {statisticsChartsData.map((props) => (
                            <StatisticsChart
                                key={props.title}
                                {...props}
                                footer={
                                    <Typography
                                        variant="small"
                                        className="flex items-center font-normal text-blue-gray-600"
                                    >
                                        <ClockIcon strokeWidth={2} className="h-4 w-4 text-blue-gray-400" />
                                        &nbsp;{props.footer}
                                    </Typography>
                                }
                            />
                        ))}
                    </CardBody>
                </Card>
            </div>
            {isTopAccount && branches.length > 0 && (
                <div className="mb-8 hidden">
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-5 gap-10">
                        {branches.map((branch) => (
                            <Card key={branch.id} className="bg-white shadow-lg">
                                <CardHeader variant="gradient" color="green" className="p-4">
                                    <Typography variant="h6" color="white">
                                        {branch.name}
                                    </Typography>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Typography variant="small" color="blue-gray">本月應收金額：</Typography>
                                            <Typography variant="h6" color="blue-gray">
                                                ${dashboardData?.branch_data?.[branch.id]?.this_month_receivable?.toLocaleString() || 0}
                                            </Typography>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Typography variant="small" color="blue-gray">本月實收金額：</Typography>
                                            <Typography variant="h6" color="blue-gray">
                                                ${dashboardData?.branch_data?.[branch.id]?.this_month_receipt?.toLocaleString() || 0}
                                            </Typography>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Typography variant="small" color="blue-gray">年度應收金額：</Typography>
                                            <Typography variant="h6" color="blue-gray">
                                                ${dashboardData?.branch_data?.[branch.id]?.this_year_receivable?.toLocaleString() || 0}
                                            </Typography>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Typography variant="small" color="blue-gray">年度實收金額：</Typography>
                                            <Typography variant="h6" color="blue-gray">
                                                ${dashboardData?.branch_data?.[branch.id]?.this_year_receipt?.toLocaleString() || 0}
                                            </Typography>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {/* 統計卡片區域 */}
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {statisticsCardsData.map(({ icon, title, footer, ...rest }) => (
                    <StatisticsCard
                        key={title}
                        {...rest}
                        title={title}
                        icon={React.createElement(icon, {
                            className: "w-6 h-6 text-white",
                        })}
                       
                    />
                ))}
            </div>

            {/* 修改專案列表表格的標題和內容 */}
            <div className="mt-12">
                <Card>
                    <CardHeader variant="gradient" color="green" className="mb-8 p-6">
                        <Typography variant="h6" color="white">
                            待處理提醒事項
                        </Typography>
                    </CardHeader>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
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
                                                className="text-[11px] font-bold uppercase text-blue-gray-400 ell"
                                            >
                                                {header}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {projectsLoading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
                                            <Spinner color="green" className="h-8 w-8 mx-auto" />
                                        </td>
                                    </tr>
                                ) : reminderProjects.length > 0 ? (
                                    reminderProjects.map((project) => (
                                        <tr 
                                            key={project.id}
                                            className={`${getContractStatus(project.end_day, project.next_pay_day)} 
                                            hover:bg-blue-gray-50/50 transition-colors`}
                                        >
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                        {project.projectName}
                                                    </Typography>
                                                    <Chip
                                                        variant="gradient"
                                                        color={isOverdue(project.next_pay_day) ? "red" : "amber"}
                                                        value={isOverdue(project.next_pay_day) ? "已逾期" : "即將到期"}
                                                        className="py-0.5 px-2 text-[11px] font-medium"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {project.customerName}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                {PAYMENT_PLANS.find(t => t.value === project.payment_period)?.label}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                {CONTRACT_TYPES.find(t => t.value === project.contractType)?.label}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {project.contractType}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {formatDate(project.start_day)}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {formatDate(project.next_pay_day)}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Typography className="text-xs font-semibold text-blue-gray-600 ell">
                                                    {formatDate(project.end_day)}
                                                </Typography>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Chip
                                                    variant="gradient"
                                                    color={project.contract_status === 1 ? "green" : "red"}
                                                    value={project.contract_status === 1 ? "啟用" : "停用"}
                                                    className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                />
                                            </td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    <Tooltip content="發送付款通知">
                                                        <IconButton
                                                            variant="text"
                                                            color={isOverdue(project.next_pay_day) ? "red" : "amber"}
                                                            onClick={() => handleSendNotification(project, 'payment', {
                                                                dispatch,
                                                                lineBots,
                                                                customers,
                                                                sendLineMessage
                                                            })}
                                                        >
                                                            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {/* 續約通知按鈕 - 只在合約即將到期或已過期時顯示 */}
                                                    {shouldShowRenewalNotice(project.end_day) && (
                                                        <Tooltip content="發送續約通知">
                                                            <IconButton
                                                                variant="text"
                                                                color="blue"
                                                                onClick={() => handleSendNotification(project, 'renewal', {
                                                                    dispatch,
                                                                    lineBots,
                                                                    customers,
                                                                    sendLineMessage
                                                                })}
                                                            >
                                                                <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
                                            <Typography>目前沒有需要提醒的專案</Typography>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {/* 添加提示說明 */}
                        <div className="p-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-red-50"></div>
                                <span>付款已逾期</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-amber-50"></div>
                                <span>付款即將到期（5天內）</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-blue-50"></div>
                                <span>合約即將到期（30天內）</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-100"></div>
                                <span>合約已過期</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;
