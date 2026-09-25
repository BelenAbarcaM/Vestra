<?php

header("Content-Type: application/json; charset=UTF-8");

header("Access-Control-Allow-Origin: http://localhost:3000");

header("Access-Control-Allow-Methods: GET");

header("Access-Control-Allow-Headers: Content-Type");

header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

// Verificar que el usuario esté logueado
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
Verificar que el club pertenece al profesor
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

// Si el club no pertenece al profesor
if (!$club) {

    echo json_encode([
        "error" => "No tienes permiso para acceder a este club"
    ]);

    exit;
}

/*
Obtener eventos del club
*/

$sqlEventos = "SELECT
                    id_evento,
                    titulo,
                    descripcion,
                    fecha,
                    hora_inicio,
                    hora_fin,
                    tipo
                FROM evento_club
                WHERE id_club = ?
                ORDER BY fecha ASC, hora_inicio ASC";

$stmtEventos = $conexion->prepare($sqlEventos);

$stmtEventos->bind_param("i", $id_club);

$stmtEventos->execute();

$resultadoEventos = $stmtEventos->get_result();

$eventos = [];

while ($fila = $resultadoEventos->fetch_assoc()) {

    $eventos[] = $fila;
}

/*
Devolver información
*/

echo json_encode([
    "club" => $club,
    "eventos" => $eventos
]);

?>