<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

$sql = "SELECT 
            id_club,
            Nombre,
            Descripcion,
            Foto_url
        FROM club
        ORDER BY Nombre ASC";

$resultado = $conexion->query($sql);

$clubes = [];

while ($fila = $resultado->fetch_assoc()) {
    $clubes[] = [
        "id_club" => (int)$fila["id_club"],
        "nombre" => $fila["Nombre"],
        "descripcion" => $fila["Descripcion"],
        "foto_url" => $fila["Foto_url"]
    ];
}

echo json_encode([
    "success" => true,
    "clubes" => $clubes
]);