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


/*obtener datos*/

$id_evento = isset($_POST["id_evento"]) ? intval($_POST["id_evento"]) : 0;
$titulo = trim($_POST["titulo"] ?? "");
$descripcion = trim($_POST["descripcion"] ?? "");
$fecha = trim($_POST["fecha"] ?? "");
$hora_inicio = trim($_POST["hora_inicio"] ?? "");
$hora_fin = trim($_POST["hora_fin"] ?? "");
$tipo = trim($_POST["tipo"] ?? "Reunion");


if ($id_evento <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "Debes indicar el evento."
    ]);
    exit;
}

if ($titulo === "") {
    echo json_encode([
        "success" => false,
        "error" => "El título es obligatorio."
    ]);
    exit;
}

if ($fecha === "") {
    echo json_encode([
        "success" => false,
        "error" => "La fecha es obligatoria."
    ]);
    exit;
}


/*verificar que el evento es del profe*/

$sqlEvento = "
    SELECT e.id_evento
    FROM evento_club e
    INNER JOIN club c
        ON e.id_club = c.id_club
    WHERE e.id_evento = ?
    AND c.id_profesor = ?
";

$stmtEvento = $conexion->prepare($sqlEvento);
$stmtEvento->bind_param("ii", $id_evento, $id_profesor);
$stmtEvento->execute();

$evento = $stmtEvento->get_result()->fetch_assoc();

if (!$evento) {
    echo json_encode([
        "success" => false,
        "error" => "No tienes permiso para modificar este evento."
    ]);
    exit;
}


/*validar el tipo de evento*/

$tiposPermitidos = [
    "Reunion",
    "Entrenamiento",
    "Competencia",
    "Actividad",
    "Presentacion",
    "Otro"
];

if (!in_array($tipo, $tiposPermitidos, true)) {
    echo json_encode([
        "success" => false,
        "error" => "El tipo de evento no es válido."
    ]);
    exit;
}


/*actualizar*/

$sql = "
    UPDATE evento_club
    SET
        titulo = ?,
        descripcion = ?,
        fecha = ?,
        hora_inicio = ?,
        hora_fin = ?,
        tipo = ?
    WHERE id_evento = ?
";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "ssssssi",
    $titulo,
    $descripcion,
    $fecha,
    $hora_inicio,
    $hora_fin,
    $tipo,
    $id_evento
);

if (!$stmt->execute()) {

    echo json_encode([
        "success" => false,
        "error" => "No se pudo actualizar el evento.",
        "detalle" => $stmt->error
    ]);

    exit;
}


echo json_encode([
    "success" => true,
    "mensaje" => "Evento actualizado correctamente."
]);

?>