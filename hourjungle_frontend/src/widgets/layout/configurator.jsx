import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Switch,
  Typography,
  Chip,
  Tabs,
  TabsHeader,
  Tab,
  Input,
  Textarea,
  Select,
  Option,
  Card,
} from "@material-tailwind/react";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
} from "@/context";

// 添加社交媒体图标和其他图标
import { 
  FaFacebookMessenger, 
  FaLine, 
  FaShopify,
  FaRobot,
  FaUserEdit,
  FaDatabase,
  FaPlus,
  FaThumbsUp,
  FaThumbsDown,
  FaPaperPlane,
  FaLightbulb
} from 'react-icons/fa';

export function Configurator() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openConfigurator } = controller;
  const [message, setMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState('messenger');
  const [activeChat, setActiveChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const [testQuery, setTestQuery] = useState("");
  
  // 训练模式相关状态
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' 或 'training'
  const [trainingQuestion, setTrainingQuestion] = useState("");
  const [trainingAnswer, setTrainingAnswer] = useState("");
  const [trainingCategory, setTrainingCategory] = useState("产品功能");
  const [trainingHistory, setTrainingHistory] = useState([]);
  const trainingContainerRef = useRef(null);

  // 渠道配置
  const channels = [
    { 
      id: 'messenger', 
      icon: FaFacebookMessenger, 
      name: 'Messenger',
      colors: {
        default: 'text-[#0084FF] border-[#0084FF]',
        active: 'bg-[#0084FF] border-[#0084FF]',
        hover: 'hover:border-[#0084FF] hover:text-[#0084FF]'
      }
    },
    { 
      id: 'line', 
      icon: FaLine, 
      name: 'LINE',
      colors: {
        default: 'text-[#00B900] border-[#00B900]',
        active: 'bg-[#00B900] border-[#00B900]',
        hover: 'hover:border-[#00B900] hover:text-[#00B900]'
      }
    },
    { 
      id: 'shopee', 
      icon: FaShopify, 
      name: 'Shopee',
      colors: {
        default: 'text-[#EE4D2D] border-[#EE4D2D]',
        active: 'bg-[#EE4D2D] border-[#EE4D2D]',
        hover: 'hover:border-[#EE4D2D] hover:text-[#EE4D2D]'
      }
    },
  ];

  // 训练类别选项
  const categoryOptions = [
    "辦公室租賃", 
    "租約相關", 
    "租金價格", 
    "優惠方案", 
    "合約條款", 
    "稅務諮詢", 
    "帳務處理", 
    "公司登記", 
    "行政服務",
    "設施管理",
    "其他服務"
  ];

  // 模拟的对话列表数据
  const chatList = [
    {
      id: 1,
      name: "張先生",
      lastMessage: "應如何辦理稅籍登記？",
      time: "14:30",
      unread: 2,
      channel: 'line'
    },
    {
      id: 4,
      name: "王小姐",
      lastMessage: "請問你們有提供那些空間設備？",
      time: "13:45",
      unread: 0,
      channel: 'messenger'
    },
    {
      id: 5,
      name: "王小姐",
      lastMessage: "有提供會議室租用服務嗎？",
      time: "13:45",
      unread: 0,
      channel: 'messenger'
    },
    {
      id: 6,
      name: "王小姐",
      lastMessage: "想請教營業登記的事宜，代辦費及月租金等等的問題，有無方案參考？",
      time: "13:45",
      unread: 0,
      channel: 'messenger'
    },
    {
      id: 2,
      name: "王小姐",
      lastMessage: "想了解一下公司登記的費用",
      time: "13:45",
      unread: 0,
      channel: 'messenger'
    },
    {
      id: 3,
      name: "李先生",
      lastMessage: "請問報稅的deadline是什麼時候？",
      time: "12:20",
      unread: 1,
      channel: 'shopee'
    },
  ];

  // 滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // 滚动到最新训练记录
  useEffect(() => {
    if (trainingContainerRef.current) {
      trainingContainerRef.current.scrollTop = trainingContainerRef.current.scrollHeight;
    }
  }, [trainingHistory]);

  // 当选择一个聊天时，加载历史记录
  useEffect(() => {
    if (activeChat) {
      // 这里可以从API加载真实的聊天历史
      // 现在我们模拟一些历史记录
      setChatHistory([
        { id: 1, content: activeChat.lastMessage, sender: "customer", timestamp: new Date().toISOString() },
      ]);
    }
  }, [activeChat]);

  // 渲染对话列表
  const renderChatList = () => (
    <Card className="flex-1 overflow-y-auto">
      {chatList
        .filter(chat => activeChannel === 'all' || chat.channel === activeChannel)
        .map((chat) => (
          <Card
            key={chat.id}
            className={`p-4 border m-1 cursor-pointer hover:bg-gray-50 transition-colors ${
              activeChat?.id === chat.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => setActiveChat(chat)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 用户头像 */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {chat.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Typography className="font-medium">{chat.name}</Typography>
                    {/* 渠道图标 */}
                    {(() => {
                      const channel = channels.find(c => c.id === chat.channel);
                      if (channel) {
                        const IconComponent = channel.icon;
                        return (
                          <IconComponent 
                            className="w-4 h-4"
                            style={{ 
                              color: channel.colors.default.split(' ')[0].replace('text-[', '').replace(']', '') 
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <Typography variant="small" className="text-gray-600 truncate">
                    {chat.lastMessage}
                  </Typography>
                </div>
              </div>
              <div className="text-right">
                <Typography variant="small" className="text-gray-500">
                  {chat.time}
                </Typography>
                {chat.unread > 0 && (
                  <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
    </Card>
  );

  // 渲染对话界面
  const renderChatWindow = () => (
    <div className="flex flex-col h-full">
      {/* 对话头部 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={() => setActiveChat(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </IconButton>
            <Typography variant="h6">{activeChat.name}</Typography>
          </div>
        </div>
      </div>

      {/* 对话内容区域 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatHistory.map((msg, index) => (
          <div 
            key={msg.id || index} 
            className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
          >
            <div 
              className={`rounded-lg p-3 max-w-[80%] ${
                msg.sender === 'customer' 
                  ? 'bg-gray-200' 
                  : msg.sender === 'ai'
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
              }`}
            >
              <Typography>{msg.content}</Typography>
              {msg.sender === 'ai' && (
                <div className="flex mt-2 space-x-2 justify-end">
                  <Button 
                    size="sm" 
                    variant="text" 
                    color="white"
                    className="p-1 flex items-center gap-1"
                    onClick={() => handleFeedback(msg.id, 'good')}
                  >
                    <FaThumbsUp className="w-3 h-3" />
                    <span className="text-xs">有用</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="text" 
                    color="white"
                    className="p-1 flex items-center gap-1"
                    onClick={() => handleFeedback(msg.id, 'bad')}
                  >
                    <FaThumbsDown className="w-3 h-3" />
                    <span className="text-xs">改進</span>
                  </Button>
                </div>
              )}
              {msg.feedback && (
                <div className="mt-1 text-xs text-right">
                  {msg.feedback === 'good' ? '✓ 已標記為有用內容' : '✓ 已提交反饋'}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Input 
              label="測試 AI 回覆 (輸入後點擊 AI 助手)"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="bg-gray-100"
            />
          </div>
          
          <div className="relative">
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="輸入訊息..."
              className="pr-10 min-h-[300px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="sm"
              color="blue"
              className="!absolute right-1 bottom-1"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              <FaPaperPlane className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="blue"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => handleAIGenerate()}
              disabled={!testQuery.trim() || isLoading}
            >
              <FaRobot className="h-4 w-4" />
              <span>AI助手</span>
            </Button>
            <Button
              variant="outlined"
              color="green"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleLearnFromMessage}
              disabled={!message.trim() || isLoading}
            >
              <FaLightbulb className="h-4 w-4" />
              <span>添加到知识库</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染训练界面
  const renderTrainingInterface = () => (
    <div className="flex flex-col h-full">
      {/* 训练界面头部 */}
      <div className="border-b bg-gray-50 p-2">
        <Typography variant="h6" className="text-center">AI 訓練模式</Typography>
        <Typography variant="small" className="text-center text-gray-600">
          添加問答到知識庫，提高AI回復質量
        </Typography>
      </div>

      {/* 训练历史记录 */}
      <div 
        ref={trainingContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {trainingHistory.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                Q
              </div>
              <Typography className="font-medium">問題</Typography>
              <Chip 
                size="sm" 
                variant="ghost" 
                value={item.category} 
                color="blue"
                className="ml-auto"
              />
            </div>
            <Typography className="pl-8 mb-4">{item.question}</Typography>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                A
              </div>
              <Typography className="font-medium">回答</Typography>
            </div>
            <Typography className="pl-8">{item.answer}</Typography>
          </div>
        ))}
      </div>

      {/* 训练输入区域 */}
      <div className="p-4 border-t">
        <div className="flex flex-col gap-4">
          <div>
            <Typography variant="small" className="mb-1 font-medium">問題類別</Typography>
            <Select 
              value={trainingCategory}
              onChange={(val) => setTrainingCategory(val)}
              label="選擇類別"
            >
              {categoryOptions.map((category) => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Typography variant="small" className="mb-1 font-medium">顧客問題</Typography>
            <Textarea
              value={trainingQuestion}
              onChange={(e) => setTrainingQuestion(e.target.value)}
              placeholder="輸入顧客可能會問的問題..."
              className="min-h-[80px]"
            />
          </div>
          
          <div>
            <Typography variant="small" className="mb-1 font-medium">標準回答</Typography>
            <Textarea
              value={trainingAnswer}
              onChange={(e) => setTrainingAnswer(e.target.value)}
              placeholder="輸入理想的回答問題..."
              className="min-h-[120px]"
            />
          </div>
          
          <Button
            color="green"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleAddTrainingPair}
            disabled={!trainingQuestion.trim() || !trainingAnswer.trim()}
          >
            <FaPlus className="h-4 w-4" />
            <span>添加到知識庫</span>
          </Button>
        </div>
      </div>
    </div>
  );

  // 发送用户消息
  function handleSendMessage() {
    if (!message.trim()) return;
    
    // 添加用户消息到聊天历史
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: "customer",
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // 清空输入框
    setMessage("");
  }

  // 生成AI回复
  async function handleAIGenerate() {
    try {
      setIsLoading(true);
      
      // 修改：優先使用測試查詢，若無則返回
      const queryMessage = testQuery.trim(); 
      if (!queryMessage) {
        console.warn("測試查詢為空，請輸入內容後再試。");
        setIsLoading(false); 
        return; // 如果測試輸入為空，則不執行
      }
      
      // 检查API地址是否正确
      const response = await fetch('http://localhost:8001/api/chat/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: queryMessage,
          role: 'customer',
          channel: activeChat.channel,
          customer_id: activeChat.id.toString(),
        }),
      });

      const data = await response.json();
      
      // 不直接添加到聊天历史，而是设置到输入框
      setMessage(data.response);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      // 显示错误消息在输入框中
      setMessage("抱歉，生成回覆時出現錯誤，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  }

  // 添加到知识库
  async function handleLearnFromMessage() {
    if (!message.trim()) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:8001/api/chat/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          metadata: {
            category: "新增用戶",
            channel: activeChat.channel,
            customer_id: activeChat.id.toString(),
            timestamp: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 添加系统消息
        setChatHistory(prev => [...prev, {
          id: Date.now(),
          content: "✅ 知識庫添加成功",
          sender: "system",
          timestamp: new Date().toISOString()
        }]);
        
        // 清空输入框
        setMessage("");
      }
      
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
      
      // 添加错误消息
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        content: "❌ 知識庫添加失敗",
        sender: "system",
        timestamp: new Date().toISOString(),
        isError: true
      }]);
      
    } finally {
      setIsLoading(false);
    }
  }

  // 处理用户反馈
  async function handleFeedback(messageId, feedback) {
    try {
      // 向后端发送反馈
      await fetch('http://localhost:8001/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          feedback: feedback,
          customer_id: activeChat.id.toString(),
        }),
      });
      
      // 更新UI显示反馈已提交
      setChatHistory(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? {...msg, feedback: feedback} 
            : msg
        )
      );
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }

  // 添加训练对
  async function handleAddTrainingPair() {
    if (!trainingQuestion.trim() || !trainingAnswer.trim()) return;
    
    try {
      // 添加到训练历史
      setTrainingHistory(prev => [...prev, {
        question: trainingQuestion,
        answer: trainingAnswer,
        category: trainingCategory,
        timestamp: new Date().toISOString()
      }]);
      
      const response = await fetch('http://localhost:8001/api/chat/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `問題: ${trainingQuestion}\n答案: ${trainingAnswer}`,
          metadata: {
            category: trainingCategory,
            type: "training",
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 清空输入
      setTrainingQuestion("");
      setTrainingAnswer("");
      
    } catch (error) {
      console.error('Error adding training pair:', error);
      // 更详细的错误提示
      alert(`添加訓練失敗：${error.message}`);
    }
  }

  return (
    <aside
      className={`fixed top-0 right-0 z-50 h-screen w-96 bg-white shadow-lg transition-transform duration-300 ${
        openConfigurator ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="flex items-start justify-between px-6 pt-8 pb-6">
        <div className="w-full">
          <Typography variant="h5" color="blue-gray" className="mb-4">
            智能客服系统
          </Typography>
          
          {/* 模式切换 */}
          <Tabs value={activeTab} className="mb-4">
            <TabsHeader>
              <Tab 
                value="chat" 
                onClick={() => setActiveTab('chat')}
                className="flex items-center justify-center gap-2"
              >
                <div className="flex items-center justify-center gap-2">
                <FaRobot className="w-4 h-4" />
                <span>客服模式</span>
                </div>
              </Tab>
              <Tab 
                value="training" 
                onClick={() => setActiveTab('training')}
                className="flex items-center justify-center gap-2"
              >
                <div className="flex items-center justify-center gap-2">
                <FaUserEdit className="w-4 h-4" />
                <span>訓練模式</span>
                </div>
              </Tab>
            </TabsHeader>
          </Tabs>
          
          {/* 社交媒体渠道选择器 (仅在聊天模式显示) */}
          {activeTab === 'chat' && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeChannel === 'all' ? "filled" : "outlined"}
                className={`h-[50px] flex items-center justify-center gap-1 flex-1 py-2 transition-all ${
                  activeChannel === 'all' 
                    ? `bg-gray-800 border-gray-800 text-white active:border-gray-800 active:text-gray-800 hover:border-gray-800 hover:text-gray-800` 
                    : `text-gray-800 border-gray-800 active:border-gray-800 active:text-gray-800 hover:border-gray-800 hover:text-gray-800`
                }`}
                onClick={() => {
                  setActiveChannel('all');
                  setActiveChat(null);
                }}
              >
                <FaDatabase className="w-[20px] h-[20px] min-w-[20px] min-h-[20px]" />
                <span>全部</span>
              </Button>
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChannel === channel.id ? "filled" : "outlined"}
                  className={`h-[50px] flex items-center justify-center gap-1 flex-1 py-2 transition-all ${
                    activeChannel === channel.id 
                      ? `${channel.colors.active} text-white` 
                      : `${channel.colors.default} ${channel.colors.hover}`
                  }`}
                  onClick={() => {
                    setActiveChannel(channel.id);
                    setActiveChat(null);
                  }}
                >
                  <channel.icon className="w-[20px] h-[20px] min-w-[20px] min-h-[20px]" />
                  <span className="hidden">{channel.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
        <IconButton
          variant="text"
          color="blue-gray"
          onClick={() => setOpenConfigurator(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="flex flex-col h-[calc(100vh-220px)] px-6 ">
        {activeTab === 'chat' ? (
          activeChat ? renderChatWindow() : renderChatList()
        ) : (
          renderTrainingInterface()
        )}
      </div>
    </aside>
  );
}

Configurator.displayName = "/src/widgets/layout/configurator.jsx";

export default Configurator;
