import axios from 'axios';
import { API_URL, CONFIG } from '../config';
import liff from '@line/liff';

// 添加 axios 默认配置
axios.defaults.baseURL = window.location.origin;
axios.defaults.headers.common = {
    ...CONFIG.api.headers
};
axios.defaults.withCredentials = true;
axios.defaults.timeout = 15000; // 改為 15 秒

// 修改請求攔截器
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Actions
export const login = (credentials) => {
  return async (dispatch) => {
    dispatch({ type: 'AUTH_LOGIN_REQUEST' });
    try {
      console.log('Sending request to:', `${API_URL}/login`); // 添加调试日志
      const response = await axios.post(`${API_URL}/login`, {
        account: credentials.account,
        password: credentials.password
      });
      
      if (response.data.status) {
        const { token, ...userData } = response.data.data;
        
        // 設置 axios 默認 headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 分別存儲 token 和用戶資料
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        dispatch({ 
          type: 'AUTH_LOGIN_SUCCESS', 
          payload: {
            user: userData,
            token: token
          }
        });
        return { error: false };
      } else {
        dispatch({ type: 'AUTH_LOGIN_FAILURE', payload: response.data.message });
        return { error: true, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error); // 添加错误日志
      const message = error.response?.data?.message || '登入失敗';
      dispatch({ type: 'AUTH_LOGIN_FAILURE', payload: message });
      return { error: true, message: message };
    }
  };
};

// 註冊
export const register = (userData) => {
  return async (dispatch) => {
    dispatch({ type: 'AUTH_REGISTER_REQUEST' });
    try {
      console.log('Sending registration data:', {
        account: userData.email,
        password: userData.password,
        nickname: userData.nickname,
        id_number: userData.idNumber,
        line_id: userData.lineId,
        role_id: userData.roleId,
        status: 1, // 預設啟用
        branch_id: userData.branchId || '', // 如果有分店資訊
        email: userData.email || '',
        phone: userData.phone || ''
      });

      const response = await axios.post(`${API_URL}/create-member`, {
        account: userData.email,
        password: userData.password,
        nickname: userData.nickname,
        id_number: userData.idNumber,
        line_id: userData.lineId,
        role_id: userData.roleId,
        status: 1,
        branch_id: userData.branchId || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });

      console.log('Registration response:', response.data);

      if (response.data.status) {
        // 註冊成功後自動登入
        const loginResponse = await axios.post(`${API_URL}/login`, {
          account: userData.email,
          password: userData.password
        });
        
        if (loginResponse.data.status) {
          localStorage.setItem('user', JSON.stringify(loginResponse.data.data));
          dispatch({ type: 'AUTH_REGISTER_SUCCESS', payload: loginResponse.data.data });
          return { error: false };
        }
      }
      
      dispatch({ type: 'AUTH_REGISTER_FAILURE', payload: response.data.message });
      return { error: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      const message = error.response?.data?.message || '註冊失敗';
      dispatch({ type: 'AUTH_REGISTER_FAILURE', payload: message });
      return { error: true };
    }
  };
};

export const logout = () => {
  return async (dispatch) => {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (error) {
      console.error('登出失敗:', error);
    } finally {
      // 清除 localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 清除 axios headers
      delete axios.defaults.headers.common['Authorization'];
      
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };
};

// 添加一個初始化 token 的函數
export const initializeAuth = () => {
  return (dispatch) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
      // 設置 axios 默認 headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      dispatch({
        type: 'AUTH_LOGIN_SUCCESS',
        payload: {
          user,
          token
        }
      });
    }
  };
};

