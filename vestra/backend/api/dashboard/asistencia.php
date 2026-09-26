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

// Verificar ID del evento
if (!isset($_GET["id_evento"]) || !is_numeric($_GET["id_evento"])) {
    echo json_encode([
        "error" => "ID del evento no válido"
    ]);
    exit;
}

$id_evento = intval($_GET["id_evento"]);

/*
    Obtener evento y verificar que pertenece
    a un club del profesor
*/
$sqlEvento = "SELECT
                e.id_evento,
                e.id_club,
                e.titulo,
                e.fecha,
                e.hora_inicio,
                e.hora_fin,
                c.Nombre AS nombre_club
              FROM evento_club e
              INNER JOIN club c
                  ON e.id_club = c.id_club
              WHERE e.id_evento = ?
              AND c.id_profesor = ?";

$stmtEvento = $conexion->prepare($sqlEvento);
$stmtEvento->bind_param("ii", $id_evento, $id_usuario);
$stmtEvento->execute();

$resultadoEvento = $stmtEvento->get_result();
$evento = $resultadoEvento->fetch_assoc();

if (!$evento) {
    echo json_encode([
        "error" => "No tienes permiso para acceder a este evento"
    ]);
    exit;
}

$id_club = $evento["id_club"];

/*
    Obtener miembros del club y su asistencia
*/
$sqlMiembros = "SELECT
                    u.id_usuario,
                    u.Nombre,
                    u.Foto_url,
                    a.estado
                FROM inscripcion i

                INNER JOIN usuario u
                    ON i.id_usuario = u.id_usuario

                LEFT JOIN asistencia a
                    ON a.id_usuario = u.id_usuario
                    AND a.id_evento = ?

                WHERE i.id_club = ?

                ORDER BY u.Nombre ASC";

$stmtMiembros = $conexion->prepare($sqlMiembros);
$stmtMiembros->bind_param("ii", $id_evento, $id_club);
$stmtMiembros->execute();

$resultadoMiembros = $stmtMiembros->get_result();

$miembros = [];

while ($fila = $resultadoMiembros->fetch_assoc()) {

    // Si todavía no existe registro de asistencia,
    // aparece como Presente por defecto.
    if ($fila["estado"] === null) {
        $fila["estado"] = "Presente";
    }

    $miembros[] = $fila;
}

/*
    Respuesta
*/
echo json_encode([
    "evento" => $evento,
    "miembros" => $miembros
]);

?>