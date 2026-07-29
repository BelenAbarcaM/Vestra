<?php

session_start();
include '../../config/conexion.php';

$id_usuario = $_SESSION['id_usuario'];
$listar = "SELECT
            p.id_publicacion AS id,
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
            p.Texto,
            p.Fecha,
            p.Imagen_url,
            u.Nombre,
            u.Foto_url,
            c.Nombre

        ORDER BY p.Fecha DESC";

$resultado = $conexion->query($listar);

if (!$resultado) {
    die("Error en la consulta: " . $conexion->error);
}

$publicaciones = [];

while ($fila = $resultado->fetch_assoc()) {
    $publicaciones[] = $fila;
}

header("Content-Type: application/json");
echo json_encode($publicaciones);

$conexion->close();
