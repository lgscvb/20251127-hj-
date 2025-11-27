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
  Select,
  Option,
} from "@material-tailwind/react";
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { fetchPermissions, createPermission, deletePermission } from "@/redux/actions";

export function PermissionList() {
  const dispatch = useDispatch();
  const { list: permissions, loading } = useSelector(state => state.permissions);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    name: ""
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  // 獲取現有的分類列表
  const existingCategories = [...new Set(permissions.map(item => item.category))];

  // 初始化數據
  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  // 打開新增對話框
  const handleOpenDialog = () => {
    setFormData({
      category: "",
      name: ""
    });
    setIsNewCategory(false);
    setOpenDialog(true);
  };

  // 處理分類選擇或輸入
  const handleCategoryChange = (value) => {
    console.log('Selected Category:', value);
    console.log('Current formData before change:', formData);

    if (value === "new") {
      setIsNewCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setIsNewCategory(false);
      setFormData({ ...formData, category: value });
    }

    console.log('Updated formData:', { ...formData, category: value });
  };

  // 處理表單提交
  const handleSubmit = async () => {
    try {
      if (!formData.category || !formData.name) {
        alert('請填寫所有必填欄位');
        return;
      }

      const response = await dispatch(createPermission(formData));
      if (response.success) {
        setOpenDialog(false);
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
      const response = await dispatch(deletePermission(id));
      if (!response.success) {
        alert(response.message);
      }
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="green" className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              權限項目列表
            </Typography>
            <Button
              className="flex items-center gap-3"
              color="white"
              size="sm"
              onClick={handleOpenDialog}
            >
              <PlusIcon strokeWidth={2} className="h-4 w-4" /> 新增權限
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <div className="grid gap-4 p-4">
            {permissions.map((category) => (
              <div key={category.category} className="border rounded-lg p-4">
                <Typography variant="h6" className="mb-4">
                  {category.category}
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  {category.permissions.map((permission) => (
                    <div 
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <Typography variant="h6" className="font-semibold text-blue-gray-600">
                        {permission.name}
                      </Typography>
                      <IconButton
                        variant="text"
                        color="orange"
                        onClick={() => handleDelete(permission.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 新增權限對話框 */}
      <Dialog open={openDialog} handler={() => setOpenDialog(false)}>
        <DialogHeader>新增權限</DialogHeader>
        <DialogBody divider>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              {!isNewCategory ? (
                <Select
                  label="選擇分類"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  selected={(element) => (
                    <div className="flex items-center gap-2">
                      {formData.category}
                    </div>
                  )}
                >
                  {existingCategories.map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                  <Option value="new">+ 新增分類</Option>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    label="新分類名稱"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                  <IconButton
                    variant="text"
                    color="blue-gray"
                    onClick={() => setIsNewCategory(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </IconButton>
                </div>
              )}
            </div>
            <Input
              label="權限名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
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
    </div>
  );
}

export default PermissionList; 