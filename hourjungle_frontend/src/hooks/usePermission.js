import { useSelector } from 'react-redux';

export const usePermission = () => {
  const user = useSelector(state => state.auth.user);
  const permissions = useSelector((state) => state.auth.user?.permissions || []);

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.is_top_account === 1) return true; // 最高權限帳號
    return permissions.some(p => p.name === permissionName);
  };
     

  return {
    hasPermission,
    isTopAccount: user?.is_top_account === 1,
    permissions
  };
};

export default usePermission; 