// Members Actions
export const fetchMembers = (params = { page: 1, per_page: 10, keyword: '' }) => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_MEMBERS_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-all-members`, { params });
      
      if (response.data.status) {
        const payload = {
          data: Array.isArray(response.data.data) ? response.data.data : [],
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          total: response.data.total
        };
        
        dispatch({ type: 'FETCH_MEMBERS_SUCCESS', payload });
      } else {
        dispatch({ type: 'FETCH_MEMBERS_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      console.error('Fetch members error:', error);
      dispatch({ type: 'FETCH_MEMBERS_FAILURE', payload: error.message });
    }
  };
};

export const createMember = (memberData) => {
  return async (dispatch) => {
    try {
      console.log('Sending member data:', memberData);
      const response = await axios.post(`${API_URL}/create-member`, {
        account: memberData.account,
        nickname: memberData.nickname,
        password: memberData.password,
        email: memberData.email || '',
        phone: memberData.phone || '',
        role_id: memberData.role_id,
        branch_id: memberData.branch_id,
        status: memberData.status || 1
      });

      if (response.data.status) {
        dispatch(fetchMembers()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Create member error:', error.response?.data || error);
      return { 
        success: false, 
        message: error.response?.data?.message || '新增失敗，請檢查所有欄位是否填寫正確'
      };
    }
  };
};

export const updateMember = (memberData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/update-member`, {
        id: memberData.id,
        nickname: memberData.nickname,
        password: memberData.password,
        email: memberData.email || '',
        phone: memberData.phone || '',
        role_id: memberData.role_id,
        branch_id: memberData.branch_id,
        status: memberData.status
      });

      if (response.data.status) {
        dispatch(fetchMembers()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '修改失敗，請檢查所有欄位是否填寫正確'
      };
    }
  };
};

export const deleteMember = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-member`, { id });
      if (response.data.status) {
        dispatch(fetchMembers()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Roles Actions
export const fetchRoles = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_ROLES_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/roles`);
      if (response.data.status) {
        dispatch({ type: 'FETCH_ROLES_SUCCESS', payload: response.data.data });
      } else {
        dispatch({ type: 'FETCH_ROLES_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_ROLES_FAILURE', payload: error.message });
    }
  };
};

export const createRole = (name) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-role`, { 
        name,
        status: 1  // 默認啟用
      });
      if (response.data.status) {
        dispatch(fetchRoles()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const updateRole = (roleData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/modify-role`, {
        id: roleData.id,
        name: roleData.name,
        status: roleData.status
      });
      if (response.data.status) {
        dispatch(fetchRoles()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const deleteRole = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-role`, { id });
      if (response.data.status) {
        dispatch(fetchRoles()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const updateRolePermissions = (roleId, permissionIds) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-or-update-role-permission`, {
        role_id: roleId,
        permission_ids: permissionIds.join(',')
      });
      if (response.data.status) {
        dispatch(fetchRoles()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Permissions Actions
export const fetchPermissions = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_PERMISSIONS_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/permissions`);
      if (response.data.status) {
        dispatch({ type: 'FETCH_PERMISSIONS_SUCCESS', payload: response.data.data });
      } else {
        dispatch({ type: 'FETCH_PERMISSIONS_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_PERMISSIONS_FAILURE', payload: error.message });
    }
  };
};

// 新增權限項目
export const createPermission = (permissionData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-permission`, permissionData);
      if (response.data.status) {
        dispatch(fetchPermissions()); // 重新獲取權限列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Create permission error:', error.response?.data || error);
      return { 
        success: false, 
        message: error.response?.data?.message || '新增權限失敗'
      };
    }
  };
};

