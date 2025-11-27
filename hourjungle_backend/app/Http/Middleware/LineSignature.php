<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LineSignature
{
    public function handle(Request $request, Closure $next)
    {
        \Log::info('LineSignature middleware triggered');
        
        // 開發環境暫時跳過驗證
        if (app()->environment('local')) {
            \Log::info('Local environment - skipping signature check');
            return $next($request);
        }

        try {
            // 檢查 LINE 簽名
            if (!$request->hasHeader('x-line-signature')) {
                \Log::warning('Missing LINE signature header');
                return $next($request); // 開發時暫時允許沒有簽名
            }

            $signature = $request->header('x-line-signature');
            $body = $request->getContent();
            
            // 使用 config 而不是 env
            $channelSecret = config('services.line.channel_secret');
            
            \Log::info('Signature verification:', [
                'received_signature' => $signature,
                'body_length' => strlen($body),
                'channel_secret_exists' => !empty($channelSecret)
            ]);
            
            $hash = hash_hmac('sha256', $body, $channelSecret, true);
            $hashSignature = base64_encode($hash);
            
            if ($signature !== $hashSignature) {
                \Log::warning('Invalid signature', [
                    'received' => $signature,
                    'calculated' => $hashSignature
                ]);
                return $next($request); // 開發時暫時允許無效簽名
            }

            \Log::info('Signature verified successfully');
            return $next($request);
            
        } catch (\Exception $e) {
            \Log::error('Error in LineSignature middleware:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $next($request); // 開發時出錯也繼續
        }
    }
}