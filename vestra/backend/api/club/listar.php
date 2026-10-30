<?php


require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json; charset=UTF-8");header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

$sql = "SELECT 
            id_club,
            Nombre,
            Descripcion,
            Foto_url,
            id_profesor
        FROM club
        ORDER BY Nombre ASC";

$resultado = $conexion->query($sql);

$clubes = [];

while ($fila = $resultado->fetch_assoc()) {
    $clubes[] = $fila;
}

echo json_encode($clubes);
?>