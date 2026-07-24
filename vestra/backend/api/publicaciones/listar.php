<?php

session_start();
include '../../config/conexion.php';

$sql = "SELECT
            p.id_publicacion AS id,
            p.Texto AS texto,
            p.Fecha AS fecha,
            CONCAT('uploads/publicaciones/', p.Imagen_url) AS imagen,
            u.Nombre AS usuario,
            u.Foto_url AS foto_usuario,
            c.Nombre AS club
        FROM Publicacion p
        INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
        INNER JOIN Club c ON p.id_club = c.id_club
        WHERE p.Estado = 'Visible'
        ORDER BY p.Fecha DESC";

$resultado = $conexion->query($sql);

if (!$resultado) {
    die("Error en la consulta: " . $conexion->error);
}

$publicaciones = [];

while ($fila = $resultado->fetch_assoc()) {
    $publicaciones[] = $fila;
}

header("Content-Type: application/json");
echo json_encode($publicaciones);

$conexion->close();
