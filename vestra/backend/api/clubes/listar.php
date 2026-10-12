<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/conexion.php';

$sql = "SELECT
            id_club,
            Nombre,
            Descripcion,
            Foto_url,
            id_profesor
        FROM club
        ORDER BY Nombre ASC";

$resultado = $conexion->query($sql);

if (!$resultado) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "mensaje" => "Error al consultar los clubes."
    ]);

    $conexion->close();
    exit();
}

$clubes = [];

while ($fila = $resultado->fetch_assoc()) {
    $clubes[] = [
        "id_club" => (int) $fila["id_club"],
        "nombre" => $fila["Nombre"],
        "descripcion" => $fila["Descripcion"],
        "foto_url" => $fila["Foto_url"],
        "id_profesor" => (int) $fila["id_profesor"]
    ];
}

echo json_encode([
    "success" => true,
    "clubes" => $clubes
]);

$conexion->close();
?>
