<?php
return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://35.221.226.183:3000',
        'https://35.221.226.183:3000',
        'http://35.221.226.183:8000',
        'https://35.221.226.183:8000',
        'http://pocket-point.com:8000',
        'https://pocket-point.com:8000',
        'http://pocket-point.com:3000',
        'https://pocket-point.com:3000',
        'http://pocket-point.com',
        'https://pocket-point.com',
        'https://liff.line.me',
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
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
