const initialState = {
  auth: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    permissions: [],
    userBranch: null,
    userRole: null
  },
  members: {
    list: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0
    }
  },
  roles: {
    list: [],
    loading: false,
    error: null
  },
  permissions: {
    list: [],
    loading: false,
    error: null
  },
  branches: {
    list: [],
    loading: false,
    error: null
  },
  customers: {
    list: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0
    }
  },
  businessItems: {
    list: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0
    }
  },
  projects: {
    list: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0
    }
  },
  config: {
    data: null,
    loading: false,
    error: null
  },
  paymentHistory: {
    list: [],
    loading: false,
    error: null
  },
  lineBot: {
    list: [],
    loading: false,
    error: null
  },
  dashboard: {
    data: null,
    loading: false,
    error: null
  },
  systemLog: {
    list: [],
    loading: false,
    error: null
  },
  bills: {
    list: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0
    }
  }
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    // Auth related reducers
    case 'AUTH_LOGIN_REQUEST':
    case 'AUTH_REGISTER_REQUEST':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: true,
          error: null
        }
      };

    case 'AUTH_LOGIN_SUCCESS':
    case 'AUTH_REGISTER_SUCCESS':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          user: action.payload.user,
          token: action.payload.token,
          userBranch: action.payload.user.branch_id,
          userRole: action.payload.user.role_id,
          error: null
        }
      };

    case 'AUTH_LOGIN_FAILURE':
    case 'AUTH_REGISTER_FAILURE':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: action.payload
        }
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        auth: {
          ...state.auth,
          user: null,
          token: null,
          error: null,
          userBranch: null,
          userRole: null
        }
      };

    // Members related reducers
    case 'FETCH_MEMBERS_REQUEST':
      return {
        ...state,
        members: {
          ...state.members,
          loading: true,
          error: null
        }
      };

    case 'FETCH_MEMBERS_SUCCESS':
      return {
        ...state,
        members: {
          list: Array.isArray(action.payload.data) ? action.payload.data : [],
          loading: false,
          error: null,
          pagination: {
            current_page: action.payload.current_page,
            per_page: action.payload.per_page,
            total: action.payload.total
          }
        }
      };

    case 'FETCH_MEMBERS_FAILURE':
      return {
        ...state,
        members: {
          ...state.members,
          loading: false,
          error: action.payload
        }
      };

    // Roles related reducers
    case 'FETCH_ROLES_REQUEST':
      return {
        ...state,
        roles: {
          ...state.roles,
          loading: true
        }
      };

    case 'FETCH_ROLES_SUCCESS':
      return {
        ...state,
        roles: {
          list: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_ROLES_FAILURE':
      return {
        ...state,
        roles: {
          ...state.roles,
          loading: false,
          error: action.payload
        }
      };

    // Permissions related reducers
    case 'FETCH_PERMISSIONS_REQUEST':
      return {
        ...state,
        permissions: {
          ...state.permissions,
          loading: true
        }
      };

    case 'FETCH_PERMISSIONS_SUCCESS':
      return {
        ...state,
        permissions: {
          list: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_PERMISSIONS_FAILURE':
      return {
        ...state,
        permissions: {
          ...state.permissions,
          loading: false,
          error: action.payload
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        auth: {
          ...state.auth,
          error: null
        }
      };

    // Branches related reducers
    case 'FETCH_BRANCHES_REQUEST':
      return {
        ...state,
        branches: {
          ...state.branches,
          loading: true,
          error: null
        }
      };

    case 'FETCH_BRANCHES_SUCCESS':
      return {
        ...state,
        branches: {
          ...state.branches,
          loading: false,
          list: action.payload,
          error: null
        }
      };

    case 'FETCH_BRANCHES_FAILURE':
      return {
        ...state,
        branches: {
          ...state.branches,
          loading: false,
          error: action.payload
        }
      };

    // Customers related reducers
    case 'FETCH_CUSTOMERS_REQUEST':
      return {
        ...state,
        customers: {
          ...state.customers,
          loading: true,
          error: null
        }
      };

    case 'FETCH_CUSTOMERS_SUCCESS':
      return {
        ...state,
        customers: {
          list: action.payload.data,
          loading: false,
          error: null,
          pagination: {
            current_page: action.payload.current_page,
            per_page: action.payload.per_page,
            total: action.payload.total
          }
        }
      };

    case 'FETCH_CUSTOMERS_FAILURE':
      return {
        ...state,
        customers: {
          ...state.customers,
          loading: false,
          error: action.payload
        }
      };

    // Business Items related reducers
    case 'FETCH_BUSINESS_ITEMS_REQUEST':
      return {
        ...state,
        businessItems: {
          ...state.businessItems,
          loading: true,
          error: null
        }
      };

    case 'FETCH_BUSINESS_ITEMS_SUCCESS':
      return {
        ...state,
        businessItems: {
          list: action.payload.data,
          loading: false,
          error: null,
          pagination: {
            current_page: action.payload.current_page,
            per_page: action.payload.per_page,
            total: action.payload.total
          }
        }
      };

    case 'FETCH_BUSINESS_ITEMS_FAILURE':
      return {
        ...state,
        businessItems: {
          ...state.businessItems,
          loading: false,
          error: action.payload
        }
      };

    // Projects related reducers
    case 'FETCH_PROJECTS_REQUEST':
      return {
        ...state,
        projects: {
          ...state.projects,
          loading: true,
          error: null
        }
      };

    case 'FETCH_PROJECTS_SUCCESS':
      return {
        ...state,
        projects: {
          list: action.payload.data,
          loading: false,
          error: null,
          pagination: {
            current_page: action.payload.current_page,
            per_page: action.payload.per_page,
            total: action.payload.total
          }
        }
      };

    case 'FETCH_PROJECTS_FAILURE':
      return {
        ...state,
        projects: {
          ...state.projects,
          loading: false,
          error: action.payload
        }
      };

    // Config related reducers
    case 'FETCH_CONFIG_REQUEST':
      return {
        ...state,
        config: {
          ...state.config,
          loading: true,
          error: null
        }
      };

    case 'FETCH_CONFIG_SUCCESS':
      return {
        ...state,
        config: {
          data: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_CONFIG_FAILURE':
      return {
        ...state,
        config: {
          ...state.config,
          loading: false,
          error: action.payload
        }
      };

    // Payment History related reducers
    case 'FETCH_PAYMENT_HISTORY_REQUEST':
      return {
        ...state,
        paymentHistory: {
          ...state.paymentHistory,
          loading: true,
          error: null
        }
      };

    case 'FETCH_PAYMENT_HISTORY_SUCCESS':
      return {
        ...state,
        paymentHistory: {
          list: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_PAYMENT_HISTORY_FAILURE':
      return {
        ...state,
        paymentHistory: {
          ...state.paymentHistory,
          loading: false,
          error: action.payload
        }
      };

    // Line Bot related reducers
    case 'FETCH_LINE_BOT_LIST_REQUEST':
      return {
        ...state,
        lineBot: {
          ...state.lineBot,
          loading: true,
          error: null
        }
      };

    case 'FETCH_LINE_BOT_LIST_SUCCESS':
      return {
        ...state,
        lineBot: {
          ...state.lineBot,
          list: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_LINE_BOT_LIST_FAILURE':
      return {
        ...state,
        lineBot: {
          ...state.lineBot,
          loading: false,
          error: action.payload
        }
      };

    case 'UPDATE_LINE_BOT_REQUEST':
      return {
        ...state,
        lineBot: {
          ...state.lineBot,
          loading: true,
          error: null
        }
      };

    case 'UPDATE_LINE_BOT_SUCCESS':
      return {
        ...state,
        lineBot: {
          ...state.lineBot,
          loading: false,
          error: null
        }
      };

    case 'UPDATE_LINE_BOT_FAILURE':
      return {
        ...state,
        lineBot: {
          ...state.lineBot,
          loading: false,
          error: action.payload
        }
      };

    // Dashboard related reducers
    case 'FETCH_DASHBOARD_REQUEST':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          loading: true,
          error: null
        }
      };

    case 'FETCH_DASHBOARD_SUCCESS':
      return {
        ...state,
        dashboard: {
          data: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_DASHBOARD_FAILURE':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          loading: false,
          error: action.payload
        }
      };

    // System Log related reducers
    case 'FETCH_SYSTEM_LOG_REQUEST':
      return {
        ...state,
        systemLog: {
          ...state.systemLog,
          loading: true,
          error: null
        }
      };

    case 'FETCH_SYSTEM_LOG_SUCCESS':
      return {
        ...state,
        systemLog: {
          list: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_SYSTEM_LOG_FAILURE':
      return {
        ...state,
        systemLog: {
          ...state.systemLog,
          loading: false,
          error: action.payload
        }
      };

    // Bills related reducers
    case 'SET_LOADING':
      return {
        ...state,
        bills: {
          ...state.bills,
          loading: action.payload
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        bills: {
          ...state.bills,
          error: action.payload
        }
      };

    case 'SET_BILLS':
      return {
        ...state,
        bills: {
          ...state.bills,
          list: action.payload.list,
          pagination: action.payload.pagination,
          loading: false,
          error: null
        }
      };

    case 'UPDATE_BILL':
      return {
        ...state,
        bills: {
          ...state.bills,
          list: state.bills.list.map(bill => 
            bill.id === action.payload.id ? action.payload : bill
          )
        }
      };

    case 'DELETE_BILL':
      return {
        ...state,
        bills: {
          ...state.bills,
          list: state.bills.list.filter(bill => bill.id !== action.payload)
        }
      };

    default:
      return state;
  }
};

export default reducer; 