// 刪除權限項目
export const deletePermission = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-permission`, { id });
      if (response.data.status) {
        dispatch(fetchPermissions()); // 重新獲取權限列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// 獲取館別列表
export const fetchBranches = () => {
  return async (dispatch) => {
    console.log('Starting fetchBranches action');
    dispatch({ type: 'FETCH_BRANCHES_REQUEST' });
    
    try {
      const response = await axios.get(`${API_URL}/get-branch-list`);
      console.log('Branches API response:', response.data);
      
      if (response.data.status) {
        console.log('Dispatching success with:', response.data.data);
        dispatch({ 
          type: 'FETCH_BRANCHES_SUCCESS', 
          payload: response.data.data 
        });
      } else {
        console.log('API returned error:', response.data.message);
        dispatch({ 
          type: 'FETCH_BRANCHES_FAILURE', 
          payload: response.data.message 
        });
      }
    } catch (error) {
      console.error('Error in fetchBranches:', error);
      dispatch({ 
        type: 'FETCH_BRANCHES_FAILURE', 
        payload: error.message 
      });
    }
  };
};

export const getBranchInfo = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/get-branch-info`, { id });
      if (response.data.status) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const createBranch = (branchData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-branch`, branchData);
      if (response.data.status) {
        dispatch(fetchBranches());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const updateBranch = (branchData) => {
  return async (dispatch) => {
    try {
      // 确保 status 是数字类型
      const formattedData = {
        ...branchData,
        status: Number(branchData.status)
      };
      
      console.log('Sending update branch request with data:', formattedData);
      
      const response = await axios.post(`${API_URL}/update-branch`, formattedData);
      
      console.log('Update branch response:', response.data);
      
      if (response.data.status) {
        await dispatch(fetchBranches());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Update branch error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '更新失敗' 
      };
    }
  };
};

export const deleteBranch = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-branch`, { id });
      if (response.data.status) {
        dispatch(fetchBranches());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Customer Actions
export const fetchCustomers = (params = { page: 1, per_page: 10, keyword: '' }) => {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_CUSTOMERS_REQUEST' });
    try {
      const { user } = getState().auth;
      
      // 如果不是最高帳號，則只能查看自己分館的數據
      if (user && !user.is_top_account) {
        params.branch_id = user.branch_id;
      }

      console.log('Fetching customers with params:', params);
      const response = await axios.get(`${API_URL}/get-customers-list`, { params });
      
      if (response.data.status) {
        dispatch({
          type: 'FETCH_CUSTOMERS_SUCCESS',
          payload: {
            data: response.data.data, // 移除過濾，直接使用後端返回的數據
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total
          }
        });
      } else {
        dispatch({ type: 'FETCH_CUSTOMERS_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
      dispatch({ type: 'FETCH_CUSTOMERS_FAILURE', payload: error.message });
    }
  };
};

export const createCustomer = (customerData) => {
  return async (dispatch) => {
    try {
      // 創建 FormData 對象來處理文件上傳
      const formData = new FormData();
      
      // 添加基本客戶資料
      Object.keys(customerData).forEach(key => {
        if (key !== 'id_card_front' && key !== 'id_card_back') {
          formData.append(key, customerData[key]);
        }
      });

      // 添加身分證照片（如果有的話）
      if (customerData.id_card_front instanceof File) {
        formData.append('id_card_front', customerData.id_card_front);
      }
      if (customerData.id_card_back instanceof File) {
        formData.append('id_card_back', customerData.id_card_back);
      }

      // 修改請求配置以支持文件上傳
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const response = await axios.post(`${API_URL}/create-customer`, formData, config);
      
      if (response.data.status) {
        dispatch(fetchCustomers()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Create customer error:', error.response?.data || error);
      return { 
        success: false, 
        message: error.response?.data?.message || '新增失敗，請檢查所有欄位是否填寫正確'
      };
    }
  };
};

export const createCustomerUser = (customerData) => {
  return async (dispatch) => {
    try {
      // 初始化 LIFF
      await liff.init({ liffId: process.env.REACT_APP_LIFF_ID });
      
      // 獲取 LINE 用戶資訊
      const lineProfile = await liff.getProfile();
      
      // 創建 FormData 對象來處理文件上傳
      const formData = new FormData();
      
      // 添加 LINE 用戶資訊
      formData.append('line_id', lineProfile.userId);
      formData.append('line_name', lineProfile.displayName);
      
      // 添加其他客戶資料
      Object.keys(customerData).forEach(key => {
        formData.append(key, customerData[key]);
      });

      const response = await axios.post(`${API_URL}/create-customer-user`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.status) {
        return { 
          success: true, 
          message: response.data.message,
          data: response.data.data 
        };
      }
      return { 
        success: false, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Create customer error:', error);
      
      // 處理 LIFF 相關錯誤
      if (error.code) {
        return {
          success: false,
          message: '無法獲取 LINE 用戶資訊，請確認是否在 LINE 應用程式中開啟'
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || '新增失敗，請檢查所有欄位是否填寫正確'
      };
    }
  };
};

export const updateCustomer = (formData) => {
  return async (dispatch) => {
    try {
      console.log('Updating customer with formData:', Object.fromEntries(formData)); // 添加日志
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await axios.post(`${API_URL}/update-customer`, formData, config);
      
      if (response.data.status) {
        dispatch(fetchCustomers());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Update customer error:', error.response?.data || error);
      return { 
        success: false, 
        message: error.response?.data?.message || '修改失敗，請檢查所有欄位是否填寫正確'
      };
    }
  };
};

export const deleteCustomer = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-customer`, { id });
      if (response.data.status) {
        dispatch(fetchCustomers());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const getCustomerInfo = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/get-customer-info`, { id });
      if (response.data.status) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Business Item Actions
export const fetchBusinessItems = (params = { page: 1, per_page: 10, keyword: '' }) => {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_BUSINESS_ITEMS_REQUEST' });
    try {
      const { user } = getState().auth;
      
      // 如果不是最高帳號，則只能查看自己分館的數據
      if (user && !user.is_top_account) {
        params.branch_id = user.branch_id;
      }

      console.log('Fetching business items with params:', params);
      const response = await axios.get(`${API_URL}/get-business-item-list`, { params });
      
      if (response.data.status) {
        dispatch({
          type: 'FETCH_BUSINESS_ITEMS_SUCCESS',
          payload: {
            data: response.data.data, // 移除前端過濾，使用後端返回的數據
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total
          }
        });
      } else {
        dispatch({ type: 'FETCH_BUSINESS_ITEMS_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      console.error('Fetch business items error:', error);
      dispatch({ type: 'FETCH_BUSINESS_ITEMS_FAILURE', payload: error.message });
    }
  };
};

export const createBusinessItem = (itemData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-business-item`, itemData);
      if (response.data.status) {
        dispatch(fetchBusinessItems());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const updateBusinessItem = (itemData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/update-business-item`, itemData);
      if (response.data.status) {
        dispatch(fetchBusinessItems());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const deleteBusinessItem = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-business-item`, { id });
      if (response.data.status) {
        dispatch(fetchBusinessItems());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const getBusinessItemInfo = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/get-business-item-info`, { id });
      if (response.data.status) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Resource Actions
export const fetchResources = (params = { page: 1, per_page: 10, keyword: '' }) => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_RESOURCES_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-resources-list`, { params });
      if (response.data.status) {
        dispatch({ type: 'FETCH_RESOURCES_SUCCESS', payload: response.data.data });
      } else {
        dispatch({ type: 'FETCH_RESOURCES_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_RESOURCES_FAILURE', payload: error.message });
    }
  };
};

export const createResource = (resourceData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-resource`, resourceData);
      if (response.data.status) {
        dispatch(fetchResources());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const updateResource = (resourceData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/update-resource`, resourceData);
      if (response.data.status) {
        dispatch(fetchResources());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const deleteResource = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-resource`, { id });
      if (response.data.status) {
        dispatch(fetchResources());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const getResourceInfo = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/get-resource-info`, { id });
      if (response.data.status) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Utility Actions
export const clearError = () => ({
  type: 'CLEAR_ERROR'
});

// 修改權限檢查函數
export const checkPermission = (requiredRole, requiredBranch = null) => {
  return (dispatch, getState) => {
    const { user } = getState().auth;
    
    if (!user) return false;

    // 檢查是否是最高帳號
    if (user.is_top_account === 1) return true;

    // 檢查分館權限
    if (requiredBranch && user.branch_id !== requiredBranch) return false;

    // 檢查角色權限
    if (requiredRole && user.role_id > requiredRole) return false;

    return true;
  };
};

// Projects Actions
export const fetchProjects = (params = { page: 1, per_page: 10, keyword: '' }) => {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_PROJECTS_REQUEST' });
    try {
      const { user } = getState().auth;
      
      // 如果不是最高帳號，則只能查看自己分館的數據
      if (user && !user.is_top_account) {
        params.branch_id = user.branch_id;
      }

      const response = await axios.get(`${API_URL}/get-project-list`, { params });
      
      if (response.data.status) {
        dispatch({
          type: 'FETCH_PROJECTS_SUCCESS',
          payload: {
            data: response.data.data,
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total
          }
        });
      } else {
        dispatch({ type: 'FETCH_PROJECTS_FAILURE', payload: response.data.message });
      }
    } catch (error) {
      console.error('Fetch projects error:', error);
      dispatch({ type: 'FETCH_PROJECTS_FAILURE', payload: error.message });
    }
  };
};

export const createProject = (projectData) => {
  return async (dispatch) => {
    try {
      // 確保日期格式正確
      const formattedData = {
        ...projectData,
        start_day: projectData.start_day.split('T')[0],
        end_day: projectData.end_day.split('T')[0],
        signing_day: projectData.signing_day.split('T')[0],
        next_pay_day: projectData.next_pay_day?.split('T')[0],
        last_pay_day: projectData.last_pay_day?.split('T')[0],
      };

      const response = await axios.post(`${API_URL}/create-project`, formattedData);
      if (response.data.status) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Create project error:', error.response?.data || error);
      if (error.code === 'ERR_NETWORK') {
        return { 
          success: false, 
          message: '無法連接到伺服器，請確認網路連接並重試'
        };
      }
      return { 
        success: false, 
        message: error.response?.data?.message || '新增失敗'
      };
    }
  };
};

export const updateProject = (projectData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/update-project`, projectData);
      if (response.data.status) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '修改失敗'
      };
    }
  };
};

export const deleteProject = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/delete-project`, { id });
      if (response.data.status) {
        dispatch(fetchProjects());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

export const getProjectInfo = (id) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/get-project-info`, { id });
      if (response.data.status) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
};

// Config Actions
export const fetchConfig = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_CONFIG_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-config`);
      if (response.data.status) {
        dispatch({ 
          type: 'FETCH_CONFIG_SUCCESS', 
          payload: response.data.data 
        });
        return { success: true, data: response.data.data };
      }
      dispatch({ 
        type: 'FETCH_CONFIG_FAILURE', 
        payload: response.data.message 
      });
      return { success: false, message: response.data.message };
    } catch (error) {
      dispatch({ 
        type: 'FETCH_CONFIG_FAILURE', 
        payload: error.message 
      });
      return { success: false, message: error.message };
    }
  };
};

export const updateConfig = (configData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/update-config`, configData);
      if (response.data.status) {
        dispatch(fetchConfig());
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '更新失敗'
      };
    }
  };
};

