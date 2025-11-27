import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth, SystemManagement, Bill } from "@/layouts";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from '@/redux/actions';

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await dispatch(initializeAuth());
      setIsInitialized(true);
    };
    init();
  }, [dispatch]);

  // 等待初始化完成
  if (!isInitialized) {
    return null; // 或者返回一個載入中的畫面
  }

  return (
    <Routes>
      <Route path="/auth/*" element={<Auth />} />
      <Route 
        path="/dashboard/*" 
        element={token ? <Dashboard /> : <Navigate to="/auth/sign-in" />} 
      />
      <Route 
        path="/systemManagement/*" 
        element={token ? <SystemManagement /> : <Navigate to="/auth/sign-in" />} 
      />
      <Route 
        path="/bill/*" 
        element={token ? <Bill /> : <Navigate to="/auth/sign-in" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={token ? "/dashboard/dashboard" : "/auth/sign-in"} />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={token ? "/dashboard/dashboard" : "/auth/sign-in"} />} 
      />
    </Routes>
  );
}

export default App;
