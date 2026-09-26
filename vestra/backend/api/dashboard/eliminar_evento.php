<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

session_start();

require_once "../../config/conexion.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario no autenticado."
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);

$id_evento = isset($_POST["id_evento"])
    ? intval($_POST["id_evento"])
    : 0;

if ($id_evento <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "Debes indicar el evento."
    ]);
    exit;
}


/*verificar q el evento es de ese profe*/

$sqlEvento = "
    SELECT e.id_evento
    FROM evento_club e
    INNER JOIN club c
        ON e.id_club = c.id_club
    WHERE e.id_evento = ?
    AND c.id_profesor = ?
";

$stmtEvento = $conexion->prepare($sqlEvento);

$stmtEvento->bind_param(
    "ii",
    $id_evento,
    $id_profesor
);

$stmtEvento->execute();

$evento = $stmtEvento->get_result()->fetch_assoc();

if (!$evento) {
    echo json_encode([
        "success" => false,
        "error" => "No tienes permiso para eliminar este evento."
    ]);
    exit;
}


/*Eliminarlo*/

$sql = "
    DELETE FROM evento_club
    WHERE id_evento = ?
";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_evento);

if (!$stmt->execute()) {

    echo json_encode([
        "success" => false,
        "error" => "No se pudo eliminar el evento.",
        "detalle" => $stmt->error
    ]);

    exit;
}


echo json_encode([
    "success" => true,
    "mensaje" => "Evento eliminado correctamente."
]);

?>