export const confirmContract = (data) => {
    return async (dispatch) => {
        try {
            const response = await axios.post(`${API_URL}/confirm-contract`, data);
            if (response.data.status) {
                return { 
                    success: true, 
                    message: response.data.message,
                    data: response.data.data
                };
            }
            return { 
                success: false, 
                message: response.data.message 
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || '確認失敗'
            };
        }
    };
};

export const uploadContractPdf = (data) => {
    return async (dispatch) => {
        try {
            // 添加重試機制
            const maxRetries = 3;
            let retryCount = 0;
            
            while (retryCount < maxRetries) {
                try {
                    const response = await axios.post(`${API_URL}/upload-contract-pdf`, data);
                    if (response.data.status) {
                        return { 
                            success: true, 
                            message: response.data.message,
                            data: response.data.data
                        };
                    }
                    return { 
                        success: false, 
                        message: response.data.message 
                    };
                } catch (error) {
                    if (error.code === 'ERR_NETWORK' && retryCount < maxRetries - 1) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                        continue;
                    }
                    throw error;
                }
            }
        } catch (error) {
            console.error('上傳合約失敗:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || '上傳失敗，請確認網路連接'
            };
        }
    };
};

// Payment History Actions
export const createPaymentHistory = (paymentData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_URL}/create-payment-history`, paymentData);
      if (response.data.status) {
        dispatch(fetchPaymentHistoryList()); // 重新獲取列表
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Create payment history error:', error.response?.data || error);
      return { 
        success: false, 
        message: error.response?.data?.message || '新增繳費紀錄失敗'
      };
    }
  };
};

export const fetchPaymentHistoryList = (params = {}) => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_PAYMENT_HISTORY_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-payment-history-list`, { params });
      if (response.data.status) {
        dispatch({ 
          type: 'FETCH_PAYMENT_HISTORY_SUCCESS', 
          payload: response.data.data 
        });
      } else {
        dispatch({ 
          type: 'FETCH_PAYMENT_HISTORY_FAILURE', 
          payload: response.data.message 
        });
      }
    } catch (error) {
      console.error('Fetch payment history error:', error);
      dispatch({ 
        type: 'FETCH_PAYMENT_HISTORY_FAILURE', 
        payload: error.message 
      });
    }
  };
};

