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

// 修改模擬數據
const MOCK_DATA = {
  dashboard: {
    monthly_revenue: 450000,
    input_invoice_amount: 120000,
    estimated_tax: 35000,
    days_until_tax_deadline: 15,
    monthly_chart: {
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      revenue: [320000, 380000, 420000, 450000, 480000, 450000, 500000, 520000, 480000, 460000, 500000, 550000],
    },
    expense_categories: [
      { name: '人事費用', value: 150000, color: '#2196F3' },
      { name: '租金支出', value: 80000, color: '#FF9800' },
      { name: '水電費用', value: 30000, color: '#4CAF50' },
      { name: '設備支出', value: 50000, color: '#F44336' },
      { name: '行銷費用', value: 40000, color: '#9C27B0' },
      { name: '其他支出', value: 20000, color: '#795548' }
    ]
  },
  user: {
    nickname: "測試用戶",
    account: "test123",
    branch: "台北分館",
    role_name: "管理員",
    phone: "0912345678",
    email: "test@example.com",
    last_login: "2024-03-20T10:00:00",
    is_top_account: true,
    branch_id: 1
  },
  branches: [
    { id: 1, name: "台北分館" },
    { id: 2, name: "新竹分館" },
    { id: 3, name: "台中分館" },
    { id: 4, name: "高雄分館" }
  ]
};

export function BillDashboard() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        monthly_revenue: 0,
        input_invoice_amount: 0,
        estimated_tax: 0,
        days_until_tax_deadline: 0,
        monthly_chart: {
            months: [],
            revenue: []
        },
        expense_categories: []
    });
    const [user, setUser] = useState(MOCK_DATA.user);
    const [branches, setBranches] = useState(MOCK_DATA.branches);
    const { hasPermission, isTopAccount } = usePermission();
    const { list: projects, loading: projectsLoading } = useSelector(state => state.projects);
    const { list: customers } = useSelector((state) => state.customers);
    const { list: lineBots } = useSelector(state => state.lineBot);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDashboardData(MOCK_DATA.dashboard);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // 模擬數據已經設置，不需要調用 API
    }, []);

    const reminderProjects = projects.filter(project => 
        isNearPayment(project.next_pay_day) || isOverdue(project.next_pay_day)
    ).sort((a, b) => new Date(a.next_pay_day) - new Date(b.next_pay_day));

    const getCurrentBranchName = () => {
        if (!user) return "未登入";
        if (user.is_top_account) return "所有分館";
        return user.branch || "未知分館";
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
                    formatter: (value) => `$${(value/10000).toFixed(0)}萬`,
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
            footerIcon: ArrowUpIcon,
            footerText: "較上月增加 12%"
        },
        {
            color: "green",
            icon: DocumentTextIcon,
            title: "當月進項發票金額",
            value: `$${dashboardData?.input_invoice_amount?.toLocaleString() || 0}`,
            footerIcon: ArrowUpIcon,
            footerText: "較上月增加 5%"
        },
        {
            color: "orange",
            icon: CurrencyDollarIcon,
            title: "預估稅額",
            value: `$${dashboardData?.estimated_tax?.toLocaleString() || 0}`,
            footerIcon: null,
            footerText: "本期待核算"
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
                            最後登入時間：{new Date(user?.last_login).toLocaleString('zh-TW')}
                        </Typography>
                    </div>
                </div>

                {!isTopAccount && user?.branch && (
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
