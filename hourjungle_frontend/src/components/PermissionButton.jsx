import React from 'react';
import { Button } from "@material-tailwind/react";
import { usePermission } from '@/hooks/usePermission';

export function PermissionButton({ 
    requiredPermission, 
    children, 
    onClick, 
    ...props 
}) {
    const { hasPermission, isTopAccount } = usePermission();

    // 如果是最高權限帳號或有對應權限才顯示按鈕
    if (!isTopAccount && !hasPermission(requiredPermission)) {
        return null;
    }

    return (
        <Button
            onClick={onClick}
            {...props}
        >
            {children}
        </Button>
    );
} 