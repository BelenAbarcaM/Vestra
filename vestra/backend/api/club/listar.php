<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

$sql = "SELECT id_club, Nombre, Foto_url FROM club ORDER BY Nombre";

$resultado = $conexion->query($sql);

$clubes = [];

while ($fila = $resultado->fetch_assoc()) {
    $clubes[] = $fila;
}

echo json_encode($clubes);