
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

// Verificar que el usuario haya iniciado sesión.
if (!isset($_SESSION['id_usuario'])) {
    responder(401, [
        "success" => false,
        "mensaje" => "Debes iniciar sesión."
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(405, [
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
}

$idUsuario = (int) $_SESSION['id_usuario'];

$idConversacion = filter_input(
    INPUT_GET,
    'id_conversacion',
    FILTER_VALIDATE_INT
);

if (!$idConversacion || $idConversacion < 1) {
    responder(400, [
        "success" => false,
        "mensaje" => "La conversación indicada no es válida."
    ]);
}

try {
    // Verificar que el usuario pertenezca a esta conversación.
    $sqlConversacion = "
        SELECT
            id_conversacion,
            id_estudiante,
            id_profesor
        FROM chat_profesor_conversacion
        WHERE id_conversacion = ?
          AND (
              id_estudiante = ?
              OR id_profesor = ?
          )
        LIMIT 1
    ";

    $stmtConversacion = $conexion->prepare($sqlConversacion);

    $stmtConversacion->bind_param(
        "iii",
        $idConversacion,
        $idUsuario,
        $idUsuario
    );

    $stmtConversacion->execute();

    $resultadoConversacion = $stmtConversacion->get_result();
    $conversacion = $resultadoConversacion->fetch_assoc();

    $stmtConversacion->close();

    if (!$conversacion) {
        responder(403, [
            "success" => false,
            "mensaje" => "No tienes acceso a esta conversación."
        ]);
    }

    // Marcar como leídos los mensajes recibidos por este usuario.
    $sqlLeer = "
        UPDATE chat_profesor_mensaje
        SET leido = 1
        WHERE id_conversacion = ?
          AND id_remitente <> ?
          AND leido = 0
    ";

    $stmtLeer = $conexion->prepare($sqlLeer);

    $stmtLeer->bind_param(
        "ii",
        $idConversacion,
        $idUsuario
    );

    $stmtLeer->execute();
    $stmtLeer->close();

    // Obtener el historial completo en orden cronológico.
    $sqlMensajes = "
        SELECT
            m.id_mensaje,
            m.id_conversacion,
            m.id_remitente,
            u.Nombre AS nombre_remitente,
            u.Foto_url AS foto_remitente,
            m.contenido,
            m.fecha_envio,
            m.leido
        FROM chat_profesor_mensaje m
        INNER JOIN usuario u
            ON u.id_usuario = m.id_remitente
        WHERE m.id_conversacion = ?
        ORDER BY m.fecha_envio ASC, m.id_mensaje ASC
    ";

    $stmtMensajes = $conexion->prepare($sqlMensajes);

    $stmtMensajes->bind_param("i", $idConversacion);

    $stmtMensajes->execute();

    $resultadoMensajes = $stmtMensajes->get_result();

    $mensajes = [];

    while ($fila = $resultadoMensajes->fetch_assoc()) {
        $mensajes[] = [
            "id_mensaje" => (int) $fila['id_mensaje'],
            "id_conversacion" => (int) $fila['id_conversacion'],
            "id_remitente" => (int) $fila['id_remitente'],
            "nombre_remitente" => $fila['nombre_remitente'],
            "foto_remitente" => $fila['foto_remitente'],
            "contenido" => $fila['contenido'],
            "fecha_envio" => $fila['fecha_envio'],
            "leido" => (bool) $fila['leido'],
            "es_mio" => (
                (int) $fila['id_remitente'] === $idUsuario
            )
        ];
    }

    $stmtMensajes->close();

    responder(200, [
        "success" => true,
        "id_conversacion" => (int) $idConversacion,
        "mensajes" => $mensajes
    ]);

} catch (Throwable $e) {
    error_log(
        "Error al obtener mensajes del chat privado: "
        . $e->getMessage()
    );

    responder(500, [
        "success" => false,
        "mensaje" => "No se pudieron obtener los mensajes."
    ]);
}
?>