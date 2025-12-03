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

// 初始 dashboard 狀態
const INITIAL_DASHBOARD_STATE = {
    monthly_revenue: 0,
    input_invoice_amount: 0,
    estimated_tax: 0,
    days_until_tax_deadline: 0,
    monthly_chart: {
        months: [],
        revenue: []
    },
    expense_categories: []
};

export function BillDashboard() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD_STATE);

    // 使用 Redux 中的真實用戶資料
    const { user } = useSelector(state => state.auth);
    const { list: branches } = useSelector(state => state.branches);
    const { hasPermission, isTopAccount } = usePermission();
    const { list: projects, loading: projectsLoading } = useSelector(state => state.projects);
    const { list: customers } = useSelector((state) => state.customers);
    const { list: lineBots } = useSelector(state => state.lineBot);
    const { list: bills } = useSelector(state => state.bills);

    useEffect(() => {
        // 載入必要資料
        dispatch(fetchBranches());
        dispatch(fetchProjects());
    }, [dispatch]);

    // 根據專案資料計算會計數據
    useEffect(() => {
        if (projects && projects.length > 0) {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // 計算本月營收（所有啟用專案的月租金）
            let monthlyRevenue = 0;
            projects.forEach(project => {
                if (project.contract_status === 1) {
                    monthlyRevenue += parseFloat(project.price) || 0;
                }
            });

            // 計算報稅截止日（營業稅：每單月 1, 3, 5, 7, 9, 11 月的15日）
            const oddMonths = [0, 2, 4, 6, 8, 10]; // 0-indexed: 1月=0, 3月=2, ...
            let taxDeadline;

            // 找到下一個報稅截止日
            for (let i = 0; i < oddMonths.length; i++) {
                const targetMonth = oddMonths[i];
                const targetDate = new Date(currentYear, targetMonth, 15);
                if (targetDate > now) {
                    taxDeadline = targetDate;
                    break;
                }
            }
            // 如果今年的都過了，取明年1月15日
            if (!taxDeadline) {
                taxDeadline = new Date(currentYear + 1, 0, 15);
            }
            const daysUntilTax = Math.ceil((taxDeadline - now) / (1000 * 60 * 60 * 24));

            // 計算月度營收趨勢（真實計算）
            const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

            const revenue = months.map((_, index) => {
                // 計算該月份的開始和結束日期
                const monthStart = new Date(currentYear, index, 1);
                const monthEnd = new Date(currentYear, index + 1, 0);

                // 如果是未來月份，則不計算
                if (index > currentMonth) return 0;

                let monthTotal = 0;
                projects.forEach(project => {
                    // 檢查專案是否有效且在該月份範圍內
                    // 狀態 1 為啟用
                    if (project.status === 1 && project.start_day) {
                        const projectStart = new Date(project.start_day);
                        const projectEnd = project.end_day ? new Date(project.end_day) : new Date('2099-12-31');

                        // 專案期間與月份有重疊
                        if (projectStart <= monthEnd && projectEnd >= monthStart) {
                            // 根據付款週期計算該月金額
                            // 這裡簡化處理：如果是月繳，則計入；如果是其他繳費方式，可能需要攤提
                            // 目前假設 price 為月費
                            monthTotal += parseFloat(project.price) || parseFloat(project.sale_price) || 0;
                        }
                    }
                });
                return monthTotal;
            });

            setDashboardData({
                monthly_revenue: monthlyRevenue,
                input_invoice_amount: Math.round(monthlyRevenue * 0.05), // 假設進項約5%
                estimated_tax: Math.round(monthlyRevenue * 0.05), // 假設稅額約5%
                days_until_tax_deadline: daysUntilTax > 0 ? daysUntilTax : 0,
                monthly_chart: {
                    months,
                    revenue
                },
                expense_categories: [] // 暫無支出資料
            });

            setLoading(false);
        } else if (!projectsLoading) {
            setLoading(false);
        }
    }, [projects, projectsLoading]);

    const reminderProjects = projects.filter(project =>
        isNearPayment(project.next_pay_day) || isOverdue(project.next_pay_day)
    ).sort((a, b) => new Date(a.next_pay_day) - new Date(b.next_pay_day));

    const getCurrentBranchName = () => {
        if (!user) return "未登入";
        if (isTopAccount) return "所有分館";
        // 根據 branch_id 查找分館名稱（使用 Number 確保型別一致）
        const userBranchId = Number(user.branch_id);
        const branch = branches.find(b => Number(b.id) === userBranchId);
        return branch?.name || "未知分館";
    };

    const revenueChart = {
        type: "line",
        height: 300,
        series: [
            {
                name: "月營收",
                data: dashboardData?.monthly_chart?.revenue || []
            }
        ],
        options: {
            ...chartsConfig,
            colors: ["#4CAF50"],
            chart: {
                background: '#ffffff',
                toolbar: {
                    show: false
                }
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            markers: {
                size: 5,
                colors: ["#4CAF50"],
                strokeColors: "#fff",
                strokeWidth: 2,
                hover: {
                    size: 7,
                }
            },
            xaxis: {
                categories: dashboardData?.monthly_chart?.months || [],
                labels: {
                    style: {
                        colors: '#64748b',
                        fontSize: '12px',
                        fontWeight: 500,
                    }
                },
                axisBorder: {
                    show: true,
                    color: '#e2e8f0'
                },
                axisTicks: {
                    show: true,
                    color: '#e2e8f0'
                }
            },
            yaxis: {
                labels: {
                    formatter: (value) => `$${(value / 10000).toFixed(0)}萬`,
                    style: {
                        colors: '#64748b',
                        fontSize: '12px',
                        fontWeight: 500
                    }
                }
            },
            grid: {
                show: true,
                borderColor: '#e2e8f0',
                strokeDashArray: 5,
                position: 'back'
            },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: (value) => `$${value.toLocaleString()}`
                }
            }
        }
    };

    const expensePieChart = {
        type: "pie",
        height: 300,
        series: dashboardData?.expense_categories?.map(cat => cat.value) || [],
        options: {
            chart: {
                type: 'pie',
                background: '#ffffff',
            },
            labels: dashboardData?.expense_categories?.map(cat => cat.name) || [],
            colors: dashboardData?.expense_categories?.map(cat => cat.color) || [],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                labels: {
                    colors: '#64748b'
                },
                markers: {
                    width: 12,
                    height: 12,
                    radius: 6
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '0%'
                    },
                    expandOnClick: true
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function (val, opts) {
                    return opts.w.config.labels[opts.seriesIndex] + '\n' + val.toFixed(1) + '%';
                },
                style: {
                    fontSize: '12px',
                    colors: ['#ffffff']
                }
            },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: (value) => `$${value.toLocaleString()}`
                }
            }
        }
    };

    const statisticsCardsData = [
        {
            color: "blue",
            icon: BanknotesIcon,
            title: "本月營收",
            value: `$${dashboardData?.monthly_revenue?.toLocaleString() || 0}`,
            footerIcon: null,
            footerText: "根據啟用合約計算"
        },
        {
            color: "green",
            icon: DocumentTextIcon,
            title: "當月進項發票金額",
            value: `$${dashboardData?.input_invoice_amount?.toLocaleString() || 0}`,
            footerIcon: null,
            footerText: "預估值（約營收5%）"
        },
        {
            color: "orange",
            icon: CurrencyDollarIcon,
            title: "預估稅額",
            value: `$${dashboardData?.estimated_tax?.toLocaleString() || 0}`,
            footerIcon: null,
            footerText: "預估值（約營收5%）"
        },
        {
            color: "red",
            icon: ClockIcon,
            title: "報稅截止倒數",
            value: `${dashboardData?.days_until_tax_deadline} 天`,
            footerIcon: null,
            footerText: "請注意申報期限"
        }
    ];

    if (loading) {
        return (
            <div className="mt-12 flex justify-center">
                <Spinner className="h-12 w-12" color="green" />
            </div>
        );
    }

    return (
        <div className="mt-12">
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
                            {user?.last_login && `最後登入時間：${new Date(user.last_login).toLocaleString('zh-TW')}`}
                        </Typography>
                    </div>
                </div>

                {!isTopAccount && user?.branch_id && (
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
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
                                                {getCurrentBranchName()}
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
                                                {user.role_name || '一般使用者'}
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
                                                    {user.phone || '未設定'}
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
                                                    {user.email || '未設定'}
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2">
                <Card>
                    <CardHeader variant="gradient" color="green" className="p-6">
                        <Typography variant="h6" color="white">
                            每月營收趨勢
                        </Typography>
                    </CardHeader>
                    <CardBody className="p-6">
                        <StatisticsChart
                            chart={revenueChart}
                            footer={
                                <Typography
                                    variant="small"
                                    className="flex items-center font-normal text-blue-gray-600"
                                >
                                    <ClockIcon strokeWidth={2} className="h-4 w-4 text-blue-gray-400" />
                                    &nbsp;每月更新
                                </Typography>
                            }
                        />
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader variant="gradient" color="blue" className="p-6">
                        <Typography variant="h6" color="white">
                            支出類別分析
                        </Typography>
                    </CardHeader>
                    <CardBody className="p-6">
                        {dashboardData?.expense_categories?.length > 0 ? (
                            <StatisticsChart
                                chart={expensePieChart}
                                footer={
                                    <Typography
                                        variant="small"
                                        className="flex items-center font-normal text-blue-gray-600"
                                    >
                                        <ClockIcon strokeWidth={2} className="h-4 w-4 text-blue-gray-400" />
                                        &nbsp;當月支出分布
                                    </Typography>
                                }
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-blue-gray-400">
                                <ChartBarIcon className="h-12 w-12 mb-4" />
                                <Typography variant="small">尚無支出資料</Typography>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
                {statisticsCardsData.map(({ icon, title, value, color, footerIcon, footerText }) => (
                    <StatisticsCard
                        key={title}
                        color={color}
                        value={value}
                        title={title}
                        icon={React.createElement(icon, {
                            className: "w-6 h-6 text-white",
                        })}
                        footer={
                            <Typography className="font-normal text-blue-gray-600">
                                {footerIcon && React.createElement(footerIcon, {
                                    strokeWidth: 2,
                                    className: "h-4 w-4 text-green-500"
                                })}
                                <span className="ml-1">{footerText}</span>
                            </Typography>
                        }
                    />
                ))}
            </div>
        </div>
    );
}

export default BillDashboard;
