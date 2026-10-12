<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

$idPubli = $_POST['id_publicacion'];
$texto = $_POST['texto'];
$idClub = $_POST['id_club'];
$idUsuario = $_SESSION['id_usuario'];
$imagen = $_FILES['imagen'];

if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
    $imagen = $_FILES['imagen'];
    $nombreImagen = uniqid() . "_" . $imagen['name'];
    $rutaDestino = __DIR__ . "/../../../uploads/publicaciones/" . $nombreImagen;

    move_uploaded_file($imagen['tmp_name'], $rutaDestino);
} else {
    $sqlFoto = "SELECT imagen_url
                FROM Publicacion
                WHERE id_publicacion = ?";

    $stmtFoto = $conexion->prepare($sqlFoto);
    $stmtFoto->bind_param("i", $idPubli);
    $stmtFoto->execute();

    $resultado = $stmtFoto->get_result();
    $publicacion = $resultado->fetch_assoc();

    $nombreImagen = $publicacion['imagen_url'];
}

$edit = "UPDATE publicacion
SET
    Texto = ?,
    id_usuario = ?,
    id_club = ?,
    imagen_url = ?
WHERE id_publicacion = ?";

$stmt = $conexion->prepare($edit);
$stmt->bind_param("siisi", $texto, $idUsuario, $idClub, $nombreImagen, $idPubli);

if ($stmt->execute()) {
    echo "Publicación actualizada correctamente.";
} else {
    echo "Error: " . $stmt->error;
}
?>