// LINE Bot Actions
export const sendLineMessage = (data) => {
    return async (dispatch) => {
        try {
            // 添加日誌來追蹤發送的數據
            console.log('Sending LINE message:', data);
            
            // 確保數據格式正確
            const payload = {
                user_id: data.user_id,
                message: data.message
            };

            const response = await axios.post(`${API_URL}/send-line-message`, payload);
            console.log('LINE message response:', response.data);
            
            if (response.data.status) {
                return { 
                    success: true, 
                    message: response.data.message 
                };
            }
            return { 
                success: false, 
                message: response.data.message 
            };
        } catch (error) {
            console.error('Send LINE message error:', error.response?.data || error);
            return { 
                success: false, 
                message: error.response?.data?.message || '發送失敗，請稍後再試'
            };
        }
    };
};

export const handleWebhook = (webhookData) => {
  return async (dispatch) => {
    dispatch({ type: 'WEBHOOK_REQUEST' });
    try {
      const response = await axios.post(`${API_URL}/webhook`, webhookData);
      
      if (response.data.status === 'ok') {
        dispatch({ 
          type: 'WEBHOOK_SUCCESS',
          payload: response.data 
        });
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      dispatch({ 
        type: 'WEBHOOK_FAILURE', 
        payload: error.message 
      });
      return { success: false, message: error.message };
    }
  };
};

export const sendMessageToUser = (userId, message) => {
  return async (dispatch) => {
    dispatch({ type: 'SEND_LINE_MESSAGE_REQUEST' });
    try {
      const response = await axios.post(`${API_URL}/send-message`, {
        user_id: userId,
        message: message
      });
      
      if (response.data.status) {
        dispatch({ type: 'SEND_LINE_MESSAGE_SUCCESS' });
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      dispatch({ 
        type: 'SEND_LINE_MESSAGE_FAILURE', 
        payload: error.response?.data?.message || '发送失败' 
      });
      return { success: false, message: error.message };
    }
  };
};

export const broadcastLineMessage = (message) => {
  return async (dispatch) => {
    dispatch({ type: 'BROADCAST_LINE_MESSAGE_REQUEST' });
    try {
      const response = await axios.post(`${API_URL}/broadcast`, {
        message: message
      });
      
      if (response.data.status) {
        dispatch({ type: 'BROADCAST_LINE_MESSAGE_SUCCESS' });
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      dispatch({ 
        type: 'BROADCAST_LINE_MESSAGE_FAILURE', 
        payload: error.response?.data?.message || '群发失败' 
      });
      return { success: false, message: error.message };
    }
  };
};

// 获取 LINE Bot 列表
export const fetchLineBotList = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_LINE_BOT_LIST_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-line-bot-list`);
      if (response.data.status) {
        dispatch({ 
          type: 'FETCH_LINE_BOT_LIST_SUCCESS', 
          payload: response.data.data 
        });
        return { success: true, data: response.data.data };
      }
      dispatch({ 
        type: 'FETCH_LINE_BOT_LIST_FAILURE', 
        payload: response.data.message 
      });
      return { success: false, message: response.data.message };
    } catch (error) {
      dispatch({ 
        type: 'FETCH_LINE_BOT_LIST_FAILURE', 
        payload: error.message 
      });
      return { success: false, message: error.message };
    }
  };
};

// 更新 LINE Bot 设置
export const updateLineBot = (botData) => {
  return async (dispatch) => {
    dispatch({ type: 'UPDATE_LINE_BOT_REQUEST' });
    try {
      const response = await axios.post(`${API_URL}/update-line-bot`, {
        id: botData.id,
        channel_secret: botData.channel_secret,
        channel_token: botData.channel_token,
        liff_id: botData.liff_id,
        payment_notice: botData.payment_notice,
        renewal_notice: botData.renewal_notice
      });
      
      if (response.data.status) {
        dispatch({ type: 'UPDATE_LINE_BOT_SUCCESS' });
        // 更新成功后重新获取列表
        dispatch(fetchLineBotList());
        return { success: true, message: response.data.message };
      }
      dispatch({ 
        type: 'UPDATE_LINE_BOT_FAILURE', 
        payload: response.data.message 
      });
      return { success: false, message: response.data.message };
    } catch (error) {
      dispatch({ 
        type: 'UPDATE_LINE_BOT_FAILURE', 
        payload: error.message 
      });
      return { success: false, message: error.message };
    }
  };
};

// 获取业务项目列表
export const fetchBusinessItemList = (params = { page: 1, per_page: 10, keyword: '' }) => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_BUSINESS_ITEMS_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-business-item-list`, { params });
      if (response.data.status) {
        dispatch({
          type: 'FETCH_BUSINESS_ITEMS_SUCCESS',
          payload: {
            data: response.data.data,
            current_page: response.data.current_page,
            per_page: response.data.per_page,
            total: response.data.total
          }
        });
      } else {
        dispatch({ 
          type: 'FETCH_BUSINESS_ITEMS_FAILURE', 
          payload: response.data.message 
        });
      }
    } catch (error) {
      dispatch({ 
        type: 'FETCH_BUSINESS_ITEMS_FAILURE', 
        payload: error.message 
      });
    }
  };
};

