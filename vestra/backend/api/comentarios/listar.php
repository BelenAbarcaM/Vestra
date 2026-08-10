<?php

include '../../config/conexion.php';

session_start();

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

if (!isset($data['id_publicacion'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id de la publicación"
    ]);
    exit;
}

$id_publicacion = $data['id_publicacion'];

$sql = "SELECT
            c.id_comentario,
            c.texto,
            c.fecha,
            u.Nombre AS usuario,
            u.Foto_url AS foto_usuario,

            COUNT(lc.id_likes) AS likes,

            MAX(
                CASE
                    WHEN lc.id_usuario = ? THEN 1
                    ELSE 0
                END
            ) AS liked

        FROM Comentario c

        INNER JOIN Usuario u
            ON c.id_usuario = u.id_usuario

        LEFT JOIN likecomentario lc
            ON c.id_comentario = lc.id_comentario

        WHERE c.id_publicacion = ?
        AND c.estado = 'Visible'

        GROUP BY
            c.id_comentario,
            c.texto,
            c.fecha,
            u.Nombre,
            u.Foto_url

        ORDER BY likes DESC, c.fecha DESC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_publicacion);
$stmt->execute();

$resultado = $stmt->get_result();

$comentarios = [];

while ($fila = $resultado->fetch_assoc()) {
    $comentarios[] = $fila;
}

echo json_encode($comentarios);

$stmt->close();
$conexion->close();