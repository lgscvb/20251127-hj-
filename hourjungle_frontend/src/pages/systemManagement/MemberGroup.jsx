import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Chip,
} from "@material-tailwind/react";
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  KeyIcon
} from "@heroicons/react/24/solid";
import { 
  fetchRoles, 
  fetchPermissions, 
  createRole, 
  updateRole, 
  deleteRole,
  updateRolePermissions 
} from "@/redux/actions";


export function MemberGroup() {
  const dispatch = useDispatch();
  const { list: roles, loading: rolesLoading } = useSelector(state => state.roles);
  const { list: permissions } = useSelector(state => state.permissions);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    status: 1,
    permissions: []
  });
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // 初始化數據
  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  // 打開新增/編輯對話框
  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        status: role.status,
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        status: 1,
        permissions: []
      });
    }
    setOpenDialog(true);
  };

  // 處理表單提交
  const handleSubmit = async () => {
    try {
      let response;
      if (editingRole) {
        response = await dispatch(updateRole({
          id: editingRole.id,
          name: formData.name,
          status: parseInt(formData.status)
        }));
      } else {
        response = await dispatch(createRole(formData.name));
      }

      if (response.success) {
        setOpenDialog(false);
        dispatch(fetchRoles());
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('操作失敗');
    }
  };

  // 處理刪除
  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除嗎？')) {
      const response = await dispatch(deleteRole(id));
      if (!response.success) {
        alert(response.message);
      }
    }
  };

  // 打開權限設置對話框
  const handleOpenPermissionDialog = (role) => {
    setSelectedRole(role);
    setFormData({
        ...formData,
        permissions: role.permissions || [] // 使用從 API 獲取的權限數據
    });
    setOpenPermissionDialog(true);
  };

  // 處理權限設置
  const handlePermissionSubmit = async () => {
    try {
      const response = await dispatch(updateRolePermissions(
        selectedRole.id,
        formData.permissions
      ));

      if (response.success) {
        setOpenPermissionDialog(false);
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('設置失敗');
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="green" className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              管理員群組
            </Typography>
            <Button
              className="flex items-center gap-3"
              color="white"
              size="sm"
              onClick={() => handleOpenDialog()}
            >
              <PlusIcon strokeWidth={2} className="h-4 w-4" /> 新增群組
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["群組名", "狀態", "建立時間", "更新時間", "操作"].map((el) => (
                  <th
                    key={el}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                  >
                    <Typography
                      variant="small"
                      className="font-bold uppercase text-blue-gray-400"
                    >
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role, key) => {
                const className = `py-3 px-5 ${
                  key === roles.length - 1
                    ? ""
                    : "border-b border-blue-gray-50"
                }`;

                return (
                  <tr key={role.id}>
                    <td className={className}>
                      <Typography variant="small" className="font-semibold text-blue-gray-900 ell">
                        {role.name}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Chip
                        variant="gradient"
                        color={role.status === 1 ? "green" : "blue-gray"}
                        value={role.status === 1 ? "啟用" : "停用"}
                        className="py-0.5 px-2 text-[13px] font-medium text-center md:w-3/4 ell"
                      />
                    </td>
                    <td className={className}>
                      <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                        {new Date(role.created_at).toLocaleString()}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                        {new Date(role.updated_at).toLocaleString()}
                      </Typography>
                    </td>
                    <td className={className}>
                      <div className="flex gap-2">
                        <IconButton
                          variant="text"
                          color="blue-gray"
                          onClick={() => handleOpenDialog(role)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="text"
                          color="green"
                          onClick={() => handleOpenPermissionDialog(role)}
                        >
                          <KeyIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="text"
                          color="orange"
                          onClick={() => handleDelete(role.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* 新增/編輯群組對話框 */}
      <Dialog open={openDialog} handler={() => setOpenDialog(false)}>
        <DialogHeader>{editingRole ? '編輯群組' : '新增群組'}</DialogHeader>
        <DialogBody divider>
          <div className="grid gap-6">
            <Input
              label="群組名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <select
              className="border border-blue-gray-200 rounded-lg p-2"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
            >
              <option value={1}>啟用</option>
              <option value={0}>停用</option>
            </select>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setOpenDialog(false)}
            className="mr-1"
          >
            取消
          </Button>
          <Button variant="gradient" color="green" onClick={handleSubmit}>
            確定
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 權限設置對話框 */}
      <Dialog 
        open={openPermissionDialog} 
        handler={() => setOpenPermissionDialog(false)}
        size="lg"
      >
        <DialogHeader>設置權限 - {selectedRole?.name}</DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[500px]">
          <div className="grid gap-4">
            {permissions.map((category) => (
              <div key={category.category} className="border p-4 rounded">
                <Typography variant="h6" className="mb-2">
                  {category.category}
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {category.permissions.map((permission) => (
                    <Chip
                      key={permission.id}
                      value={permission.name}
                      variant={formData.permissions.includes(permission.id) ? "filled" : "outlined"}
                      onClick={() => {
                        const newPermissions = formData.permissions.includes(permission.id)
                          ? formData.permissions.filter(id => id !== permission.id)
                          : [...formData.permissions, permission.id];
                        setFormData({ ...formData, permissions: newPermissions });
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setOpenPermissionDialog(false)}
            className="mr-1"
          >
            取消
          </Button>
          <Button variant="gradient" color="green" onClick={handlePermissionSubmit}>
            確定
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default MemberGroup;
  