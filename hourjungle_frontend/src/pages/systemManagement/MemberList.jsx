import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Avatar,
    Chip,
    Button,
    IconButton,
    Input,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
  } from "@material-tailwind/react";
import { 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon
} from "@heroicons/react/24/solid";
import { fetchMembers, createMember, updateMember, deleteMember, fetchRoles, fetchBranches } from "@/redux/actions";

export function MemberList() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth); // 獲取當前登入用戶資訊
  const { 
    list: members = [], 
    loading, 
    pagination = { current_page: 1, per_page: 10, total: 0 } 
  } = useSelector(state => state.members);
  
  const { list: roles = [] } = useSelector(state => state.roles);
  const { list: branches = [] } = useSelector(state => state.branches);
  
  // 狀態管理
  const [searchKeyword, setSearchKeyword] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    account: "",
    nickname: "",
    password: "",
    email: "",
    phone: "",
    role_id: "",
    branch_id: "",
    status: 1
  });

  // 過濾後的管理員列表
  const filteredMembers = members.filter(member => {
    // 如果是最高權限帳號，顯示所有管理員
    if (user?.is_top_account === 1) {
      return true;
    }
    // 否則只顯示同一個館別的管理員
    return member.branch_id === user?.branch_id;
  });

  // 修改初始化數據的 useEffect
  useEffect(() => {
    // 如果是最高權限帳號，獲取所有管理員
    if (user?.is_top_account === 1) {
      dispatch(fetchMembers());
    } else {
      // 否則只獲取該館別的管理員
      dispatch(fetchMembers({ branch_id: user?.branch_id }));
    }
    dispatch(fetchRoles());
    dispatch(fetchBranches());
  }, [dispatch, user]);

  // 修改搜索處理函數
  const handleSearch = () => {
    const params = {
      page: 1,
      per_page: pagination.per_page,
      keyword: searchKeyword
    };

    // 如果不是最高權限帳號，添加館別過濾
    if (user?.is_top_account !== 1) {
      params.branch_id = user?.branch_id;
    }

    dispatch(fetchMembers(params));
  };

  // 修改分頁處理函數
  const handlePageChange = (page) => {
    const params = {
      page,
      per_page: pagination.per_page,
      keyword: searchKeyword
    };

    // 如果不是最高權限帳號，添加館別過濾
    if (user?.is_top_account !== 1) {
      params.branch_id = user?.branch_id;
    }

    dispatch(fetchMembers(params));
  };

  // 打開新增對話框
  const handleOpenAddDialog = () => {
    setFormData({
      account: "",
      nickname: "",
      password: "",
      email: "",
      phone: "",
      role_id: "",
      branch_id: "",
      status: 1
    });
    setOpenAddDialog(true);
  };

  // 打開編輯對話框
  const handleOpenEditDialog = (member) => {
    console.log('Editing member:', member);
    setEditingMember(member);
    setFormData({
      account: member.account || '',
      nickname: member.nickname || '',
      password: '', // 密码保持为空
      email: member.email || '',
      phone: member.phone || '',
      role_id: member.role_id || '',
      branch_id: member.branch_id || '',
      status: member.status
    });
    setOpenEditDialog(true);
  };

  // 修改新增管理員處理
  const handleSubmit = async () => {
    try {
      // 驗證表單
      if (!formData.account || !formData.nickname || !formData.password || !formData.role_id) {
        alert('請填寫所有必填欄位');
        return;
      }

      // 如果不是最高權限帳號，強制使用當前用戶的館別
      const submitData = {
        ...formData,
        branch_id: user?.is_top_account === 1 ? formData.branch_id : user?.branch_id
      };

      let response;
      if (editingMember) {
        response = await dispatch(updateMember({
          ...submitData,
          id: editingMember.id
        }));
      } else {
        response = await dispatch(createMember(submitData));
      }

      if (response.success) {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        handleSearch(); // 重新獲取列表
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.message || '操作失敗');
    }
  };

  // 處理刪除
  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除嗎？')) {
      const response = await dispatch(deleteMember(id));
      if (response.success) {
        dispatch(fetchMembers({
          page: pagination.current_page,
          per_page: pagination.per_page,
          keyword: searchKeyword
        }));
      } else {
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
              管理員列表
            </Typography>
            <Button
              className="flex items-center gap-3"
              color="white"
              size="sm"
              onClick={handleOpenAddDialog}
            >
              <UserPlusIcon strokeWidth={2} className="h-4 w-4" /> 新增管理員
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <div className="flex justify-between items-center p-4">
            <div className="w-72 flex items-center gap-2">
              <Input
                label="搜尋"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                icon={<MagnifyingGlassIcon className="h-5 w-5" onClick={handleSearch} />}
              />
            </div>
          </div>
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["帳號", "暱稱", "群組", "場館", "狀態", "最後登入", "操作"].map((el) => (
                  <th
                    key={el}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                  >
                    <Typography
                      variant="small"
                      className="text-[11px] font-bold uppercase text-blue-gray-400"
                    >
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredMembers) && filteredMembers.map(
                (member, key) => {
                  const className = `py-3 px-5 ${
                    key === filteredMembers.length - 1 ? "" : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={member.id}>
                      <td className={className}>
                        <Typography variant="small" className="font-semibold text-blue-gray-600 ell">
                          {member.account || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="font-semibold text-blue-gray-600 ell">
                          {member.nickname || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="font-semibold text-blue-gray-600 ell">
                          {member.roles || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="font-semibold text-blue-gray-600 ell">
                          {member.branch || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={member.status === 1 ? "green" : "blue-gray"}
                          value={member.status === 1 ? "啟用" : "停用"}
                          className="py-0.5 px-2 text-[13px] font-medium text-center md:w-3/4 ell"
                        />
                      </td>
                      <td className={className}>
                        <Typography className="text-sm font-semibold text-blue-gray-600 ell">
                          {member.last_login || '-'}
                        </Typography>
                      </td>
                      <td className={className}>
                        <div className="flex gap-2">
                          <IconButton
                            variant="text"
                            color="blue-gray"
                            onClick={() => handleOpenEditDialog(member)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            variant="text"
                            color="orange"
                            onClick={() => handleDelete(member.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* 新增管理員對話框 */}
      <Dialog open={openAddDialog} handler={() => setOpenAddDialog(false)}>
        <DialogHeader>新增管理員</DialogHeader>
        <DialogBody divider className="h-[30rem] sm:h-[35em] overflow-y-scroll">
          <div className="grid gap-6">
            <Input
              label="帳號"
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
            />
            <Input
              label="暱稱"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
            <Input
              type="password"
              label="密碼"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="電子郵件"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="手機號碼"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <select
              className="border border-blue-gray-200 rounded-lg p-2"
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
            >
              <option value="">選擇群組</option>
              {(roles || []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {/* 只有最高權限帳號可以選擇館別 */}
            {user?.is_top_account === 1 ? (
              <select
                className="border border-blue-gray-200 rounded-lg p-2"
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              >
                <option value="">選擇場館</option>
                {(branches || []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : null}
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
            onClick={() => setOpenAddDialog(false)}
            className="mr-1"
          >
            取消
          </Button>
          <Button variant="gradient" color="green" onClick={handleSubmit}>
            確定
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 編輯管理員對話框 */}
      <Dialog open={openEditDialog} handler={() => setOpenEditDialog(false)}>
        <DialogHeader>編輯管理員</DialogHeader>
        <DialogBody divider>
          <div className="grid gap-6">
            <Input
              label="帳號"
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              disabled
            />
            <Input
              label="暱稱"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
            <Input
              type="password"
              label="密碼"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="電子郵件"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="手機號碼"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <select
              className="border border-blue-gray-200 rounded-lg p-2"
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
            >
              <option value="">選擇群組</option>
              {(roles || []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select
              className="border border-blue-gray-200 rounded-lg p-2"
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
            >
              <option value="">選擇場館</option>
              {(branches || []).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
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
            onClick={() => setOpenEditDialog(false)}
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

export default MemberList;
  