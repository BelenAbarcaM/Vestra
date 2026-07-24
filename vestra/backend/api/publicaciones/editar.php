<?php

session_start();
include '../../config/conexion.php';

soloProfesor();

$idPubli = $_POST['id_publicacion'];
$texto = $_POST['texto'];
$idClub = $_POST['id_club'];
$idUsuario = $_SESSION['id_usuario'];
$imagen = $_FILES['imagen'];

if ($_FILES['imagen']['error'] == 0) {
    $imagen = $_FILES['imagen'];
    $nombreImagen = uniqid() . "_" . $imagen['name'];
    $rutaDestino = __DIR__ . "/../../../uploads/publicaciones/" . $nombreImagen;

    move_uploaded_file($imagen['tmp_name'], $rutaDestino);
} else {
    $sqlFoto = "SELECT Imagen_url
                FROM Publicacion
                WHERE id_publicacion = ?";

    $stmtFoto = $conexion->prepare($sqlFoto);
    $stmtFoto->bind_param("i", $idPublicacion);
    $stmtFoto->execute();

    $resultado = $stmtFoto->get_result();
    $publicacion = $resultado->fetch_assoc();

    $nombreImagen = $publicacion['Imagen_url'];
}

$edit = "UPDATE publicacion
SET
    Texto = ?,
    id_usuario = ?,
    id_club = ?,
    Imagen_url = ?
WHERE id_publicacion = ?";

$stmt = $conexion->prepare($edit);
$stmt->bind_param("siis", $texto, $idUsuario, $idClub, $nombreImagen, $idPublicacion);

if ($stmt->execute()) {
    echo "Publicación actualizada correctamente.";
} else {
    echo "Error: " . $stmt->error;
}
?>
