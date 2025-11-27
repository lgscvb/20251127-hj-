<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\LineMessage;
use App\Models\LineUser;
use App\Models\Project;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\LineBot;
use App\Models\PaymentHistory;
use App\Http\Controllers\ApiController;
use LINE\Clients\MessagingApi\Api\MessagingApiApi;
use LINE\Clients\MessagingApi\Configuration;
use LINE\Clients\MessagingApi\Model\ReplyMessageRequest;
use LINE\Clients\MessagingApi\Model\TextMessage;

class LineBotController extends Controller
{
    protected $bot;
    protected $channel_access_token;
    protected $apiEndpoint = 'https://api.line.me/v2/bot/message';

    public function __construct()
    {
        $this->channel_access_token = config('services.line.channel_access_token');

        // 初始化 LINE API 客戶端
        $config = new Configuration();
        $config->setAccessToken($this->channel_access_token);
        $this->bot = new MessagingApiApi(null, $config);
    }

    public function webhook(Request $request)
    {
        \Log::info('Webhook received');

        try {
            $body = $request->getContent();
            $events = json_decode($body, true)['events'] ?? [];
            
            \Log::info('Received events:', ['events' => $events]);

            // 获取请求的URL路径，根据不同的路径判断是哪个机器人
            $path = $request->path();
            $botId = $this->getBotIdFromPath($path);

            // 如果能获取到botId，则获取对应的token
            if ($botId) {
                $lineBot = LineBot::find($botId);
                if ($lineBot) {
                    // 重新设置token和初始化bot
                    $this->channel_access_token = $lineBot->channel_token;
                    $config = new Configuration();
                    $config->setAccessToken($this->channel_access_token);
                    $this->bot = new MessagingApiApi(null, $config);
                }
            }

            foreach ($events as $event) {
                // 只處理文字訊息
                if ($event['type'] === 'message' && $event['message']['type'] === 'text') {
                    // 記錄訊息
                    $message = LineMessage::create([
                        'message_id' => $event['message']['id'] ?? null,
                        'user_id' => $event['source']['userId'],
                        'reply_token' => $event['replyToken'],
                        'message_type' => $event['message']['type'],
                        'message_text' => $event['message']['text'] ?? null,
                        'raw_data' => $event
                    ]);

                    $userLineId = $event['source']['userId'];
                    $userProfile = $this->getUserProfile($userLineId);
                    $username = $userProfile['displayName'];
                    // 更新或創建用戶記錄
                    LineUser::updateOrCreate(
                        ['user_id' => $userLineId],
                        ['display_name' => $username],
                        ['last_interaction' => now()]
                    );

                    // 準備回覆訊息
                    $replyText = $this->prepareReply($event['message']['text'],$userLineId);
                    
                    // 發送回覆
                    $response = $this->sendReply($event['replyToken'], $replyText);

                    // 更新訊息記錄
                    $message->update([
                        'reply_text' => $replyText,
                        'is_processed' => true,
                        'processed_at' => now()
                    ]);

                    \Log::info('Message processed', [
                        'user_message' => $event['message']['text'],
                        'reply' => $replyText,
                        'response' => $response
                    ]);
                }
            }

            return response()->json(['status' => 'ok']);
            
        } catch (\Exception $e) {
            \Log::error('Webhook error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['status' => 'error'], 500);
        }
    }

    /**
     * 从路径中获取机器人ID
     * 
     * @param string $path 请求路径
     * @return int|null 机器人ID或null
     */
    protected function getBotIdFromPath($path)
    {
        // 假设路径格式为 line/webhook/{botId}
        $segments = explode('/', $path);
        $botId = end($segments);
        
        return is_numeric($botId) ? (int)$botId : null;
    }

    // 创建一个静态方法来获取指定botId的控制器实例
    public static function getInstance($botId)
    {
        $lineBot = LineBot::find($botId);
        if (!$lineBot) {
            return new self(); // 使用默认token
        }
        
        return new self($lineBot->channel_token);
    }

    protected function getUserProfile($userId)
    {
        $url = "https://api.line.me/v2/bot/profile/{$userId}";
        $headers = [
            'Authorization: Bearer ' . $this->channel_access_token
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    protected function prepareReply($userMessage,$userLineId)
    {

        switch($userMessage){
            case '下次繳費':
                return $this->queryNextPayment($userLineId);
                break;
            case '繳費紀錄':
                return $this->queryPaymentHistory($userLineId);
                break;
            case '查看合約':
                return $this->queryContract($userLineId);
                // return "查看合約";
                break;
        }
    }

    // 主動發送訊息給單一用戶
    public function sendMessage(Request $request)
    {
        $request->validate([
            'user_id' => 'required|string',
            'message' => 'required|string'
        ]);

        try {
            $response = $this->pushMessage($request->user_id, $request->message);

            // 記錄發送的訊息
            LineMessage::create([
                'user_id' => $request->user_id,
                'message_type' => 'push',
                'message_text' => $request->message,
                'is_processed' => true,
                'processed_at' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'response' => $response
            ]);
        } catch (\Exception $e) {
            \Log::error('Push message error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 群發訊息
    public function broadcast(Request $request)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        try {
            $users = LineUser::pluck('user_id')->toArray();
            $chunks = array_chunk($users, 150); // LINE API 限制每次最多 150 人

            foreach ($chunks as $userIds) {
                $response = $this->multicast($userIds, $request->message);
                
                // 記錄群發訊息
                foreach ($userIds as $userId) {
                    LineMessage::create([
                        'user_id' => $userId,
                        'message_type' => 'broadcast',
                        'message_text' => $request->message,
                        'is_processed' => true,
                        'processed_at' => now()
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'users_count' => count($users)
            ]);
        } catch (\Exception $e) {
            \Log::error('Broadcast error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 發送單一訊息
    protected function pushMessage($userId, $text)
    {
        return $this->sendRequest('/push', [
            'to' => $userId,
            'messages' => [
                [
                    'type' => 'text',
                    'text' => $text
                ]
            ]
        ]);
    }

    // 群發訊息
    protected function multicast(array $userIds, $text)
    {
        return $this->sendRequest('/multicast', [
            'to' => $userIds,
            'messages' => [
                [
                    'type' => 'text',
                    'text' => $text
                ]
            ]
        ]);
    }

    // 發送 API 請求
    protected function sendRequest($path, $data)
    {
        $url = $this->apiEndpoint . $path;
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->channel_access_token
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        \Log::info('LINE API Response', [
            'path' => $path,
            'httpCode' => $httpCode,
            'response' => $response
        ]);

        return $response;
    }

    protected function sendReply($replyToken, $text)
    {
        try {
            // 使用 curl 直接發送請求
            $url = 'https://api.line.me/v2/bot/message/reply';
            $data = [
                'replyToken' => $replyToken,
                'messages' => [
                    [
                        'type' => 'text',
                        'text' => $text
                    ]
                ]
            ];
    
            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->channel_access_token
            ];
    
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
    
            \Log::info('CURL Response', [
                'httpCode' => $httpCode,
                'response' => $response
            ]);
    
            return $response;
        } catch (\Exception $e) {
            \Log::error('CURL Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    //查詢下次繳費內容處理
    protected function queryNextPayment($userLineId)
    {
        $customer = Customer::where('line_id', $userLineId)->first();
        if(!$customer){
            return "查無資料";
        }
        $project = Project::where('customer_id', $customer->id)->where('status', 1)->orderBy('next_pay_day', 'asc')->get();
        if($project->count() > 0){
            $returnText = "";
            foreach($project as $item){
                $nextPaymentDate = date('Y-m-d', strtotime($item->next_pay_day));
                $pay_money = intval($item->current_payment);
                $returnText .= "合約名稱：" . $item->projectName . "，下次繳費日：" . $nextPaymentDate. "，繳費金額：" . $pay_money . "\n";
            }
            return $returnText;
        }else{
            return "你沒有任何合約";
        }
    }

    //查詢繳費紀錄處理
    protected function queryPaymentHistory($userLineId)
    {
        $customer = Customer::where('line_id', $userLineId)->first();
        if(!$customer){
            return "查無資料";
        }
        $payment_histories = PaymentHistory::where('customer_id', $customer->id)->orderBy('created_at', 'desc')->limit(10)->get();
        if($payment_histories->count() > 0){
            $returnText = "";
            foreach($payment_histories as $item){
                $payment_date = date('Y-m-d', strtotime($item->pay_day));
                $pay_money = intval($item->amount);
                switch($item->pay_type){
                    case 'credit':
                        $pay_type = "信用卡";
                        break;
                    case 'cash':
                        $pay_type = "現金";
                        break;
                    case 'transfer':
                        $pay_type = "轉帳";
                        break;
                    default:
                        $pay_type = "其他";
                        break;
                }
                $returnText .= "繳費日期：" . $payment_date. "，付款方式：" . $pay_type . "，繳費金額：" . $pay_money . "\n";
            }
            return $returnText;
        }else{
            return "你沒有任何繳費紀錄";
        }
    }

    //查看合約
    protected function queryContract($userLineId)
    {
        try {
            // 检查用户是否存在
            $customer = Customer::where('line_id', $userLineId)->first();
            \Log::info('客户查询结果', ['customer_exists' => (bool)$customer]);
            
            if(!$customer){
                return "查無客戶資料";
            }
            
            // 查找用户的所有合约
            $projects = Project::where('customer_id', $customer->id)
                            ->where('status', 1)
                            ->get();

            if($projects->isEmpty()){
                return "您目前沒有有效的合約";
            }
            
            // 获取最新的reply_token
            $latestMessage = LineMessage::where('user_id', $userLineId)
                                    ->latest()
                                    ->first();

            if(!$latestMessage || !$latestMessage->reply_token){
                return "無法獲取回覆令牌，請重新發送訊息";
            }
            
            $replyToken = $latestMessage->reply_token;
            
            // 选择一个合约进行处理
            $project = $projects->first();

            // 验证PDF文件是否存在
            $pdfPath = storage_path("app/public/{$project->contract_path}");
            \Log::info('PDF 路径', ['pdf_path' => $pdfPath, 'exists' => file_exists($pdfPath)]);

            if (!file_exists($pdfPath)) {
                \Log::error('找不到 PDF 文件', ['path' => $pdfPath]);
                return "找不到合約文件，請聯繫客服";
            }
            
            // 构造PDF公共访问URL
            $pdfPublicUrl = "storage/" . str_replace('public/', '', $project->contract_path);
            $fullPdfUrl = url($pdfPublicUrl);
            
            \Log::info('PDF公共URL', ['url' => $fullPdfUrl]);
            
            // 发送消息
            $messages = [];
            // 添加标题和链接消息
            $messages[] = [
                'type' => 'text',
                'text' => "合約：{$project->projectName}\n\n查看合約請點擊以下連結：\n{$fullPdfUrl}"
            ];
            
            // 发送消息
            $data = [
                'replyToken' => $replyToken,
                'messages' => $messages
            ];
            
            // 发送请求到 LINE Messaging API
            $url = 'https://api.line.me/v2/bot/message/reply';
            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->channel_access_token
            ];

            $curlOptions = [
                CURLOPT_URL => $url,
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_TIMEOUT => 30,
            ];

            $ch = curl_init();
            curl_setopt_array($ch, $curlOptions);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            \Log::info('LINE API 响应', [
                'http_code' => $httpCode,
                'response' => $response
            ]);

            if (curl_errno($ch)) {
                \Log::error('CURL 错误', ['error' => curl_error($ch)]);
                curl_close($ch);
                return "發送訊息時出錯，請稍後再試";
            }

            curl_close($ch);

            if ($httpCode !== 200) {
                \Log::error('LINE API 错误', [
                    'status_code' => $httpCode, 
                    'response' => $response
                ]);
                return "LINE 訊息發送失敗，請稍後再試";
            }

            \Log::info('合約链接发送成功');
            
            return null;
        } catch (\Exception $e) {
            \Log::error('發送合約連結時出錯', ['error' => $e->getMessage()]);
            return "發送合約連結時出錯，請稍後再試";
        }
        
    }

    //由line liff 新增客戶
    public function createCustomerUser(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string',
                'id_number' => 'required|string',
                'birthday' => 'required|date',
                'email' => 'required|email',
                'phone' => 'required|string',
                'address' => 'required|string',
                'company_name' => 'required|string',
                'company_number' => 'required|string',
                'id_card_front' => 'required|string',
                'id_card_back' => 'required|string'
            ], [
                'name.required' => '客戶姓名不能為空',
                'email.required' => '電子郵件地址不能為空',
                'email.email' => '電子郵件地址格式錯誤',
                'birthday.required' => '生日不能為空',
                'birthday.date' => '生日格式錯誤',
                'id_card_front.required' => '身分證前面不能為空',
                'id_card_back.required' => '身分證背面不能為空',
                'phone.required' => '電話不能為空',
                'address.required' => '地址不能為空',
                'company_name.required' => '公司名稱不能為空',
                'company_number.required' => '統一編號不能為空',
                'id_number.required' => '身分證字號不能為空'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            // 创建客户资料
            $customerData = $request->all();

            $lineBot = LineBot::where('channel_token', $this->channel_access_token)->first();
            $customerData['branch_id'] = $lineBot->branch_id;

            $branch = Branch::find($lineBot->branch_id);
            $customerData['branch_name'] = $branch->name;

            // 创建新客户
            $customer = new Customer();
            $customer->fill($customerData);
            
            // 处理状态字段
            $customer->status = isset($customerData['status']) ? $customerData['status'] : 1;
            $customer->modify = isset($customerData['modify']) ? $customerData['modify'] : 1;
            $customer->save();

            
            // 处理照片上传
            if ($request->hasFile('id_card_front')) {
                $customer->id_card_front = $this->handleImageUpload($request->file('id_card_front'), 'customer_id_card_front', $customer->id);
            }
            
            if ($request->hasFile('id_card_back')) {
                $customer->id_card_back = $this->handleImageUpload($request->file('id_card_back'), 'customer_id_card_back', $customer->id);
            }

            $customer->save();

            return response()->json([
                'status' => true,
                'message' => '新增成功',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            \Log::error('Create customer error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '新增失敗：' . $e->getMessage()
            ]);
        }
    }

    //由line liff 查看客戶資料
    public function getCustomerUser(Request $request)
    {
        if(!$request->line_id){
            return response()->json([
                'status' => false,
                'message' => 'Line ID 不能為空'
            ]);
        }
        $customer = Customer::where('line_id', $request->line_id)->first();
        if(!$customer){
            return response()->json([
                'status' => false,
                'message' => '查無資料'
            ]);
        }
        return response()->json([
            'status' => true,
            'data' => $customer
        ]);
    }

}