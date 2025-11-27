import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export const PermissionWrapper = ({ children, requiredRole = null, requireTopAccount = false }) => {
  const user = useSelector(state => state.auth.user);

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  // 如果需要最高帳號權限但用戶不是最高帳號
  if (requireTopAccount && user.is_top_account !== 1) {
    return <Navigate to="/dashboard/dashboard" replace />;
  }

  // 檢查角色權限
  if (requiredRole && user.role_id > requiredRole) {
    return <Navigate to="/dashboard/dashboard" replace />;
  }

  return children;
}; 