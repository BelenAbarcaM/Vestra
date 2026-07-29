<?php

session_start();
include '../../config/conexion.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_publicacion'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id de la publicación"
    ]);
    exit;
}

$id_publicacion = $data['id_publicacion'];

$sql = "SELECT
            c.id_Comentario,
            c.texto,
            c.fecha,
            u.Nombre AS usuario,
            u.Foto_url AS foto_usuario
        FROM comentario c
        INNER JOIN Usuario u
            ON c.id_usuario = u.id_usuario
        WHERE c.id_publicacion = ?
        AND c.estado = 'Visible'
        ORDER BY likes DESC, p.Fecha DESC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_publicacion);
$stmt->execute();

$resultado = $stmt->get_result();

$comentarios = [];

while ($fila = $resultado->fetch_assoc()) {
    $comentarios[] = $fila;
}

echo json_encode($comentarios);

$stmt->close();
$conexion->close();