// Dashboard Actions
export const fetchDashboard = () => {
    return async (dispatch) => {
        try {
            dispatch({ type: 'FETCH_DASHBOARD_REQUEST' });
            
            const response = await axios.get(`${API_URL}/dashboard`);
            console.log('Dashboard API response:', response.data);
            
            if (response.data.status) {
                dispatch({
                    type: 'FETCH_DASHBOARD_SUCCESS',
                    payload: response.data.data
                });
                return { success: true };
            } else {
                dispatch({
                    type: 'FETCH_DASHBOARD_FAILURE',
                    payload: response.data.message
                });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Fetch dashboard error:', error);
            dispatch({
                type: 'FETCH_DASHBOARD_FAILURE',
                payload: error.message
            });
            return { success: false, message: error.message };
        }
    };
};

// System Log Actions
export const fetchSystemLog = (params = {}) => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_SYSTEM_LOG_REQUEST' });
    try {
      const response = await axios.get(`${API_URL}/get-system-log`, { params });
      
      if (response.data.status) {
        dispatch({ 
          type: 'FETCH_SYSTEM_LOG_SUCCESS', 
          payload: response.data.data 
        });
        return { success: true, data: response.data.data };
      }
      
      dispatch({ 
        type: 'FETCH_SYSTEM_LOG_FAILURE', 
        payload: response.data.message 
      });
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Fetch system log error:', error);
      dispatch({ 
        type: 'FETCH_SYSTEM_LOG_FAILURE', 
        payload: error.message 
      });
      return { success: false, message: error.message };
    }
  };
};

