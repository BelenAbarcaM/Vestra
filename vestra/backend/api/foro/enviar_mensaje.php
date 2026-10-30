
<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';

function responder($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Solo estudiantes y profesores autenticados.
if (
    !isset($_SESSION['id_usuario']) ||
    !isset($_SESSION['id_tipo_usuario']) ||
    !in_array((int) $_SESSION['id_tipo_usuario'], [1, 2], true)
) {
    responder(403, [
        "success" => false,
        "mensaje" => "No tienes permiso para enviar mensajes."
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, [
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
}

// Recibir JSON enviado desde React.
$datos = json_decode(file_get_contents('php://input'), true);

if (!is_array($datos)) {
    responder(400, [
        "success" => false,
        "mensaje" => "Los datos recibidos no son válidos."
    ]);
}

$idClub = filter_var(
    $datos['id_club'] ?? null,
    FILTER_VALIDATE_INT
);

$mensaje = trim($datos['mensaje'] ?? '');
$idUsuario = (int) $_SESSION['id_usuario'];

if (!$idClub || $idClub < 1) {
    responder(400, [
        "success" => false,
        "mensaje" => "Debes indicar un club válido."
    ]);
}

if ($mensaje === '') {
    responder(400, [
        "success" => false,
        "mensaje" => "El mensaje no puede estar vacío."
    ]);
}

if (mb_strlen($mensaje, 'UTF-8') > 5000) {
    responder(400, [
        "success" => false,
        "mensaje" => "El mensaje no puede superar los 5000 caracteres."
    ]);
}

try {
    // Obtener el foro correspondiente al club.
    $sqlForo = "
        SELECT id_foro
        FROM foro
        WHERE id_club = ?
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
            "mensaje" => "No existe un foro para este club."
        ]);
    }

    $idForo = (int) $foro['id_foro'];

    // El usuario se obtiene de la sesión, nunca del cliente.
    $sqlInsertar = "
        INSERT INTO mensaje_foro
            (id_foro, id_usuario, mensaje)
        VALUES (?, ?, ?)
    ";

    $stmtInsertar = $conexion->prepare($sqlInsertar);
    $stmtInsertar->bind_param(
        "iis",
        $idForo,
        $idUsuario,
        $mensaje
    );
    $stmtInsertar->execute();

    $idMensaje = (int) $conexion->insert_id;
    $stmtInsertar->close();

    // Devolver los datos del mensaje recién guardado.
    $sqlNuevo = "
        SELECT
            m.id_mensaje,
            m.id_foro,
            m.id_usuario,
            m.mensaje,
            m.fecha_envio,
            u.Nombre AS nombre_usuario,
            u.Foto_url AS foto_usuario
        FROM mensaje_foro m
        INNER JOIN usuario u ON u.id_usuario = m.id_usuario
        WHERE m.id_mensaje = ?
        LIMIT 1
    ";

    $stmtNuevo = $conexion->prepare($sqlNuevo);
    $stmtNuevo->bind_param("i", $idMensaje);
    $stmtNuevo->execute();

    $nuevoMensaje = $stmtNuevo->get_result()->fetch_assoc();
    $stmtNuevo->close();

    if (!$nuevoMensaje) {
        throw new Exception("No se pudo recuperar el mensaje guardado.");
    }

    $nuevoMensaje['id_mensaje'] = (int) $nuevoMensaje['id_mensaje'];
    $nuevoMensaje['id_foro'] = (int) $nuevoMensaje['id_foro'];
    $nuevoMensaje['id_usuario'] = (int) $nuevoMensaje['id_usuario'];

    responder(201, [
        "success" => true,
        "mensaje" => "Mensaje enviado correctamente.",
        "datos" => $nuevoMensaje
    ]);

} catch (Throwable $e) {
    error_log("Error al enviar mensaje al foro: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "mensaje" => "No se pudo enviar el mensaje."
    ]);
}
?>