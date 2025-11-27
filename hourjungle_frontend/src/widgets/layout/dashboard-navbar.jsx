import { useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Navbar,
  Typography,
  Button,
  IconButton,
  Breadcrumbs,
  Input,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Badge,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  ClockIcon,
  CreditCardIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
  setOpenSidenav,
} from "@/context";
import { logout, fetchProjects } from "../../redux/actions";
import { routes } from "@/routes";
import { PermissionGuard } from '@/components/PermissionGuard';
import { isOverdue, isNearPayment, shouldShowRenewalNotice, formatDate } from '@/utils/dateUtils';
import React, { useEffect } from "react";

export function DashboardNavbar() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const { pathname } = useLocation();
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
  
  // 從 Redux store 獲取用戶信息
  const reduxDispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.permissions);
  
  // 添加 console.log 来查看 user 对象
  console.log('Current user state:', user, token);

  // 添加获取当前路由信息的逻辑
  const getCurrentRoute = () => {
    const currentPath = `/${page}`;
    const currentLayout = routes.find(route => route.layout === layout);
    if (!currentLayout) return '首頁';
    const currentPage = currentLayout.pages.find(p => p.path === currentPath);
    return currentPage ? currentPage.name : '首頁';
  };

  const pageName = getCurrentRoute();

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    reduxDispatch(logout());
    navigate('/auth/sign-in');
  };

  // 檢查是否有特定權限的函數
  const hasPermission = (permissionName) => {
    return permissions.some(p => p.name === permissionName);
  };

  // 添加背景樣式
  const navbarStyle = {
    backgroundImage: user?.branch_id ? `url(../img/branch/${user.branch_id}.jpg)` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat',
    position: 'fixed',
    width: '100%',
    height: '100%',
    filter: 'blur(1px)',
    opacity: 0.2,
  };

  const { list: projects } = useSelector(state => state.projects);

  // 添加 useEffect 來獲取 projects 數據
  useEffect(() => {
    if (user) {
      reduxDispatch(fetchProjects({
        page: 1,
        per_page: 50, // 增加每頁數量以確保獲取所有需要提醒的專案
        status: 1, // 只獲取啟用的專案
        branch_id: user.is_top_account ? undefined : user?.branch_id
      }));
    }
  }, [reduxDispatch, user]);

  // 添加一個狀態來控制菜單的開關
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
  <div className="absolute inset-0 w-full h-full object-cover" style={navbarStyle} />
    <Navbar
      color={fixedNavbar ? "white" : "transparent"}
      className={`rounded-xl transition-all ${
        fixedNavbar
          ? "sticky top-4 z-40 py-3 shadow-md shadow-blue-gray-500/5"
          : "px-0 py-1"
      }`}
      
      fullWidth
      blurred={fixedNavbar}
    >
      {/* 添加半透明遮罩層 */}
    

      {/* 將原有內容包裝在一個相對定位的容器中，確保它在遮罩層上方 */}
      <div className="relative z-10">
        <div className="flex flex-col-reverse justify-between gap-6 md:flex-row md:items-center">
          <div className="capitalize">
            
            <Breadcrumbs
              className={`bg-transparent p-0 transition-all ${
                fixedNavbar ? "mt-1" : ""
              }`}
            >
              <Link to={`/${layout}`}>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal opacity-50 transition-all hover:text-gray-500 hover:opacity-100"
                >
                  {layout === 'dashboard' ? '首頁' : 
                   routes.find(route => route.layout === layout)?.title || layout}
                </Typography>
              </Link>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {pageName}
              </Typography>
            </Breadcrumbs>
            <Typography className="hidden" variant="h6" color="blue-gray">
              {pageName}
            </Typography>
          </div>
          <div className="flex items-center">
            
            <div className="mr-auto md:mr-4 md:w-56 hidden">
              <Input label="Search" />
            </div>
            <IconButton
              variant="text"
              color="blue-gray"
              className="grid xl:hidden"
              onClick={() => setOpenSidenav(dispatch, !openSidenav)}
            >
              <Bars3Icon strokeWidth={3} className="h-6 w-6 text-blue-gray-500" />
            </IconButton>

            {/* 根據登入狀態顯示不同內容 */}
            {user ? (
              // 已登入狀態
              <div className="flex items-center gap-2">
                <Menu>
                  <MenuHandler>
                    <Button
                      variant="text"
                      color="blue-gray"
                      className="flex items-center gap-1 px-4 normal-case"
                    >
                      <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
                      <span>{user.nickname || user.account}</span>
                    </Button>
                  </MenuHandler>
                  <MenuList>
                    <MenuItem className="flex items-center gap-2 hidden">
                      <UserCircleIcon className="h-4 w-4" />
                      個人資料
                    </MenuItem>
                    <MenuItem 
                      className="flex items-center gap-2 text-red-500"
                      onClick={handleLogout}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      登出
                    </MenuItem>
                  </MenuList>
                </Menu>
              </div>
            ) : (
              // 未登入狀態
              <Link to="/auth/sign-in">
                <Button
                  variant="text"
                  color="blue-gray"
                  className="hidden items-center gap-1 px-4 xl:flex normal-case"
                >
                  <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
                  Sign In
                </Button>
                <IconButton
                  variant="text"
                  color="blue-gray"
                  className="grid xl:hidden"
                >
                  <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
                </IconButton>
              </Link>
            )}

            <Menu open={isMenuOpen} handler={setIsMenuOpen}>
              <MenuHandler>
                <Badge 
                  content={
                    (projects?.filter(p => isOverdue(p.next_pay_day))?.length || 0) +
                    (projects?.filter(p => isNearPayment(p.next_pay_day) && !isOverdue(p.next_pay_day))?.length || 0) +
                    (projects?.filter(p => isOverdue(p.end_day))?.length || 0) +
                    (projects?.filter(p => shouldShowRenewalNotice(p.end_day) && !isOverdue(p.end_day))?.length || 0)
                  }
                  color="red"
                >
                  <IconButton 
                    variant="text" 
                    color="blue-gray"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <BellIcon className="h-5 w-5 text-blue-gray-500" />
                  </IconButton>
                </Badge>
              </MenuHandler>
              <MenuList className="w-max border-0">
                {/* 如果沒有提醒項目，顯示一個提示 */}
                {(!projects || projects.length === 0) && (
                  <MenuItem>
                    <Typography variant="small" className="font-normal">
                      目前沒有需要提醒的項目
                    </Typography>
                  </MenuItem>
                )}
                
                {/* 繳費逾期 */}
                {projects?.filter(p => isOverdue(p.next_pay_day)).map(project => (
                  <MenuItem key={`overdue-${project.id}`} className="flex items-center gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-red-100">
                      <BanknotesIcon className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-normal"
                      >
                        <strong className="text-red-500">繳費逾期</strong> - {project.customerName}
                      </Typography>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="flex items-center gap-1 text-xs font-normal opacity-60"
                      >
                        <ClockIcon className="h-3.5 w-3.5" /> 應繳日期: {formatDate(project.next_pay_day)}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}

                {/* 繳費即將逾期 */}
                {projects?.filter(p => isNearPayment(p.next_pay_day) && !isOverdue(p.next_pay_day)).map(project => (
                  <MenuItem key={`near-payment-${project.id}`} className="flex items-center gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100">
                      <BanknotesIcon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-normal"
                      >
                        <strong className="text-amber-500">繳費即將到期</strong> - {project.customerName}
                      </Typography>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="flex items-center gap-1 text-xs font-normal opacity-60"
                      >
                        <ClockIcon className="h-3.5 w-3.5" /> 應繳日期: {formatDate(project.next_pay_day)}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}

                {/* 合約到期 */}
                {projects?.filter(p => isOverdue(p.end_day)).map(project => (
                  <MenuItem key={`contract-expired-${project.id}`} className="flex items-center gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gray-100">
                      <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-normal"
                      >
                        <strong className="text-gray-500">合約已到期</strong> - {project.customerName}
                      </Typography>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="flex items-center gap-1 text-xs font-normal opacity-60"
                      >
                        <ClockIcon className="h-3.5 w-3.5" /> 到期日期: {formatDate(project.end_day)}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}

                {/* 合約即將到期 */}
                {projects?.filter(p => shouldShowRenewalNotice(p.end_day) && !isOverdue(p.end_day)).map(project => (
                  <MenuItem key={`contract-near-${project.id}`} className="flex items-center gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100">
                      <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-normal"
                      >
                        <strong className="text-blue-500">合約即將到期</strong> - {project.customerName}
                      </Typography>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="flex items-center gap-1 text-xs font-normal opacity-60"
                      >
                        <ClockIcon className="h-3.5 w-3.5" /> 到期日期: {formatDate(project.end_day)}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={() => setOpenConfigurator(dispatch, true)}
              className="hidden"
            >
              <Cog6ToothIcon className="h-5 w-5 text-blue-gray-500" />
            </IconButton>
             <div className="flex items-center gap-4 md:hidden absolute right-10">
              <img src="/img/logo-ct-dark.png" alt="logo" className="h-8" />
            </div>
          </div>
          {/* 在移动版显示 logo */}
           
        </div>
        {/* 打印權限列表（用於調試） */}
        <div style={{ display: 'none' }}>
          <pre>
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>
      </div>
    </Navbar>
    </>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
