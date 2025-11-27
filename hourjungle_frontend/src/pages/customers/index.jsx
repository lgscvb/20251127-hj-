import { PermissionGuard } from '@/components/PermissionGuard';

export function CustomersPage() {
  return (
    <PermissionGuard 
      requiredPermissions={['查看顧客', '新增顧客']}
      requireAll={false}
    >
      <div>
        {/* 整個頁面內容 */}
        <PermissionGuard requiredPermission="新增顧客">
          <Button>新增顧客</Button>
        </PermissionGuard>
        
        <PermissionGuard requiredPermission="編輯顧客">
          <Button>編輯</Button>
        </PermissionGuard>
      </div>
    </PermissionGuard>
  );
} 