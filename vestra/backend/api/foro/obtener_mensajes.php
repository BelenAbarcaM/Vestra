
<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once '../../config/conexion.php';

function responder($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Verificar usuario autenticado.

if (!isset($_SESSION['id_usuario'])) {
    responder(403, [
        "success" => false,
        "mensaje" => "La sesión no contiene id_usuario."
    ]);
}

if (!isset($_SESSION['id_tipo_usuario'])) {
    responder(403, [
        "success" => false,
        "mensaje" => "La sesión no contiene id_tipo_usuario."
    ]);
}

$tipoUsuario = (int) $_SESSION['id_tipo_usuario'];

if (!in_array($tipoUsuario, [1, 2], true)) {
    responder(403, [
        "success" => false,
        "mensaje" => "El rol de la sesión no está autorizado.",
        "rol_recibido" => $tipoUsuario
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(405, [
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
}

$idClub = filter_input(INPUT_GET, 'id_club', FILTER_VALIDATE_INT);

if (!$idClub || $idClub < 1) {
    responder(400, [
        "success" => false,
        "mensaje" => "Debes indicar un club válido."
    ]);
}

try {
    // Encontrar el foro del club.
    $sqlForo = "
        SELECT f.id_foro, c.Nombre AS nombre_club
        FROM foro f
        INNER JOIN club c ON c.id_club = f.id_club
        WHERE f.id_club = ?
        LIMIT 1
    ";

    $stmtForo = $conexion->prepare($sqlForo);
    $stmtForo->bind_param("i", $idClub);
    $stmtForo->execute();

    $resultadoForo = $stmtForo->get_result();
    $foro = $resultadoForo->fetch_assoc();
    $stmtForo->close();

    if (!$foro) {
        responder(404, [
            "success" => false,
            "mensaje" => "Este club no tiene un foro disponible."
        ]);
    }

    $idForo = (int) $foro['id_foro'];

    // Obtener los últimos 200 mensajes y mostrarlos
    // del más antiguo al más reciente.
    $sqlMensajes = "
        SELECT
            m.id_mensaje,
            m.id_foro,
            m.id_usuario,
            m.mensaje,
            m.fecha_envio,
            u.Nombre AS nombre_usuario,
            u.Foto_url AS foto_usuario
        FROM (
            SELECT
                id_mensaje,
                id_foro,
                id_usuario,
                mensaje,
                fecha_envio
            FROM mensaje_foro
            WHERE id_foro = ?
            ORDER BY fecha_envio DESC, id_mensaje DESC
            LIMIT 200
        ) AS m
        INNER JOIN usuario u ON u.id_usuario = m.id_usuario
        ORDER BY m.fecha_envio ASC, m.id_mensaje ASC
    ";

    $stmtMensajes = $conexion->prepare($sqlMensajes);
    $stmtMensajes->bind_param("i", $idForo);
    $stmtMensajes->execute();

    $resultado = $stmtMensajes->get_result();
    $mensajes = [];

    while ($fila = $resultado->fetch_assoc()) {
        $mensajes[] = [
            "id_mensaje" => (int) $fila['id_mensaje'],
            "id_foro" => (int) $fila['id_foro'],
            "id_usuario" => (int) $fila['id_usuario'],
            "mensaje" => $fila['mensaje'],
            "fecha_envio" => $fila['fecha_envio'],
            "nombre_usuario" => $fila['nombre_usuario'],
            "foto_usuario" => $fila['foto_usuario']
        ];
    }

    $stmtMensajes->close();

    responder(200, [
        "success" => true,
        "id_foro" => $idForo,
        "nombre_club" => $foro['nombre_club'],
        "mensajes" => $mensajes
    ]);

} catch (Throwable $e) {
    error_log("Error al obtener mensajes del foro: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "mensaje" => "No se pudieron cargar los mensajes."
    ]);
}
?>