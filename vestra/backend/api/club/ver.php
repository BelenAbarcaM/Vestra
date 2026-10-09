<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/conexion.php";

$id_club = $_GET["id"];

$sql = "SELECT
            club.id_club,
            club.Nombre,
            club.Descripcion,
            club.Foto_url,
            usuario.Nombre AS profesor
        FROM club
        INNER JOIN usuario
        ON club.id_profesor = usuario.id_usuario
        WHERE club.id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

echo json_encode($resultado->fetch_assoc());