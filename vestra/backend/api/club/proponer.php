<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "mensaje" => "No se recibieron datos."
    ]);
    exit;
}

$nombreEncargado = trim($data["nombreEncargado"] ?? "");
$correo = trim($data["correo"] ?? "");
$nombreCurso = trim($data["nombreCurso"] ?? "");
$descripcion = trim($data["descripcion"] ?? "");
$horario = trim($data["horario"] ?? "");
$cuota = trim($data["cuota"] ?? "");
$requisitos = trim($data["requisitos"] ?? "");

if (
    empty($nombreEncargado) ||
    empty($correo) ||
    empty($nombreCurso) ||
    empty($descripcion) ||
    empty($horario) ||
    empty($cuota)
) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Completa todos los campos obligatorios."
    ]);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "mensaje" => "El correo electrónico no es válido."
    ]);
    exit;
}

$sql = "INSERT INTO propuesta_club
        (
            nombre_encargado,
            correo,
            nombre_club,
            descripcion,
            horario,
            cuota,
            requisitos,
            estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')";

$stmt = $conexion->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error preparando la consulta."
    ]);
    exit;
}

$stmt->bind_param(
    "sssssss",
    $nombreEncargado,
    $correo,
    $nombreCurso,
    $descripcion,
    $horario,
    $cuota,
    $requisitos
);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "mensaje" => "La propuesta del club fue enviada correctamente.",
        "id_propuesta" => $stmt->insert_id
    ]);

} else {

    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudo guardar la propuesta."
    ]);
}

$stmt->close();
$conexion->close();