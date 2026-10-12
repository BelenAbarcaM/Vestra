<?php

require_once __DIR__ . '/lib/moderacion.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'mensaje' => 'Metodo no permitido.'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$texto = trim($data['texto'] ?? '');
$contexto = trim($data['contexto'] ?? 'contenido de Vestra');

if ($texto === '') {
    echo json_encode([
        'success' => true,
        'blocked' => false,
        'mensaje' => 'Sin contenido para moderar.'
    ]);
    exit;
}

$resultado = vestra_moderar_contenido($texto, $contexto);

if (!empty($resultado['blocked'])) {
    echo json_encode([
        'success' => true,
        'blocked' => true,
        'motivo' => $resultado['reason'] ?? 'revision_ia',
        'origen_moderacion' => $resultado['source'] ?? 'moderacion',
        'mensaje' => vestra_mensaje_contenido_bloqueado($resultado)
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'blocked' => false,
    'motivo' => 'ok',
    'origen_moderacion' => $resultado['source'] ?? 'local',
    'mensaje' => 'Contenido aprobado.'
]);