// 匯出客戶資料
export const exportCustomers = () => {
  return async () => {
    try {
      // 使用 window.open 直接下載檔案
      window.open(`${API_URL}/export-customers`, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Export customers error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯出失敗'
      };
    }
  };
};

// 匯入客戶資料
export const importCustomers = (file) => {
  return async (dispatch, getState) => {
    try {
      const { user } = getState().auth;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('branch_id', user.branch_id); // 添加上传者的馆别ID

      const response = await axios.post(`${API_URL}/import-customers`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status) {
        dispatch(fetchCustomers());
        return { 
          success: true, 
          message: response.data.message,
          warnings: response.data.warnings 
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Import customers error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯入失敗'
      };
    }
  };
};

// 匯出業務項目範例
export const exportBusinessItemsExample = () => {
  return async () => {
    try {
      window.open(`${API_URL}/export-business-items-example`, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Export business items example error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯出範例失敗'
      };
    }
  };
};

// 匯出業務項目
export const exportBusinessItems = () => {
  return async () => {
    try {
      window.open(`${API_URL}/export-business-items`, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Export business items error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯出失敗'
      };
    }
  };
};

// 匯入業務項目
export const importBusinessItems = (file) => {
  return async (dispatch) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/import-business-items`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status) {
        // 重新獲取業務項目列表
        dispatch(fetchBusinessItems());
        return { 
          success: true, 
          message: response.data.message,
          warnings: response.data.warnings 
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Import business items error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯入失敗'
      };
    }
  };
};

// 匯出專案範例
export const exportProjectsExample = () => {
  return async () => {
    try {
      window.open(`${API_URL}/export-projects-example`, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Export projects example error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯出範例失敗'
      };
    }
  };
};

// 匯出專案
export const exportProjects = (params = {}) => {
    return async () => {
        try {
            const queryString = new URLSearchParams(params).toString();
            window.open(`${API_URL}/export-projects?${queryString}`, '_blank');
            return { success: true };
        } catch (error) {
            console.error('Export projects error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || '導出失敗'
            };
        }
    };
};

// 匯入專案
export const importProjects = (file) => {
    return async (dispatch) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_URL}/import-projects`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status) {
                dispatch(fetchProjects());
                return { 
                    success: true, 
                    message: response.data.message,
                    warnings: response.data.warnings 
                };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Import projects error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || '導入失敗'
            };
        }
    };
};

