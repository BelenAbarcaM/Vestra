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


/*
|--------------------------------------------------------------------------
| Datos
|--------------------------------------------------------------------------
*/

$id_club = isset($_POST["id_club"]) ? intval($_POST["id_club"]) : 0;
$titulo = trim($_POST["titulo"] ?? "");
$descripcion = trim($_POST["descripcion"] ?? "");
$fecha = trim($_POST["fecha"] ?? "");
$hora_inicio = trim($_POST["hora_inicio"] ?? "");
$hora_fin = trim($_POST["hora_fin"] ?? "");
$tipo = trim($_POST["tipo"] ?? "Reunion");


/*validaciones blablabla*/

if ($id_club <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "El club es obligatorio."
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


/*verificar que es el iddel profe*/

$sqlClub = "
    SELECT id_club
    FROM club
    WHERE id_club = ?
    AND id_profesor = ?
";

$stmtClub = $conexion->prepare($sqlClub);
$stmtClub->bind_param("ii", $id_club, $id_profesor);
$stmtClub->execute();

$club = $stmtClub->get_result()->fetch_assoc();

if (!$club) {
    echo json_encode([
        "success" => false,
        "error" => "No tienes permiso para agregar eventos a este club."
    ]);
    exit;
}


/*tipos permitidos de evento*/

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


/*insertar el evento*/

$sql = "
    INSERT INTO evento_club (
        id_club,
        titulo,
        descripcion,
        fecha,
        hora_inicio,
        hora_fin,
        tipo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "issssss",
    $id_club,
    $titulo,
    $descripcion,
    $fecha,
    $hora_inicio,
    $hora_fin,
    $tipo
);

if (!$stmt->execute()) {

    echo json_encode([
        "success" => false,
        "error" => "No se pudo crear el evento.",
        "detalle" => $stmt->error
    ]);

    exit;
}


echo json_encode([
    "success" => true,
    "mensaje" => "Evento creado correctamente.",
    "id_evento" => $conexion->insert_id
]);

?>