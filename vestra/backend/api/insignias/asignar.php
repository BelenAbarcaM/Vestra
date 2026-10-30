
<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';

function responder($success, $mensaje, $extra = []) {
    echo json_encode(
        array_merge([
            "success" => $success,
            "mensaje" => $mensaje
        ], $extra),
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    responder(false, "Método no permitido.");
}

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    responder(false, "Debes iniciar sesión.");
}

$idProfesor = (int) $_SESSION["id_usuario"];
$idInsignia = filter_input(INPUT_POST, "id_insignia", FILTER_VALIDATE_INT);
$idUsuario = filter_input(INPUT_POST, "id_usuario", FILTER_VALIDATE_INT);

if (!$idInsignia || $idInsignia < 1 ||
    !$idUsuario || $idUsuario < 1) {
    http_response_code(400);
    responder(false, "La insignia o el usuario no son válidos.");
}

try {
    // La insignia debe pertenecer al profesor y estar aprobada.
    $stmt = $conexion->prepare(
        "SELECT i.id_insignia, i.id_club
         FROM insignia i
         JOIN club c ON c.id_club = i.id_club
         WHERE i.id_insignia = ?
           AND i.id_profe = ?
           AND i.estado = 'Aprobado'
           AND c.id_profesor = ?
         LIMIT 1"
    );

    $stmt->bind_param(
        "iii",
        $idInsignia,
        $idProfesor,
        $idProfesor
    );
    $stmt->execute();
    $insignia = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$insignia) {
        http_response_code(403);
        responder(false, "No puedes asignar esta insignia.");
    }

    $idClub = (int) $insignia["id_club"];

    // El estudiante debe estar inscrito en el club.
    $stmt = $conexion->prepare(
        "SELECT id_usuario
         FROM inscripcion
         WHERE id_usuario = ? AND id_club = ?
         LIMIT 1"
    );

    $stmt->bind_param("ii", $idUsuario, $idClub);
    $stmt->execute();
    $inscripcion = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$inscripcion) {
        http_response_code(400);
        responder(false, "El estudiante no está inscrito en este club.");
    }

    // La clave única evita duplicar una insignia.
    $stmt = $conexion->prepare(
        "INSERT IGNORE INTO usuarioinsignia
            (id_usuario, id_insignia)
         VALUES (?, ?)"
    );

    $stmt->bind_param("ii", $idUsuario, $idInsignia);
    $stmt->execute();
    $asignada = $stmt->affected_rows > 0;
    $stmt->close();

    responder(true, $asignada
        ? "Insignia asignada correctamente."
        : "El estudiante ya tenía esta insignia.", [
            "asignada" => $asignada
        ]);

} catch (Throwable $e) {
    error_log("Error asignando insignia: " . $e->getMessage());
    http_response_code(500);
    responder(false, "No se pudo asignar la insignia.");
}