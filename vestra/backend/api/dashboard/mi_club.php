<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);

$sql = "SELECT
            id_club,
            Nombre,
            Descripcion,
            Foto_url,
            id_profesor
        FROM club
        WHERE id_profesor = ?
        ORDER BY id_club ASC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_profesor);
$stmt->execute();

$resultado = $stmt->get_result();

$clubes = [];

while ($fila = $resultado->fetch_assoc()) {
    $clubes[] = $fila;
}

echo json_encode([
    "success" => true,
    "clubes" => $clubes
]);
?>