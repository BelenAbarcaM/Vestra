<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/conexion.php";

$sql = "SELECT id_club, Nombre, Foto_url FROM club ORDER BY Nombre";

$resultado = $conexion->query($sql);

$clubes = [];

while ($fila = $resultado->fetch_assoc()) {
    $clubes[] = $fila;
}

echo json_encode($clubes);