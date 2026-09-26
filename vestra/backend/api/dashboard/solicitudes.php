<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();


//erificar sesion

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);


//verificar el id club

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "error" => "ID del club no válido"
    ]);
    exit;
}

$id_club = intval($_GET["id"]);


//verificar q sea del profe

$sqlClub = "SELECT
                id_club,
                Nombre
            FROM club
            WHERE id_club = ?
            AND id_profesor = ?";

$stmtClub = $conexion->prepare($sqlClub);
$stmtClub->bind_param("ii", $id_club, $id_profesor);
$stmtClub->execute();

$resultadoClub = $stmtClub->get_result();
$club = $resultadoClub->fetch_assoc();

if (!$club) {
    echo json_encode([
        "error" => "No tienes permiso para acceder a este club"
    ]);
    exit;
}


//obtener las solis pendientes
$sqlSolicitudes = "SELECT
                        s.id_solicitud,
                        s.id_usuario,
                        s.carnet,
                        s.correo,
                        s.seccion,
                        s.fecha,
                        s.estado,

                        u.Nombre,
                        u.Foto_url,
                        u.Bio

                   FROM solicitudclub s

                   INNER JOIN usuario u
                       ON s.id_usuario = u.id_usuario

                   WHERE s.id_club = ?
                   AND s.estado = 'Pendiente'

                   ORDER BY s.fecha DESC";

$stmtSolicitudes = $conexion->prepare($sqlSolicitudes);
$stmtSolicitudes->bind_param("i", $id_club);
$stmtSolicitudes->execute();

$resultadoSolicitudes = $stmtSolicitudes->get_result();

$solicitudes = [];

while ($fila = $resultadoSolicitudes->fetch_assoc()) {

    $solicitudes[] = $fila;
}


//respuesta

echo json_encode([
    "club" => $club,
    "total_solicitudes" => count($solicitudes),
    "solicitudes" => $solicitudes
]);

?>