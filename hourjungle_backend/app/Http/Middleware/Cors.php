<?php
namespace App\Http\Middleware;

use Closure;

class Cors
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        $allowedOrigins = [
         'http://localhost:3000',
         'http://localhost:3600',
        'http://35.236.144.236:3000',
        'https://35.236.144.236:3000',
        'http://35.236.144.236:8000',
        'https://35.236.144.236:8000',
        'http://hour-jungle.com:8000',
        'https://hour-jungle.com:8000',
        'http://hour-jungle.com:3000',
        'https://hour-jungle.com:3000',
        'http://hour-jungle.com',
        'https://hour-jungle.com',  
        ];
        $origin = $request->header('Origin');
        
        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}