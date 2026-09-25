<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

// Verificar sesión
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_usuario = intval($_SESSION["id_usuario"]);

// Verificar que venga el ID del club
if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "error" => "ID del club no válido"
    ]);
    exit;
}

$id_club = intval($_GET["id"]);

/*
    Verificar que el club pertenezca al profesor
*/
$sqlClub = "SELECT
                id_club,
                Nombre
            FROM club
            WHERE id_club = ?
            AND id_profesor = ?";

$stmtClub = $conexion->prepare($sqlClub);
$stmtClub->bind_param("ii", $id_club, $id_usuario);
$stmtClub->execute();

$resultadoClub = $stmtClub->get_result();
$club = $resultadoClub->fetch_assoc();

if (!$club) {
    echo json_encode([
        "error" => "No tienes permiso para acceder a este club"
    ]);
    exit;
}

/*
    Obtener miembros del club
*/
$sqlMiembros = "SELECT
                    u.id_usuario,
                    u.Nombre,
                    u.Correo,
                    u.Foto_url,
                    u.Bio,
                    i.fecha_ingreso,
                    i.anio_ingreso
                FROM inscripcion i
                INNER JOIN usuario u
                    ON i.id_usuario = u.id_usuario
                WHERE i.id_club = ?
                ORDER BY u.Nombre ASC";

$stmtMiembros = $conexion->prepare($sqlMiembros);
$stmtMiembros->bind_param("i", $id_club);
$stmtMiembros->execute();

$resultadoMiembros = $stmtMiembros->get_result();

$miembros = [];

while ($fila = $resultadoMiembros->fetch_assoc()) {
    $miembros[] = $fila;
}

/*
    Respuesta
*/
echo json_encode([
    "club" => $club,
    "total_miembros" => count($miembros),
    "miembros" => $miembros
]);

?>