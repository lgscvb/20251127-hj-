import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Cog6ToothIcon, DocumentArrowUpIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
  Footer,
  BillScan
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenSidenav, setOpenConfigurator, setOpenBillScan } from "@/context";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType, openSidenav } = controller;
  const location = useLocation();

  // 監聽路由變化，在移動端時關閉 sidebar
  useEffect(() => {
    if (window.innerWidth < 960) {
      setOpenSidenav(dispatch, false);
    }
  }, [location, dispatch]);

  // 處理點擊事件
  useEffect(() => {
    const handleClick = (e) => {
      const sidenav = document.getElementById('sidenav-main');
      const navbarToggle = document.querySelector('[data-collapse-toggle="sidenav-main"]');
      
      if (window.innerWidth < 960 && openSidenav) {
        if (sidenav && 
            !sidenav.contains(e.target) && 
            navbarToggle && 
            !navbarToggle.contains(e.target)) {
          setOpenSidenav(dispatch, false);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [openSidenav, dispatch]);

  return (
    <div className="min-h-screen bg-whitw">
      <Sidenav
        id="sidenav-main"
        routes={routes}
        brandImg={
          sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
      />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        <Configurator />
        <div className="group">
          <IconButton
            size="lg"
            color="white"
            className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10 transition-all duration-300 group-hover:w-[120px] max-w-[120px] group-hover:rounded-full flex items-center justify-center overflow-hidden"
            ripple={false}
            onClick={() => setOpenConfigurator(dispatch, true)}
          >
            <div className="flex items-center">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-green-500 group-hover:text-green-600" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[120px]  group-hover:text-green-500 group-hover:ml-2 transition-all duration-300 text-gray-700 text-sm">
                開啟聊天
              </span>
            </div>
          </IconButton>
        </div>
        <BillScan />
        <div className="group">
          <IconButton
            size="lg"
            color="white"
            className="fixed bottom-24 right-8 z-40 rounded-full shadow-blue-gray-900/10 transition-all duration-300 group-hover:w-[120px] max-w-[120px] group-hover:rounded-full flex items-center justify-center overflow-hidden"
            ripple={false}
            onClick={() => setOpenBillScan(dispatch, true)}
          >
            <div className="flex items-center">
              <DocumentArrowUpIcon className="h-5 w-5 text-green-500 group-hover:text-green-600" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[120px]  group-hover:text-green-500 group-hover:ml-2 transition-all duration-300 text-gray-700 text-sm">
                發票掃描
              </span>
            </div>
          </IconButton>
        </div>
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              layout === "dashboard" &&
              pages.map(({ path, element }) => (
                <Route exact path={path} element={element} />
              ))
          )}
        </Routes>
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;
