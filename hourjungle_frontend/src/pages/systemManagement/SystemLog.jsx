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
  Select,
  Option,
  Spinner
} from "@material-tailwind/react";
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/solid";
import { 
  fetchSystemLog,
  fetchBranches,
} from "@/redux/actions";

// SQL 表格映射
const SQL_TABLE_MAP = {
  'customers': '客戶資料',
  'business_items': '商務項目',
  'projects': '專案合約',
  'branches': '分館資料',
  'members': '使用者',
  'roles': '角色權限',
  'permissions': '權限項目',
  'payment_histories': '繳費紀錄',
  'configs': '系統設定',
  'line_bots': 'Line機器人'
};

// SQL 動作映射
const SQL_ACTION_MAP = {
  'create': '新增',
  'update': '修改',
  'delete': '刪除'
};

// 搜尋用的映射
const SEARCH_TABLE_MAP = {
  '1': '客戶資料',
  '2': '商務項目',
  '3': '專案合約',
  '4': '分館資料',
  '5': '使用者',
  '6': '角色權限',
  '7': '權限項目',
  '8': '繳費紀錄',
  '9': '系統設定',
  '10': 'Line機器人'
};

const SEARCH_ACTION_MAP = {
  '1': '新增',
  '2': '修改',
  '3': '刪除'
};

