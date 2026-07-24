<?php

session_start();
include '../../config/conexion.php';

SELECT
    p.id_publicacion,
    p.Texto,
    p.Fecha,
    p.imagen_url,
    u.Nombre AS usuario,
    c.Nombre AS club
FROM Publicacion p
INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
INNER JOIN Club c ON p.id_club = c.id_club
WHERE p.Estado = 'Visible'
ORDER BY p.Fecha DESC;

$resultado = $conexion->query($sql);


$publicaciones = [];
while ($fila = $resultado->fetch_assoc()) {
    $publicaciones[] = $fila;
}

header("Content-Type: application/json");
echo json_encode($publicaciones);
