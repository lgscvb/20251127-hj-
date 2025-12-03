import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  Cog8ToothIcon,
  KeyIcon,
  BookmarkSquareIcon,
  UsersIcon,
  PresentationChartLineIcon,
  DocumentCheckIcon,
  StarIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications, Dashboard, CustomerList, BusinessItemList, ProjectList, ArchivedProjects } from "@/pages/dashboard";
import {  BillDashboard , BillList } from "@/pages/Bill";
import { SignIn, SignUp, Test } from "@/pages/auth";
import { MemberList, MemberGroup, SystemSetting, PermissionList, BranchList, SystemLog } from "@/pages/systemManagement";
import { PermissionWrapper } from "@/components/PermissionWrapper";
import { Contract } from "@/pages/contract";
import { Navigate } from 'react-router-dom';
import { useSelector } from "react-redux";
// 或者使用相对路径
// import { MemberList, MemberGroup, SystemSetting } from "../pages/systemManagement";
const icon = {
  className: "w-5 h-5 text-inherit",
};

const ProtectedRoute = ({ children, requireTopAccount }) => {
    const token = localStorage.getItem('token');
    const { user } = useSelector(state => state.auth);

    console.log('ProtectedRoute check:', { token, user, requireTopAccount });

    if (!token) {
        console.log('No token, redirecting to login');
        return <Navigate to="/auth/sign-in" replace />;
    }

    if (requireTopAccount && !user?.is_top_account) {
        console.log('Not top account, redirecting to dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <PresentationChartLineIcon {...icon} />,
        name: "儀錶板",
        path: "/dashboard",
        element: <Dashboard />,
        requiredRole: null,
      },
      {
        icon: <UsersIcon {...icon} />,
        name: "客戶列表",
        path: "/customerList",
        element: <CustomerList />,
        requiredRole: 3,
      },
       {
        icon: <DocumentCheckIcon {...icon} />,
        name: "業務項目列表",
        path: "/business-items",
        element: (
          <ProtectedRoute>
            <BusinessItemList />
          </ProtectedRoute>
        ),
        requiredRole: 3,
      },
      {
        icon: <StarIcon {...icon} />,
        name: "專案列表",
        path: "/projectList",
        element: <ProjectList />,
        requiredRole: 3,
      },
      {
        icon: <ArchiveBoxIcon {...icon} />,
        name: "已結束合約",
        path: "/archivedProjects",
        element: <ArchivedProjects />,
        requiredRole: 3,
      },
    ],
  },
  {
    title: "會計管理",
    layout: "bill",
    pages: [
      {
        icon: <DocumentCheckIcon {...icon} />,
        name: "會計儀錶板",
        path: "/billDashboard",
        element: (
          <ProtectedRoute>
            <BillDashboard />
          </ProtectedRoute>
        ),
        requiredRole: 3,
      },
      {
        icon: <DocumentCheckIcon {...icon} />,
        name: "發票列表",
        path: "/billList",
        element: (
          <ProtectedRoute>
            <BillList />
          </ProtectedRoute>
        ),
        requiredRole: 3,
      },
    ],
  },
  {
    title: "系統管理",
    layout: "systemManagement",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "館別列表",
        path: "/branchList",
        element: (
          <ProtectedRoute requireTopAccount={true}>
            <BranchList />
          </ProtectedRoute>
        ),
        requireTopAccount: true,
        hidden: user => !user?.is_top_account
      },
      {
        icon: <ServerStackIcon {...icon} />,
        name: "管理員列表",
        path: "/memberList",
        element: <MemberList />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "管理員群組",
        path: "/memberGroup",
        element: (
          <ProtectedRoute requireTopAccount={true}>
            <MemberGroup />
          </ProtectedRoute>
        ),
        requireTopAccount: true,
        hidden: user => !user?.is_top_account
      },
      {
        icon: <KeyIcon {...icon} />,
        name: "權限管理",
        path: "/permissionList",
        element: (
          <ProtectedRoute requireTopAccount={true}>
            <PermissionList />
          </ProtectedRoute>
        ),
        requireTopAccount: true,
        hidden: user => !user?.is_top_account
      },
      {
        icon: <Cog8ToothIcon {...icon} />,
        name: "系統設定",
        path: "/systemSetting",
        element: <SystemSetting />,
      },
      {
        icon: <BookmarkSquareIcon {...icon} />,
        name: "系統日誌",
        path: "/systemLog",
        element: <SystemLog />,
      },
   /*    {
        icon: <Cog8ToothIcon {...icon} />,
        name: "測試",
        path: "/test",
        element: <Test />,
      }, */
    ],
  },
  {
    title: "登入管理",
    layout: "auth",
    hidden: true,
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "首頁",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "個人資料",
        path: "/profile",
        element: <Profile />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "資料表",
        path: "/tables",
        element: <Tables />,
      },
        {
        icon: <InformationCircleIcon {...icon} />,
        name: "notifications",
        path: "/notifications",
        element: <Notifications />,
      }, 
      {
        icon: <UserCircleIcon {...icon} />,
        name: "登入",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "註冊",
        path: "/sign-up",
        element: <SignUp />,
      },
      {
        path: "/contract/:customerId/:date/:projectId",
        element: <Contract />,
        hidden: true,
        name: "合約"
      },
      {
        path: "/contract/:customerId/:date/preview",
        element: <Contract />,
        hidden: true,
        name: "合約預覽"
      },
    ],
  },
];
// 这些路由依然存在，但不会显示在侧边栏中


export default routes;
