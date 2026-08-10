<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

$idClub = $_POST['id_club'];

if (empty($idClub)) {
    die("Debe seleccionar un club.");
}
$obtener = "SELECT
            p.id_publicacion AS id,
            p.Texto AS texto,
            p.Fecha AS fecha,
            CONCAT('uploads/publicaciones/', p.imagen_url) AS imagen,
            u.Nombre AS usuario,
            u.Foto_url AS foto_usuario,
            c.Nombre AS club
        FROM Publicacion p
        INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
        INNER JOIN Club c ON p.id_club = c.id_club
        WHERE p.Estado = 'Visible'
        AND p.id_club = ?
        ORDER BY p.Fecha DESC";


$stmt = $conexion->prepare($obtener);

$stmt->bind_param("i", $idClub);

$stmt->execute();

$resultado = $stmt->get_result();

$publicaciones = [];

while ($fila = $resultado->fetch_assoc()) {
    $publicaciones[] = $fila;
}

header("Content-Type: application/json");

echo json_encode($publicaciones);