export const isNearPayment = (nextPayDay) => {
    if (!nextPayDay) return false;
    const payDate = new Date(nextPayDay);
    const now = new Date();
    const diffDays = Math.ceil((payDate - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 5 && diffDays > 0;
};

export const isOverdue = (nextPayDay) => {
    if (!nextPayDay) return false;
    const payDate = new Date(nextPayDay);
    const now = new Date();
    return payDate < now;
};

// 日期格式化函数
export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

// 日期时间格式化函数
export const formatDateTime = (datetime) => {
    if (!datetime) return '';
    return new Date(datetime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// 檢查合約是否即將到期或已過期
export const shouldShowRenewalNotice = (endDay) => {
  if (!endDay) return false;
  const today = new Date();
  const contractEndDate = new Date(endDay);
  const diffDays = Math.ceil((contractEndDate - today) / (1000 * 60 * 60 * 24));
  
  // 如果合約已過期或即將到期（30天內）
  return diffDays <= 30;
};

// 共用的發送通知函數
export const handleSendNotification = async (project, type = 'payment', options) => {
    const { dispatch, lineBots, customers, sendLineMessage } = options;

    try {
        // 檢查是否已獲取到 LINE Bot 設置
        if (!lineBots || lineBots.length === 0) {
            alert('正在加載 LINE Bot 設置，請稍後再試');
            return;
        }

        // 檢查客戶是否有 LINE ID
        const customer = customers.find(c => c.id === project.customer_id);
        if (!customer || !customer.line_id) {
            alert('此客戶尚未綁定 LINE 帳號，無法發送通知');
            return;
        }

        // 獲取對應分館的 LINE Bot 設置
        const lineBot = lineBots.find(bot => bot.branch_id === project.branch_id);
        if (!lineBot) {
            alert('找不到對應分館的 LINE Bot 設置');
            return;
        }

        // 根據通知類型選擇對應的模板
        const template = type === 'payment' ? lineBot.payment_notice : lineBot.renewql_notice;
        
        // 檢查是否有設置通知模板
        if (!template) {
            alert(`尚未設置${type === 'payment' ? '付款' : '續約'}通知訊息模板，請先在系統設定中設置`);
            return;
        }

        // 格式化金額和日期
        const formattedAmount = project.current_payment.toLocaleString();
        const formattedNextPayDay = formatDate(project.next_pay_day);
        const formattedEndDay = formatDate(project.end_day);

        // 替換模板中的變量
        let message = template
            .replace(/\[name\]/g, customer.name)
            .replace(/\[project_name\]/g, project.projectName);

        // 根據通知類型添加不同的變量
        if (type === 'payment') {
            message = message
                .replace(/\[next_pay_day\]/g, formattedNextPayDay)
                .replace(/\[amount\]/g, formattedAmount);
        } else {
            message = message
                .replace(/\[end_day\]/g, formattedEndDay);
        }

        console.log('準備發送通知:', {
            user_id: customer.line_id,
            message: message
        });

        const result = await dispatch(sendLineMessage({
            user_id: customer.line_id,
            message: message
        }));

        if (result.success) {
            alert('通知發送成功！');
        } else {
            alert(result.message || '通知發送失敗');
        }
    } catch (error) {
        console.error('發送通知失敗:', error);
        alert('發送通知失敗: ' + (error.message || '未知錯誤'));
    }
}; 