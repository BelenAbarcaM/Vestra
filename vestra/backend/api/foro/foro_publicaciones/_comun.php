<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) session_start();
require_once __DIR__ . '/../../config/conexion.php';
require_once __DIR__ . '/../lib/moderacion.php';

function foro_json(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function foro_usuario_autenticado(): int {
    if (!isset($_SESSION['id_usuario'], $_SESSION['id_tipo_usuario']) ||
        !in_array((int)$_SESSION['id_tipo_usuario'], [1, 2], true)) {
        foro_json(403, ['success' => false, 'mensaje' => 'Inicia sesión con una cuenta de estudiante o profesor para usar el foro.']);
    }
    return (int)$_SESSION['id_usuario'];
}

function foro_json_entrada(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) foro_json(400, ['success' => false, 'mensaje' => 'El contenido enviado no es JSON válido.']);
    return $data;
}

function foro_id_foro(mysqli $conexion, int $idClub): int {
    if ($idClub < 1) foro_json(400, ['success' => false, 'mensaje' => 'Debes indicar un club válido.']);
    $stmt = $conexion->prepare('SELECT id_foro FROM foro WHERE id_club = ? LIMIT 1');
    $stmt->bind_param('i', $idClub);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) foro_json(404, ['success' => false, 'mensaje' => 'Este club no tiene un foro disponible.']);
    return (int)$row['id_foro'];
}

function foro_comprobar_publicacion(mysqli $conexion, int $idPublicacion): array {
    $stmt = $conexion->prepare('SELECT id_publicacion, id_foro FROM foro_publicacion WHERE id_publicacion = ? LIMIT 1');
    $stmt->bind_param('i', $idPublicacion);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) foro_json(404, ['success' => false, 'mensaje' => 'La publicación ya no existe.']);
    return $row;
}

function foro_revisar_contenido(string $texto, string $contexto): void {
    $resultado = vestra_moderar_contenido($texto, $contexto);
    if (!empty($resultado['blocked'])) vestra_responder_bloqueo_json($resultado);
}
