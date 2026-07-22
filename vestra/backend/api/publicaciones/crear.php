<?php

session_start();

include '../config/conexion.php';

$texto = $_POST['texto'];
$idClub = $_POST['club'];
$idUsuario = $_SESSION['id_usuario'];
//$imagen = $_FILES['imagen'];

if (empty($texto)){
    die("El contenido de la publicación es obligatorio.");
}
if (empty($idClub)){
    die("Debe seleccionar un club.");
}

$publi = "INSERT INTO publicacion (Texto, id_usuario, id_club)
            VALUES (?, ?, ?)";

$stmt = $conexion->prepare($publi);
$stmt->bind_param("sii", $texto, $idUsuario, $idclub);

?>

