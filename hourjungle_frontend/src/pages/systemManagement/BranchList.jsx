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
  Spinner,
  Switch,
} from "@material-tailwind/react";
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { 
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/redux/actions";

export function BranchList() {
  const dispatch = useDispatch();
  
  const branches = useSelector(state => state.branches?.list || []);
  const loading = useSelector(state => state.branches?.loading);

  useEffect(() => {
    console.log('Fetching branches...');
    dispatch(fetchBranches());
  }, [dispatch]);

  useEffect(() => {
    console.log('Current branches data:', branches);
  }, [branches]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    status: 1,
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    manager: "",
    manager_phone: "",
    manager_email: "",
    description: "",
    remarks: ""
  });

  const handleOpenDialog = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        status: parseInt(branch.status),
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        website: branch.website || '',
        logo: branch.logo || '',
        manager: branch.manager || '',
        manager_phone: branch.manager_phone || '',
        manager_email: branch.manager_email || '',
        description: branch.description || '',
        remarks: branch.remarks || ''
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: "",
        status: 1,
        address: "",
        phone: "",
        email: "",
        website: "",
        logo: "",
        manager: "",
        manager_phone: "",
        manager_email: "",
        description: "",
        remarks: ""
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      let response;
      if (editingBranch) {
        const updateData = {
          id: editingBranch.id,
          name: formData.name,
          status: formData.status,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          manager: formData.manager,
          manager_phone: formData.manager_phone,
          manager_email: formData.manager_email,
          description: formData.description,
          remarks: formData.remarks
        };
        
        console.log('Submitting branch update with data:', updateData);
        
        response = await dispatch(updateBranch(updateData));
        
        console.log('Update response:', response);
      } else {
        response = await dispatch(createBranch(formData));
      }

      if (response.success) {
        setOpenDialog(false);
        dispatch(fetchBranches());
        alert(response.message || '操作成功');
      } else {
        alert(response.message || '操作失敗');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失敗：' + (error.message || '未知錯誤'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除嗎？')) {
      const response = await dispatch(deleteBranch(id));
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
              館別列表 ({branches?.length || 0})
            </Typography>
            <Button
              className="flex items-center gap-3"
              color="white"
              size="sm"
              onClick={() => handleOpenDialog()}
            >
              <PlusIcon strokeWidth={2} className="h-4 w-4" /> 新增館別
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {[
                  "館別名稱",
                  "地址",
                  "電話",
                  "負責人",
                  "負責人電話",
                  "電子郵件",
                  "狀態",
                  "建立時間",
                  "操作"
                ].map((el) => (
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
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <Typography className="flex justify-center items-center"><Spinner /></Typography>
                  </td>
                </tr>
              ) : branches && branches.length > 0 ? (
                branches.map((branch, key) => {
                  const className = `py-3 px-5 ${
                    key === branches.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={branch.id}>
                      <td className={className}>
                        <Typography variant="small" className="font-semibold text-blue-gray-900 ell">
                          {branch.name}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600 ell">
                          {branch.address || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600 ell">
                          {branch.phone || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600 ell">
                          {branch.manager || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600 ell">
                          {branch.manager_phone || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600 ell">
                          {branch.email || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={branch.status === 1 ? "green" : "blue-gray"}
                          value={branch.status === 1 ? "啟用" : "停用"}
                          className="py-0.5 px-2 text-[13px] font-medium text-center"
                        />
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-xs font-semibold text-blue-gray-600 ell">
                          {new Date(branch.created_at).toLocaleString()}
                        </Typography>
                      </td>
                      <td className={className}>
                        <div className="flex gap-2">
                          <IconButton
                            variant="text"
                            color="blue-gray"
                            onClick={() => handleOpenDialog(branch)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            variant="text"
                            color="red"
                            onClick={() => handleDelete(branch.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <Typography>尚無資料</Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Dialog open={openDialog} handler={() => setOpenDialog(false)}>
        <DialogHeader>{editingBranch ? '編輯館別' : '新增館別'}</DialogHeader>
        <DialogBody divider className="h-[30rem] sm:h-[35em] overflow-y-scroll">
          <div className="grid gap-6">
            <Input
              label="館別名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="地址"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="電話"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="電子郵件"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="網站"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              label="負責人"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            />
            <Input
              label="負責人電話"
              value={formData.manager_phone}
              onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
            />
            <Input
              label="負責人電子郵件"
              value={formData.manager_email}
              onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
            />
            <Input
              label="描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              label="備註"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch
                label="狀態"
                checked={parseInt(formData.status) === 1}
                onChange={(e) => {
                  console.log('Switch changed:', e.target.checked);
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.checked ? 1 : 0
                  }));
                }}
              />
              <Typography variant="small" color="gray">
                {parseInt(formData.status) === 1 ? '啟用' : '停用'}
              </Typography>
            </div>
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

export default BranchList;
  