export function SystemLog() {
  const dispatch = useDispatch();
  const { list: systemLogs, loading, error } = useSelector(state => {
    console.log('SystemLog Redux State:', state.systemLog);
    return state.systemLog;
  });
  const { list: branches } = useSelector(state => state.branches);
  const { user } = useSelector(state => state.auth);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    date: '',
    sql_table: '',
    sql_action: '',
    branch_id: user?.is_top_account ? '' : user?.branch_id,
    account: '',
    keyword: '',
    page: 1,
    per_page: 10
  });

  // 分頁相關 state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (user?.is_top_account) {
      dispatch(fetchBranches());
    }
    // Fetch all logs initially, filtering will be done by the API if needed
    const initialFilters = {};
    if (!user?.is_top_account && user?.branch_id) {
      initialFilters.branch_id = parseInt(user.branch_id);
    }
    dispatch(fetchSystemLog(initialFilters));
  }, [dispatch, user]);

  const handleSearch = () => {
    const searchFilters = { ...filters };
    
    // 處理日期 - 使用 start_day 和 end_day 參數
    if (searchFilters.date) {
      // 將日期轉換為 YYYY-MM-DD 格式
      const formattedDate = new Date(searchFilters.date).toISOString().split('T')[0];
      searchFilters.start_day = formattedDate;
      searchFilters.end_day = formattedDate;
      delete searchFilters.date; // 移除原本的 date 參數
    }

    // 處理資料表 - 直接使用數字
    if (searchFilters.sql_table) {
      searchFilters.sql_table = parseInt(searchFilters.sql_table);
    }

    // 處理動作 - 直接使用數字
    if (searchFilters.sql_action) {
      searchFilters.sql_action = parseInt(searchFilters.sql_action);
    }

    // 處理分館
    if (searchFilters.branch_id) {
      searchFilters.branch_id = parseInt(searchFilters.branch_id);
    }

    // 處理關鍵字
    if (searchFilters.keyword) {
      searchFilters.keyword = searchFilters.keyword;
    }

    // 非最高權限帳號強制帶入自己的 branch_id
    if (!user?.is_top_account) {
      searchFilters.branch_id = parseInt(user?.branch_id);
    }
    
    // 只保留有值的搜尋條件
    const finalFilters = {};
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        finalFilters[key] = value;
      }
    });
    
    dispatch(fetchSystemLog(finalFilters));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 計算分頁數據
  const getPaginatedData = () => {
    if (!systemLogs) return [];
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return systemLogs.slice(startIndex, endIndex);
  };

  // 處理每頁顯示數量變更
  const handlePerPageChange = (value) => {
    setPerPage(parseInt(value));
    setCurrentPage(1); // 重置到第一頁
  };

  // 處理頁碼變更
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 計算總頁數
  const totalPages = systemLogs ? Math.ceil(systemLogs.length / perPage) : 0;

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="green" className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              系統日誌
            </Typography>
          </div>
        </CardHeader>

        {/* 搜尋條件區域 */}
        <div className="px-6 py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="date"
            label="日期"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            icon={<CalendarDaysIcon className="h-5 w-5" />}
          />
          <Select
            label="資料表"
            value={filters.sql_table}
            onChange={(value) => handleFilterChange('sql_table', value)}
          >
            {Object.entries(SEARCH_TABLE_MAP).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          <Select
            label="動作"
            value={filters.sql_action}
            onChange={(value) => handleFilterChange('sql_action', value)}
          >
            {Object.entries(SEARCH_ACTION_MAP).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          {user?.is_top_account && (
            <Select
              label="分館"
              value={filters.branch_id}
              onChange={(value) => handleFilterChange('branch_id', value)}
            >
              {branches.map(branch => (
                <Option key={branch.id} value={branch.id.toString()}>{branch.name}</Option>
              ))}
            </Select>
          )}
          <Input
            label="搜尋關鍵字"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
          <div className="col-span-full flex justify-end">
            <Button color="green" onClick={handleSearch}>
              搜尋
            </Button>
          </div>
        </div>

        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          {/* 每頁顯示數量選擇器 */}
          <div className="px-6 py-3 flex justify-end items-center gap-4">
            <Typography variant="small" color="blue-gray">
              每頁顯示：
            </Typography>
            <Select
              value={perPage.toString()}
              onChange={handlePerPageChange}
              
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>
          </div>

          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {[
                  "日期時間",
                  "動作",
                  "描述",
                  "資料表",
                  "使用者帳號",
                  "使用者暱稱",
                  "分館名稱",
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
                  <td colSpan="7" className="text-center py-4">
                    <Spinner className="h-8 w-8 mx-auto" />
                  </td>
                </tr>
              ) : systemLogs && Array.isArray(systemLogs) && systemLogs.length > 0 ? (
                getPaginatedData().map((log, key) => {
                  const className = `py-3 px-5 ${
                    key === systemLogs.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  return (
                    <tr key={log.id}>
                      <td className={className}>
                        <Typography variant="small" className="ell">
                          {new Date(log.created_at).toLocaleString('zh-TW')}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="ell">
                          {log.sql_action === 'create' && (
                            <div className="w-fit px-2 py-1 rounded-full bg-green-100 text-green-800">
                              {SQL_ACTION_MAP[log.sql_action] || log.sql_action}
                            </div>
                          )}
                          {log.sql_action === 'update' && (
                            <div className="w-fit px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              {SQL_ACTION_MAP[log.sql_action] || log.sql_action}
                            </div>
                          )}
                          {log.sql_action === 'delete' && (
                            <div className="w-fit px-2 py-1 rounded-full bg-red-100 text-red-800">
                              {SQL_ACTION_MAP[log.sql_action] || log.sql_action}
                            </div>
                          )}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="ell">
                          {log.description}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="ell">
                          {SQL_TABLE_MAP[log.sql_table] || log.sql_table}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="">
                          {log.member_account}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600">
                          {log.member_nickname}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography variant="small" className="text-blue-gray-600 ell">
                          {log.branch_name}
                        </Typography>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <Typography>尚無資料</Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 分頁控制器 */}
          <div className="px-6 py-3 flex justify-center items-center gap-4">
            <IconButton
              variant="text"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </IconButton>
            <Typography color="gray" className="font-normal">
              第 <strong>{currentPage}</strong> 頁，
              共 <strong>{totalPages}</strong> 頁
            </Typography>
            <IconButton
              variant="text"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </IconButton>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default SystemLog;
  