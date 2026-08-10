<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");


$idPubli = $_POST['id_publicacion'];
if (empty($idPubli)) {
    die("Debe indicar la publicación.");
}

$eliminar = "UPDATE Publicacion
SET Estado = 'Eliminada'
WHERE id_publicacion = ?";

$stmt = $conexion->prepare($eliminar);
$stmt->bind_param("i", $idPubli);


if ($stmt->execute()) {
    echo "Publicación eliminada correctamente.";
} else {
    echo "Error al eliminar la publicación: " . $stmt->error;
}

$stmt->close();
$conexion->close();