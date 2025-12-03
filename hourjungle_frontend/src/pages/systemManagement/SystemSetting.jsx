import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Input,
    Textarea,
    Button,
    Spinner,
    IconButton,
    Popover,
    PopoverHandler,
    PopoverContent
} from "@material-tailwind/react";
import { PencilIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { 
  fetchBranches, 
  fetchConfig, 
  updateConfig,
  sendLineMessage,
  broadcastLineMessage,
  sendMessageToUser,
  handleWebhook,
  fetchLineBotList,
  fetchBusinessItemList,
  updateLineBot
} from "@/redux/actions";

export function SystemSetting() {
  const dispatch = useDispatch();
  const { list: branches, loading: branchesLoading } = useSelector(state => state.branches);
  const { data: configData, loading: configLoading } = useSelector(state => state.config);
  const { list: lineBots, loading: lineBotsLoading } = useSelector(state => state.lineBot);
  const user = useSelector(state => state.auth.user) || {};
  
  const [systemSettings, setSystemSettings] = useState({
    overdue_days: "",
    penalty_fee: "",
    late_fee: "",
    hash_key: "",
    hash_iv: "",
    validate: "",
    callback_url: "",
    line_webhook_url: ""
  });

  const [lineSettings, setLineSettings] = useState({});
  const [isEdited, setIsEdited] = useState({
    system: false,
    line: {}
  });

  // 添加编辑模式状态
  const [editMode, setEditMode] = useState({});

  // 获取分馆和系统配置数据
  useEffect(() => {
    // 不管是否是最高权限都要获取分馆数据
    dispatch(fetchBranches());
    dispatch(fetchLineBotList());
    dispatch(fetchBusinessItemList());
    dispatch(fetchConfig());
  }, [dispatch]);

  // 修改过滤分馆的 useMemo
  const filteredBranches = useMemo(() => {
    // 添加调试日志
    console.log('Current user:', user);
    console.log('All branches:', branches);
    
    if (!branches || branches.length === 0) {
      console.log('No branches available');
      return [];
    }
    
    if (user.is_top_account === 1) {
      console.log('Top account, showing all branches');
      return branches;
    }
    
    // 非最高权限只显示自己的分馆
    const filtered = branches.filter(branch => Number(branch.id) === Number(user.branch_id));
    console.log('Filtered branches:', filtered);
    return filtered;
  }, [branches, user]);

  // 当配置数据加载完成后设置系统设置
  useEffect(() => {
    if (configData) {
      setSystemSettings({
        overdue_days: configData.overdue_days || "",
        penalty_fee: configData.penalty_fee || "",
        late_fee: configData.late_fee || "",
        hash_key: configData.hash_key || "",
        hash_iv: configData.hash_iv || "",
        validate: configData.validate || "",
        callback_url: configData.callback_url || "",
        line_webhook_url: configData.line_webhook_url || ""
      });
    }
  }, [configData]);

  // 初始化每个分馆的LINE设置
  useEffect(() => {
    const initialLineSettings = {};
    const initialEditState = { system: false, line: {} };
    
    branches.forEach(branch => {
      initialLineSettings[branch.id] = {
        id: branch.id,
        channel_secret: "",
        channel_token: "",
        liff_id: "",
        payment_notice: "",
        renewql_notice: "",
        line_webhook_url: ""
      };
      initialEditState.line[branch.id] = false;
    });
    
    setLineSettings(initialLineSettings);
    setIsEdited(initialEditState);
  }, [branches]);

  // 初始化时设置所有分馆为查看模式
  useEffect(() => {
    const initialEditMode = {};
    branches.forEach(branch => {
      initialEditMode[branch.id] = false;
    });
    setEditMode(initialEditMode);
  }, [branches]);

  // 当获取到 LINE Bot 列表数据时，更新 lineSettings
  useEffect(() => {
    if (lineBots.length > 0) {
      const newLineSettings = {};
      lineBots.forEach(bot => {
        newLineSettings[bot.branch_id] = {
          id: bot.id,
          channel_secret: bot.channel_secret || '',
          channel_token: bot.channel_token || '',
          liff_id: bot.liff_id || '',
          payment_notice: bot.payment_notice || '',
          renewql_notice: bot.renewql_notice || ''
        };
      });
      setLineSettings(newLineSettings);
    }
  }, [lineBots]);

  // 处理系统设置变更
  const handleSystemChange = (field, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setIsEdited(prev => ({
      ...prev,
      system: true
    }));
  };

  // 处理LINE设置变更
  const handleLineChange = (branchId, field, value) => {
    setLineSettings(prev => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [field]: value
      }
    }));
    setIsEdited(prev => ({
      ...prev,
      line: {
        ...prev.line,
        [branchId]: true
      }
    }));
  };

  // 处理系统设置保存
  const handleSystemSave = async () => {
    if (window.confirm('確定要保存系統設置的更改嗎？')) {
      const result = await dispatch(updateConfig(systemSettings));
      if (result.success) {
        setIsEdited(prev => ({
          ...prev,
          system: false
        }));
      }
    }
  };

  // 处理LINE设置保存
  const handleLineSave = async (branchId) => {
    if (window.confirm('確定要保存LINE設置的更改嗎？')) {
      const result = await dispatch(updateLineBot({
        branch_id: branchId,
        ...lineSettings[branchId]
      }));
      
      if (result.success) {
        setIsEdited(prev => ({
          ...prev,
          line: {
            ...prev.line,
            [branchId]: false
          }
        }));
        alert('保存成功');
      } else {
        alert('保存失败: ' + result.message);
      }
    }
  };

  // 发送测试消息 - 使用 send-line-message API
  const handleSendTestMessage = async (branchId, userId) => {
    try {
      const result = await dispatch(sendLineMessage(userId, "這是一條測試消息"));
      if (result.success) {
        alert('測試消息發送成功');
      } else {
        alert('測試消息發送失敗: ' + result.message);
      }
    } catch (error) {
      alert('發送消息時出錯: ' + error.message);
    }
  };

  // 发送单条消息 - 使用 send-message API
  const handleSendSingleMessage = async (branchId, userId) => {
    try {
      const result = await dispatch(sendMessageToUser(userId, "這是一條單獨發送的消息"));
      if (result.success) {
        alert('消息發送成功');
      } else {
        alert('消息發送失敗: ' + result.message);
      }
    } catch (error) {
      alert('發送消息時出錯: ' + error.message);
    }
  };

  // 发送广播消息 - 使用 broadcast API
  const handleBroadcast = async (branchId) => {
    try {
      const result = await dispatch(broadcastLineMessage("這是一條廣播消息"));
      if (result.success) {
        alert('廣播消息發送成功');
      } else {
        alert('廣播消息發送失敗: ' + result.message);
      }
    } catch (error) {
      alert('發送廣播消息時出錯: ' + error.message);
    }
  };

  // webhook 处理 - 通常在路由或专门的webhook处理组件中使用
  const handleWebhookEvent = async (webhookData) => {
    try {
      const result = await dispatch(handleWebhook(webhookData));
      if (result.success) {
        console.log('Webhook處理成功');
      } else {
        console.error('Webhook處理失敗:', result.message);
      }
    } catch (error) {
      console.error('Webhook處理錯誤:', error);
    }
  };

  // 切换编辑模式
  const toggleEditMode = (branchId) => {
    setEditMode(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
    
    // 如果从编辑模式切换到查看模式，重置更改
    if (editMode[branchId]) {
      const currentBot = lineBots.find(bot => bot.branch_id === branchId);
      if (currentBot) {
        setLineSettings(prev => ({
          ...prev,
          [branchId]: {
            id: currentBot.id,
            channel_secret: currentBot.channel_secret || '',
            channel_token: currentBot.channel_token || '',
            liff_id: currentBot.liff_id || '',
            payment_notice: currentBot.payment_notice || '',
            renewql_notice: currentBot.renewql_notice || ''
          }
        }));
      }
      // 重置编辑状态
      setIsEdited(prev => ({
        ...prev,
        line: {
          ...prev.line,
          [branchId]: false
        }
      }));
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      {/* 系统设置卡片 - 只有最高权限可以看到 */}
      {user.is_top_account === 1 && (
        <Card>
          <CardHeader variant="gradient" color="white" className=" p-6">
            <Typography variant="h6" color="green">
              系統設置
            </Typography>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configLoading ? (
              // 显示加载动画
              <div className="flex justify-center items-center min-h-[200px] md:col-span-2">
                <Spinner className="h-12 w-12" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Typography variant="h6" color="blue-gray">逾期通知天數</Typography>
                  <Input
                    value={systemSettings.overdue_days}
                    onChange={(e) => handleSystemChange('overdue_days', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Typography variant="h6" color="blue-gray">違約金</Typography>
                  <Input
                    value={systemSettings.penalty_fee}
                    onChange={(e) => handleSystemChange('penalty_fee', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Typography variant="h6" color="blue-gray">滯納金(%)</Typography>
                  <Input
                    value={systemSettings.late_fee}
                    onChange={(e) => handleSystemChange('late_fee', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Typography variant="h6" color="blue-gray">HashKey</Typography>
                  <Input
                    value={systemSettings.hash_key}
                    onChange={(e) => handleSystemChange('hash_key', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Typography variant="h6" color="blue-gray">HashIV</Typography>
                  <Input
                    value={systemSettings.hash_iv}
                    onChange={(e) => handleSystemChange('hash_iv', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Typography variant="h6" color="blue-gray">Validate</Typography>
                  <Input
                    value={systemSettings.validate}
                    onChange={(e) => handleSystemChange('validate', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Typography variant="h6" color="blue-gray">Callback URL</Typography>
                  <Input
                    value={systemSettings.callback_url}
                    onChange={(e) => handleSystemChange('callback_url', e.target.value)}
                    size="lg"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Typography variant="h6" color="blue-gray">Webhook URL</Typography>
                  <div className="flex gap-2">
                    <Input
                      value={systemSettings.line_webhook_url}
                      onChange={(e) => handleSystemChange('line_webhook_url', e.target.value)}
                      size="lg" 
                      disabled
                    />
                    <IconButton
                      variant="text"
                      color="blue-gray"
                      onClick={() => {
                        navigator.clipboard.writeText(systemSettings.line_webhook_url);
                        alert('已複製到剪貼簿');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                    </IconButton>
                  </div>
                </div>
                <div className="flex justify-end gap-4 md:col-span-2">
                  <Button
                    variant="text"
                    color="red"
                    onClick={() => setIsEdited(prev => ({ ...prev, system: false }))}
                    disabled={!isEdited.system}
                  >
                    取消
                  </Button>
                  <Button
                    variant="gradient"
                    color="green"
                    onClick={handleSystemSave}
                    disabled={!isEdited.system}
                  >
                    保存
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* LINE设置卡片 - 按分馆显示 */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        {branchesLoading ? (
          // 如果正在加載分馆列表，显示加载动画
          <div className="col-span-3 flex justify-center items-center min-h-[200px]">
            <Spinner className="h-12 w-12" />
          </div>
        ) : filteredBranches.length === 0 ? (
          // 如果过滤后没有分馆，显示提示信息
          <div className="col-span-3 flex justify-center items-center min-h-[200px]">
            <Typography variant="h6" color="blue-gray">
              您沒有權限訪問任何分館設置
            </Typography>
          </div>
        ) : (
          // 显示有权限的分馆设置
          filteredBranches.map(branch => (
            <Card key={branch.id} className="mb-8">
              <CardHeader variant="gradient" color="white" className=" p-4 flex justify-between items-center">
                <Typography variant="h6" color="green">
                  {branch.name} LINE Bot設置
                </Typography>
                <IconButton
                  variant="text"
                  color="green"
                  onClick={() => toggleEditMode(branch.id)}
                >
                  {editMode[branch.id] ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <PencilIcon className="h-5 w-5" />
                  )}
                </IconButton>
              </CardHeader>
              <CardBody className="flex flex-col gap-6">

                {lineBotsLoading ? (
                  // 正在加載 LINE Bot 資料
                  <div className="flex justify-center items-center min-h-[200px]">
                    <Spinner className="h-12 w-12" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4">
                      <Typography variant="h6" color="blue-gray">LINE Bot設置</Typography>
                      {editMode[branch.id] ? (
                        // 编辑模式
                        <>
                          <Input
                            label="Channel Token"
                            value={lineSettings[branch.id]?.channel_token || ''}
                            onChange={(e) => handleLineChange(branch.id, 'channel_token', e.target.value)}
                            size="lg"
                          />
                          <Input
                            label="Channel Secret"
                            value={lineSettings[branch.id]?.channel_secret || ''}
                            onChange={(e) => handleLineChange(branch.id, 'channel_secret', e.target.value)}
                            size="lg"
                          />
                          <Input
                            label="LIFF ID"
                            value={lineSettings[branch.id]?.liff_id || ''}
                            onChange={(e) => handleLineChange(branch.id, 'liff_id', e.target.value)}
                            size="lg"
                          />
                          <Textarea
                            label="付款通知訊息"
                            value={lineSettings[branch.id]?.payment_notice || ''}
                            onChange={(e) => handleLineChange(branch.id, 'payment_notice', e.target.value)}
                            rows={4}
                          />
                          <Textarea
                            label="續約通知訊息"
                            value={lineSettings[branch.id]?.renewql_notice || ''}
                            onChange={(e) => handleLineChange(branch.id, 'renewql_notice', e.target.value)}
                            rows={4}
                          />
                        </>
                      ) : (
                        // 查看模式
                        <>
                          <div className="flex flex-col gap-2">
                            <Typography variant="small" color="blue-gray">Channel Token:</Typography>
                            <Typography variant="small" className="px-4 py-2 border-1 border-gray-300 rounded-md">{lineSettings[branch.id]?.channel_token || '-'}</Typography>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Typography variant="small" color="blue-gray">Channel Secret:</Typography>
                            <Typography variant="small" className="px-4 py-2 border-1 border-gray-300 rounded-md">{lineSettings[branch.id]?.channel_secret || '-'}</Typography>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Typography variant="small" color="blue-gray">LIFF ID:</Typography>
                            <Typography variant="small" className="px-4 py-2 border-1 border-gray-300 rounded-md">{lineSettings[branch.id]?.liff_id || '-'}</Typography>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Typography variant="small" color="blue-gray">付款通知訊息:</Typography>
                            <Typography variant="small" className="px-4 py-2 border-1 border-gray-300 rounded-md whitespace-pre-line">{lineSettings[branch.id]?.payment_notice || '-'}</Typography>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Typography variant="small" color="blue-gray">續約通知訊息:</Typography>
                            <Typography variant="small" className="px-4 py-2 border-1 border-gray-300 rounded-md whitespace-pre-line">{lineSettings[branch.id]?.renewql_notice || '-'}</Typography>
                          </div>
                         
                        </>
                      )}
                    </div>
                    
                    {/* LINE Bot功能测试按钮 */}
                    <div className="flex gap-4">
                     
                      <Button
                        variant="outlined"
                        color="green"
                        onClick={() => handleBroadcast(branch.id)}
                      >
                        發送廣播消息
                      </Button>

                      <Popover placement="bottom-start">
                            <PopoverHandler>
                              <Button variant="text" className="w-32">訊息範例</Button>
                            </PopoverHandler>
                            <PopoverContent>
                              <div className="flex flex-col gap-4">
                                <div>
                                  <Typography variant="h6" color="blue-gray">繳款通知</Typography>
                                  <div className="flex items-center gap-2">
                                    <Typography className="px-4" variant="small" color="red">
                                      * 客戶名稱 [name] 下次繳費日 [next_pay_day] 專案名稱 [project_name] 應繳金額 [amount]
                                    </Typography>
                                    <IconButton
                                      variant="text"
                                      color="blue-gray"
                                      onClick={() => {
                                        navigator.clipboard.writeText("客戶名稱 [name] 下次繳費日 [next_pay_day] 專案名稱 [project_name] 應繳金額 [amount]");
                                        alert('已複製到剪貼簿');
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                      </svg>
                                    </IconButton>
                                  </div>
                                </div>
                                <div>
                                  <Typography variant="h6" color="blue-gray">續約通知</Typography>
                                  <div className="flex items-center gap-2">
                                    <Typography className="px-4" variant="small" color="red">
                                      * 客戶名稱 [name] 到時日期 [end_day] 專案名稱 [project_name]
                                    </Typography>
                                    <IconButton
                                      variant="text"
                                      color="blue-gray"
                                      onClick={() => {
                                        navigator.clipboard.writeText("客戶名稱 [name] 到時日期 [end_day] 專案名稱 [project_name]");
                                        alert('已複製到剪貼簿');
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                      </svg>
                                    </IconButton>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                    </div>

                    {/* 只在编辑模式下显示保存按钮 */}
                    {editMode[branch.id] && (
                      <div className="flex justify-end gap-4">
                        <Button
                          variant="gradient"
                          color="green"
                          onClick={() => handleLineSave(branch.id)}
                          disabled={!isEdited.line[branch.id]}
                        >
                          保存
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default SystemSetting;
  