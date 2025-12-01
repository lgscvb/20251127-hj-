<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LineSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        \Log::info('LineSignature middleware triggered');

        // 檢查 LINE 簽名 header
        if (!$request->hasHeader('x-line-signature')) {
            \Log::warning('Missing LINE signature header');
            return response()->json(['error' => 'Missing signature'], 401);
        }

        $signature = $request->header('x-line-signature');
        $body = $request->getContent();

        // 取得 Channel Secret
        $channelSecret = config('services.line.channel_secret');

        if (empty($channelSecret)) {
            \Log::error('LINE channel secret not configured');
            return response()->json(['error' => 'Server configuration error'], 500);
        }

        \Log::info('Signature verification:', [
            'body_length' => strlen($body),
            'channel_secret_exists' => true
        ]);

        // 計算並驗證簽名
        $hash = hash_hmac('sha256', $body, $channelSecret, true);
        $expectedSignature = base64_encode($hash);

        if (!hash_equals($expectedSignature, $signature)) {
            \Log::warning('Invalid LINE signature', [
                'received' => substr($signature, 0, 20) . '...',
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        \Log::info('LINE signature verified successfully');
        return $next($request);
    }
}