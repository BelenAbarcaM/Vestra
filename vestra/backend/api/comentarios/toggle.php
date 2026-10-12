<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_comentario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id del comentario"
    ]);
    exit;
}

$id_comentario = $data['id_comentario'];

$sql = "SELECT id_likes
        FROM likecomentario
        WHERE id_usuario = ? AND id_comentario = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_comentario);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {

    $sql = "DELETE FROM likecomentario
            WHERE id_usuario = ? AND id_comentario = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("ii", $id_usuario, $id_comentario);
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "liked" => false,
        "mensaje" => "Like eliminado"
    ]);

} else {

    $sql = "INSERT INTO likecomentario (id_usuario, id_comentario)
            VALUES (?, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("ii", $id_usuario, $id_comentario);
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "liked" => true,
        "mensaje" => "Like agregado"
    ]);
}

$stmt->close();
$conexion->close();