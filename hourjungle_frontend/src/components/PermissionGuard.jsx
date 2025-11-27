import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export const PermissionGuard = ({ 
  children, 
  requiredPermission, 
  requiredPermissions, 
  requireAll = false,
  fallback = null 
}) => {
  const permissions = useSelector((state) => state.auth.user?.permissions || []);
  
  const hasPermission = (permissionName) => {
    return permissions.some(p => p.name === permissionName);
  };

  const checkPermissions = () => {
    if (requiredPermission) {
      return hasPermission(requiredPermission);
    }
    
    if (requiredPermissions) {
      return requireAll
        ? requiredPermissions.every(p => hasPermission(p))
        : requiredPermissions.some(p => hasPermission(p));
    }
    
    return true;
  };

  if (!checkPermissions()) {
    return fallback || <Navigate to="/unauthorized" replace />;
  }

  return children;
}; 