<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();


/* Manejar OPTIONS */

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}


/* Verificar método */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido."
    ]);
    exit;
}


/* Verificar sesión */

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no autenticado."
    ]);
    exit;
}


/* Verificar ID del club */

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "success" => false,
        "message" => "ID del club no válido."
    ]);
    exit;
}


$id_usuario = intval($_SESSION["id_usuario"]);
$id_club = intval($_GET["id"]);


/* Verificar que el club es del profe */

$sqlClub = "SELECT id_club, Nombre
            FROM club
            WHERE id_club = ?
            AND id_profesor = ?";

$stmtClub = $conexion->prepare($sqlClub);
$stmtClub->bind_param("ii", $id_club, $id_usuario);
$stmtClub->execute();

$resultadoClub = $stmtClub->get_result();
$club = $resultadoClub->fetch_assoc();

$stmtClub->close();


if (!$club) {
    echo json_encode([
        "success" => false,
        "message" => "No tienes permiso para acceder a este club."
    ]);
    exit;
}


/* las 3 publis más nuevas nada más */

$sql = "SELECT
            p.id_publicacion,
            p.contenido,
            p.fecha,
            
            (
                SELECT COUNT(*)
                FROM likepublicacion lp
                WHERE lp.id_publicacion = p.id_publicacion
            ) AS likes,

            (
                SELECT COUNT(*)
                FROM comentario c
                WHERE c.id_publicacion = p.id_publicacion
            ) AS comentarios

        FROM publicacion p

        WHERE p.id_club = ?
        AND p.Estado != 'Eliminada'

        ORDER BY p.fecha DESC

        LIMIT 3";


$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

$publicaciones = [];


while ($fila = $resultado->fetch_assoc()) {

    $publicaciones[] = [
        "id_publicacion" => intval($fila["id_publicacion"]),
        "contenido" => $fila["contenido"],
        "fecha" => $fila["fecha"],
        "likes" => intval($fila["likes"]),
        "comentarios" => intval($fila["comentarios"])
    ];
}

$stmt->close();


/* Respuesta */

echo json_encode([
    "success" => true,
    "club" => $club,
    "publicaciones" => $publicaciones
]);


$conexion->close();

?>