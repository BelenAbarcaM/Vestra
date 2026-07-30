<?php

session_start();

include '../../config/conexion.php';

$texto = $_POST['texto'];
$idClub = $_POST['id_club'];;
$idUsuario = 1;
$imagen = $_FILES['imagen'];
$nombreImagen = uniqid() . "_" . $imagen['name'];
$rutaDestino = "../../../uploads/publicaciones/" . $nombreImagen;
move_uploaded_file(
    $imagen['tmp_name'],
    $rutaDestino
);


if (empty($texto)){
    die("El contenido de la publicación es obligatorio.");
}
if (empty($idClub)){
    die("Debe seleccionar un club.");
}

$publi = "INSERT INTO publicacion (Texto, id_usuario, id_club, imagen_url)
            VALUES (?, ?, ?, ?)";

$stmt = $conexion->prepare($publi);
$stmt->bind_param("siis", $texto, $idUsuario, $idClub, $nombreImagen);


if ($stmt->execute()) {
    echo "Publicación creada correctamente";
} else {
    echo "Error al crear publicación: " . $stmt->error;
}
?>