// 匯出客戶範例
export const exportCustomersExample = () => {
  return async () => {
    try {
      window.open(`${API_URL}/export-customers-example`, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Export customers example error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '匯出範例失敗'
      };
    }
  };
};

// 獲取公開合約資料
export const getPublicProjectInfo = (projectId) => {
    return async () => {
        try {
            const response = await axios.get(`${API_URL}/public/project/${projectId}`);
            if (response.data.status) {
                const project = response.data.data;
                return {
                    success: true,
                    data: {
                        projectId: project.id,
                        projectName: project.projectName,
                        customerName: project.customerName,
                        businessItemName: project.businessItemName,
                        branchName: project.branchName,
                        start_day: project.start_day.split('T')[0],
                        end_day: project.end_day.split('T')[0],
                        signing_day: project.signing_day.split('T')[0],
                        pay_day: project.pay_day,
                        payment_period: project.payment_period,
                        contractType: project.contractType,
                        sale_price: project.sale_price,
                        current_payment: project.current_payment,
                        total_payment: project.total_payment,
                        deposit: project.deposit || '0',
                        penaltyFee: project.penaltyFee || '0',
                        lateFee: project.lateFee || '3',
                        broker: project.broker || '',
                        broker_remark: project.broker_remark || '',
                        remark: project.remark || ''
                    }
                };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('獲取合約資料失敗:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || '獲取合約資料失敗'
            };
        }
    };
};

// 查看合約 PDF
export const viewContractPdf = (projectId) => {
    return async () => {
        try {
            // 使用 window.open 打開新視窗查看合約
            window.open(`${API_URL}/contract-pdf/${projectId}`, '_blank');
            return { success: true };
        } catch (error) {
            console.error('View contract PDF error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || '查看合約失敗'
            };
        }
    };
};

// 获取发票列表
export const fetchBills = (params = { page: 1, per_page: 10, keyword: '' }) => {
    return async (dispatch) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            console.log('Fetching bills with params:', params); // 添加日志
            
            const response = await axios.get(`${API_URL}/bills`, { 
                params,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            console.log('Bills API response:', response.data); // 添加日志
            
            if (response.data.status === 'success') {
                dispatch({
                    type: 'SET_BILLS',
                    payload: {
                        list: response.data.data,
                        pagination: {
                            current_page: parseInt(params.page),
                            per_page: parseInt(params.per_page),
                            total: response.data.total || 0
                        }
                    }
                });
                return { success: true, data: response.data.data };
            } else {
                dispatch({ type: 'SET_ERROR', payload: response.data.message });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Fetch bills error:', error); // 添加错误日志
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
};

// 获取单个发票详情
export const getBillInfo = (id) => {
    return async (dispatch) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.get(`${API_URL}/bills/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.status === 'success') {
                return { success: true, data: response.data.data };
            } else {
                dispatch({ type: 'SET_ERROR', payload: response.data.message });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
};

// 更新发票
export const updateBill = (billData) => {
    return async (dispatch) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.put(`${API_URL}/bills/${billData.id}`, billData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.status === 'success') {
                dispatch({ type: 'UPDATE_BILL', payload: response.data.data });
                return { success: true, data: response.data.data };
            } else {
                dispatch({ type: 'SET_ERROR', payload: response.data.message });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
};

// 删除发票
export const deleteBill = (id) => {
    return async (dispatch) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.delete(`${API_URL}/bills/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.status === 'success') {
                dispatch({ type: 'DELETE_BILL', payload: id });
                return { success: true };
            } else {
                dispatch({ type: 'SET_ERROR', payload: response.data.message });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
};

// 创建发票
export const createBill = (billData) => {
    return async (dispatch) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${API_URL}/bills`, billData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.status === 'success') {
                dispatch({ type: 'CREATE_BILL', payload: response.data.data });
                return { success: true, data: response.data.data };
            } else {
                dispatch({ type: 'SET_ERROR', payload: response.data.message });
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
};

