import React from "react";
import PropTypes from "prop-types";
import { createContext, useContext, useReducer } from "react";

const MaterialTailwind = createContext();
MaterialTailwind.displayName = "MaterialTailwindContext";

const initialState = {
  openSidenav: window.innerWidth >= 960,
  sidenavColor: "green",
  sidenavType: "white",
  transparentNavbar: true,
  fixedNavbar: false,
  openConfigurator: false,
  openBillScan: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "OPEN_SIDENAV": {
      return { ...state, openSidenav: action.value };
    }
    case "SIDENAV_TYPE": {
      return { ...state, sidenavType: action.value };
    }
    case "SIDENAV_COLOR": {
      return { ...state, sidenavColor: action.value };
    }
    case "TRANSPARENT_NAVBAR": {
      return { ...state, transparentNavbar: action.value };
    }
    case "FIXED_NAVBAR": {
      return { ...state, fixedNavbar: action.value };
    }
    case "OPEN_CONFIGURATOR": {
      return { ...state, openConfigurator: action.value };
    }
    case "OPEN_BILL_SCAN": {
      return { ...state, openBillScan: action.value };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

export function MaterialTailwindControllerProvider({ children }) {
  const [controller, dispatch] = useReducer(reducer, initialState);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 960 && controller.openSidenav) {
        dispatch({ type: "OPEN_SIDENAV", value: false });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch]);

  return (
    <MaterialTailwind.Provider value={[controller, dispatch]}>
      {children}
    </MaterialTailwind.Provider>
  );
}

export function useMaterialTailwindController() {
  const context = useContext(MaterialTailwind);

  if (!context) {
    throw new Error(
      "useMaterialTailwindController should be used inside the MaterialTailwindControllerProvider."
    );
  }

  return context;
}

MaterialTailwindControllerProvider.displayName = "/src/context/index.jsx";

MaterialTailwindControllerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const setOpenSidenav = (dispatch, value) =>
  dispatch({ type: "OPEN_SIDENAV", value });
export const setSidenavType = (dispatch, value) =>
  dispatch({ type: "SIDENAV_TYPE", value });
export const setSidenavColor = (dispatch, value) =>
  dispatch({ type: "SIDENAV_COLOR", value });
export const setTransparentNavbar = (dispatch, value) =>
  dispatch({ type: "TRANSPARENT_NAVBAR", value });
export const setFixedNavbar = (dispatch, value) =>
  dispatch({ type: "FIXED_NAVBAR", value });
export const setOpenConfigurator = (dispatch, value) =>
  dispatch({ type: "OPEN_CONFIGURATOR", value });

export const setOpenBillScan = (dispatch, value) =>
  dispatch({ type: "OPEN_BILL_SCAN", value });
