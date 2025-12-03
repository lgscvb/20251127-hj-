<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * LINE Messaging API Service
 * 用於發送 LINE 推播訊息
 */
class LineMessagingService
{
    protected $apiEndpoint = 'https://api.line.me/v2/bot/message';
    protected $channelAccessToken;

    public function __construct()
    {
        $this->channelAccessToken = config('services.line.channel_access_token');
    }

    /**
     * 設定 Channel Access Token
     */
    public function setAccessToken($token)
    {
        $this->channelAccessToken = $token;
        return $this;
    }

    /**
     * 發送推播訊息給單一用戶
     *
     * @param string $userId LINE User ID
     * @param string $message 訊息內容
     * @return array ['success' => bool, 'response' => mixed, 'error' => string|null]
     */
    public function pushMessage($userId, $message)
    {
        if (empty($this->channelAccessToken)) {
            return [
                'success' => false,
                'response' => null,
                'error' => 'Channel access token not configured',
            ];
        }

        if (empty($userId)) {
            return [
                'success' => false,
                'response' => null,
                'error' => 'User ID is required',
            ];
        }

        try {
            $response = $this->sendRequest('/push', [
                'to' => $userId,
                'messages' => [
                    [
                        'type' => 'text',
                        'text' => $message,
                    ],
                ],
            ]);

            $httpCode = $response['http_code'] ?? 0;
            $body = $response['body'] ?? '';

            if ($httpCode >= 200 && $httpCode < 300) {
                Log::info('LINE 推播成功', [
                    'user_id' => $userId,
                    'message_length' => strlen($message),
                ]);

                return [
                    'success' => true,
                    'response' => $body,
                    'error' => null,
                ];
            }

            $errorMessage = "HTTP {$httpCode}: {$body}";
            Log::error('LINE 推播失敗', [
                'user_id' => $userId,
                'http_code' => $httpCode,
                'response' => $body,
            ]);

            return [
                'success' => false,
                'response' => $body,
                'error' => $errorMessage,
            ];

        } catch (\Exception $e) {
            Log::error('LINE 推播異常', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'response' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * 群發訊息給多個用戶
     *
     * @param array $userIds LINE User IDs (最多 500 個)
     * @param string $message 訊息內容
     * @return array
     */
    public function multicast(array $userIds, $message)
    {
        if (empty($userIds)) {
            return [
                'success' => false,
                'response' => null,
                'error' => 'User IDs are required',
            ];
        }

        // LINE API 限制每次最多 500 人
        $userIds = array_slice($userIds, 0, 500);

        try {
            $response = $this->sendRequest('/multicast', [
                'to' => $userIds,
                'messages' => [
                    [
                        'type' => 'text',
                        'text' => $message,
                    ],
                ],
            ]);

            $httpCode = $response['http_code'] ?? 0;
            $body = $response['body'] ?? '';

            if ($httpCode >= 200 && $httpCode < 300) {
                return [
                    'success' => true,
                    'response' => $body,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'response' => $body,
                'error' => "HTTP {$httpCode}: {$body}",
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'response' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * 發送 API 請求
     */
    protected function sendRequest($path, $data)
    {
        $url = $this->apiEndpoint . $path;
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->channelAccessToken,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("CURL Error: {$error}");
        }

        return [
            'http_code' => $httpCode,
            'body' => $response,
        ];
    }
}
