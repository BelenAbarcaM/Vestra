
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once "../../config/conexion.php";

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

$idUsuario = filter_input(INPUT_GET, "id_usuario", FILTER_VALIDATE_INT);

if (!$idUsuario || $idUsuario < 1) {
    if (!isset($_SESSION["id_usuario"])) {
        http_response_code(401);
        responder(false, "Debes iniciar sesión o indicar un usuario válido.");
    }

    $idUsuario = (int) $_SESSION["id_usuario"];
}

try {
    $stmt = $conexion->prepare(
        "SELECT
            i.id_insignia,
            i.nombre,
            i.descripcion,
            i.foto,
            i.id_club,
            c.nombre AS nombre_club,
            ui.fecha_obtenida
         FROM usuarioinsignia ui
         JOIN insignia i ON i.id_insignia = ui.id_insignia
         LEFT JOIN club c ON c.id_club = i.id_club
         WHERE ui.id_usuario = ?
           AND i.estado = 'Aprobado'
         ORDER BY ui.fecha_obtenida DESC"
    );

    if (!$stmt) {
        throw new Exception("No se pudo preparar la consulta.");
    }

    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();
    $resultado = $stmt->get_result();

    $insignias = [];

    while ($fila = $resultado->fetch_assoc()) {
        $insignias[] = $fila;
    }

    $stmt->close();

    responder(true, "Insignias consultadas correctamente.", [
        "insignias" => $insignias
    ]);

} catch (Throwable $e) {
    error_log("Error consultando insignias: " . $e->getMessage());
    http_response_code(500);
    responder(false, "No se pudieron cargar las insignias.");
}