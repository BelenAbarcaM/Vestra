<?php


require_once __DIR__ . '/../../config/cors.php';
function chat_profesores_headers() {
    header('Content-Type: application/json; charset=UTF-8');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
}

function chat_profesores_preflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function chat_profesores_crear_tabla($conexion) {
    $conexion->query("CREATE TABLE IF NOT EXISTS mensaje (
        id_Mensaje int unsigned NOT NULL AUTO_INCREMENT,
        texto varchar(1000) NOT NULL,
        fecha datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        id_emisor int unsigned NOT NULL,
        id_receptor int unsigned NOT NULL,
        PRIMARY KEY (id_Mensaje),
        KEY id_emisor (id_emisor),
        KEY id_receptor (id_receptor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function chat_profesores_usuario_actual() {
    return isset($_SESSION['id_usuario']) ? (int) $_SESSION['id_usuario'] : 0;
}

function chat_profesores_es_profesor($conexion, $idUsuario) {
    $stmt = $conexion->prepare("SELECT id_usuario FROM usuario WHERE id_usuario = ? AND id_tipo_usuario = 2 LIMIT 1");
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $esProfesor = $resultado && $resultado->num_rows > 0;
    $stmt->close();

    return $esProfesor;
}

function chat_profesores_exigir_profesor($conexion) {
    $idUsuario = chat_profesores_usuario_actual();

    if ($idUsuario <= 0 || !chat_profesores_es_profesor($conexion, $idUsuario)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Solo los profesores pueden usar el chat privado.'
        ]);
        exit;
    }

    return $idUsuario;
}
