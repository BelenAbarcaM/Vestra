<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_Comentario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id del comentario"
    ]);
    exit;
}

$id_Comentario = $data['id_Comentario'];


$eliminar = "UPDATE comentario
SET estado = 'Eliminado'
WHERE id_Comentario = ?
AND id_usuario = ?";

$stmt = $conexion->prepare($eliminar);
$stmt->bind_param("ii", $id_Comentario, $id_usuario);


if ($stmt->execute()) {

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "mensaje" => "Comentario eliminado correctamente"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "mensaje" => "No tienes permiso para eliminar este comentario o no existe"
        ]);
    }

} else {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error al eliminar el comentario"
    ]);
}

$stmt->close();
$conexion->close();