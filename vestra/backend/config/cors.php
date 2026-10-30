<?php

$vestraOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$vestraAllowedOrigins = array_filter(array_map(
    'trim',
    explode(',', getenv('VESTRA_ALLOWED_ORIGINS') ?: 'http://localhost:3000,http://localhost:8100,http://localhost,https://localhost,capacitor://localhost')
));

if ($vestraOrigin !== '' && in_array($vestraOrigin, $vestraAllowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $vestraOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

$vestraHttps = (
    !empty($_SERVER['HTTPS']) &&
    strtolower((string) $_SERVER['HTTPS']) !== 'off'
) || (
    strtolower(trim($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https'
);

$vestraOriginsConCookie = [
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:3000',
    'http://localhost:8100'
];

if (
    $vestraHttps &&
    in_array($vestraOrigin, $vestraOriginsConCookie, true) &&
    session_status() === PHP_SESSION_NONE
) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None'
    ]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
