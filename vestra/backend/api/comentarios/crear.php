<?php

session_start();
include '../../config/conexion.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_publicacion']) || !isset($data['texto'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Faltan datos"
    ]);
    exit;
}

$id_publicacion = $data['id_publicacion'];
$texto = trim($data['texto']);


if ($texto == "") {
    echo json_encode([
        "success" => false,
        "mensaje" => "El comentario no puede estar vacío"
    ]);
    exit;
}

$sql = "INSERT INTO comentario (texto, id_usuario, id_publicacion, estado)
        VALUES (?, ?, ?, 'Visible')";

        $stmt = $conexion->prepare($sql);
$stmt->bind_param("sii", $texto, $id_usuario, $id_publicacion);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "mensaje" => "Comentario agregado correctamente"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error al agregar el comentario"
    ]);
}

$stmt->close();
$conexion->close();
