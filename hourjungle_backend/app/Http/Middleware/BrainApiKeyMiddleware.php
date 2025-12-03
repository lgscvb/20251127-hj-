<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Brain API Key 驗證中介層
 * 用於驗證來自 Brain AI 系統的 API 請求
 */
class BrainApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $apiKey = $request->header('X-Brain-Api-Key') ?? $request->header('Authorization');

        // 移除 Bearer 前綴（如果有的話）
        if (str_starts_with($apiKey ?? '', 'Bearer ')) {
            $apiKey = substr($apiKey, 7);
        }

        $validKey = config('services.brain.api_key');

        if (empty($validKey)) {
            // 如果沒有設定 API Key，允許所有請求（開發模式）
            return $next($request);
        }

        if ($apiKey !== $validKey) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid API Key'
            ], 401);
        }

        return $next($request);
    }
}
