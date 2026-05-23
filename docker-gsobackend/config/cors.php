<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Change this to React frontend URL if needed
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false, // Must be false when allowed_origins is '*' (browser blocks wildcard + credentials).
                                      // Bearer token auth does NOT require credentials=true. Only SPA cookie auth does.
];
