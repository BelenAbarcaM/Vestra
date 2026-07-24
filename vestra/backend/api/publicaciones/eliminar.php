<?php

session_start();
include '../../config/conexion.php';

soloProfesor();

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
