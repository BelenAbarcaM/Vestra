<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../../config/conexion.php';

// Comprobar que el usuario inició sesión
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado"
    ]);
    exit;
}

// Datos del usuario conectado
$id_usuario = (int) $_SESSION['id_usuario'];
$tipo_usuario = isset($_SESSION['tipo'])
    ? (int) $_SESSION['tipo']
    : (isset($_SESSION['id_tipo_usuario'])
        ? (int) $_SESSION['id_tipo_usuario']
        : null);

// Consultar publicaciones
$listar = "SELECT
                p.id_publicacion AS id,
                p.id_usuario,
                p.id_club,
                p.Texto AS texto,
                p.Fecha AS fecha,
                CONCAT('uploads/publicaciones/', p.Imagen_url) AS imagen,
                u.Nombre AS usuario,
                u.Foto_url AS foto_usuario,
                c.Nombre AS club,
                COUNT(lp.id_likes) AS likes,
                MAX(
                    CASE
                        WHEN lp.id_usuario = $id_usuario THEN 1
                        ELSE 0
                    END
                ) AS liked
            FROM Publicacion p
            INNER JOIN Usuario u
                ON p.id_usuario = u.id_usuario
            INNER JOIN Club c
                ON p.id_club = c.id_club
            LEFT JOIN likepublicacion lp
                ON p.id_publicacion = lp.id_publicacion
            WHERE p.Estado = 'Visible'
            GROUP BY
                p.id_publicacion,
                p.id_usuario,
                p.id_club,
                p.Texto,
                p.Fecha,
                p.Imagen_url,
                u.Nombre,
                u.Foto_url,
                c.Nombre
            ORDER BY p.Fecha DESC";

$resultado = $conexion->query($listar);

if (!$resultado) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error en la consulta: " . $conexion->error
    ]);
    $conexion->close();
    exit;
}

$publicaciones = [];

while ($fila = $resultado->fetch_assoc()) {
    $publicaciones[] = $fila;
}

echo json_encode([
    "success" => true,

    // Información del usuario conectado
    "usuario_actual" => [
        "id_usuario" => $id_usuario,
        "id_tipo_usuario" => $tipo_usuario
    ],

    // Publicaciones del feed
    "publicaciones" => $publicaciones
]);

$conexion->close();
?>
