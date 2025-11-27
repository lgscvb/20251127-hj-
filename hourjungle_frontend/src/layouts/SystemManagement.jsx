import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";

export function SystemManagement() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType, openSidenav } = controller;
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 960) {
      setOpenSidenav(dispatch, false);
    }
  }, [location, dispatch]);

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
    <div className="min-h-screen bg-white">
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
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              layout === "systemManagement" &&
              pages.map(({ path, element }) => (
                <Route exact path={path} element={element} />
              ))
          )}
          <Route path="*" element={<Navigate to="/systemManagement/memberList" replace />} />
        </Routes>
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

SystemManagement.displayName = "/src/layouts/SystemManagement.jsx";

export default SystemManagement; 