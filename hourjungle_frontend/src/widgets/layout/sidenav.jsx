import PropTypes from "prop-types";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { useSelector } from 'react-redux';

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const checkPermission = (page) => {
    if (page.requireTopAccount && !user?.is_top_account) {
      navigate('/dashboard/dashboard');
      return false;
    }
    if (page.requiredRole && user?.role_id > page.requiredRole) {
      navigate('/dashboard/dashboard');
      return false;
    }
    return true;
  };

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100`}
    >
      <div className="relative">
        <Link to="/" className="py-6 px-8 text-center">
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
            <img className="w-3/4 mx-auto" src={brandImg} alt="logo" />
          </Typography>
        </Link>
        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          ripple={false}
          className="absolute right-1 top-1 grid rounded-br-none rounded-tl-none xl:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-6 w-6 text-blue-gray" />
        </IconButton>
      </div>
      <div className="m-4">
        {routes
          .filter(route => !route.hidden)
          .map(({ layout, title, pages }, key) => {
            const filteredPages = pages.filter(page => {
              if (page.requireTopAccount && !user?.is_top_account) {
                return false;
              }
              return !(typeof page.hidden === 'function' ? page.hidden(user) : page.hidden);
            });

            if (filteredPages.length === 0) return null;

            return (
              <ul key={key} className="mb-4 flex flex-col gap-1">
                {title && (
                  <li className="mx-3.5 mt-4 mb-2">
                    <Typography
                      variant="small"
                      color={sidenavType === "dark" ? "white" : "blue-gray"}
                      className="font-black uppercase opacity-75"
                    >
                      {title}
                    </Typography>
                  </li>
                )}
                {filteredPages.map((page) => (
                  <li key={page.name}>
                    <NavLink 
                      to={`/${layout}${page.path}`}
                      onClick={(e) => {
                        if (!checkPermission(page)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {({ isActive }) => (
                        <Button
                          variant={isActive ? "gradient" : "text"}
                          color={
                            isActive
                              ? sidenavColor
                              : sidenavType === "dark"
                              ? "white"
                              : "blue-gray"
                          }
                          className="flex items-center gap-4 px-4 capitalize"
                          fullWidth
                        >
                          {page.icon}
                          <Typography
                            color="inherit"
                            className="font-medium capitalize"
                          >
                            {page.name}
                          </Typography>
                        </Button>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            );
          })}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "../img/logo-ct-dark.png",
  brandName: "HOUR JUNGLE",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidnave.jsx";

export default Sidenav;
