<?php

session_start();
include '../../config/conexion.php';

header('Content-Type: application/json');

// Verificar que el usuario haya iniciado sesión
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

// Obtener el id de la publicación
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_publicacion'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id de la publicación"
    ]);
    exit;
}

$id_publicacion = $data['id_publicacion'];

// Verificar si ya existe el like
$sql = "SELECT id_likes
        FROM likepublicacion
        WHERE id_usuario = ? AND id_publicacion = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_publicacion);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {

    // Ya existe → quitar like
    $sql = "DELETE FROM likepublicacion
            WHERE id_usuario = ? AND id_publicacion = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("ii", $id_usuario, $id_publicacion);
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "liked" => false,
        "mensaje" => "Like eliminado"
    ]);

} else {

    // No existe → agregar like
    $sql = "INSERT INTO likepublicacion (id_usuario, id_publicacion)
            VALUES (?, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("ii", $id_usuario, $id_publicacion);
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "liked" => true,
        "mensaje" => "Like agregado"
    ]);
}

$stmt->close();
$conexion->close();
