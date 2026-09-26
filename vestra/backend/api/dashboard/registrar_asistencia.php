<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
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

$id_profesor = intval($_SESSION["id_usuario"]);

/*
    Recibir datos enviados desde React
*/
$id_evento = $_POST["id_evento"] ?? null;
$id_usuario = $_POST["id_usuario"] ?? null;
$estado = $_POST["estado"] ?? null;


/*
    Validar datos
*/
if (
    !$id_evento ||
    !$id_usuario ||
    !$estado
) {
    echo json_encode([
        "error" => "Faltan datos obligatorios"
    ]);
    exit;
}

if (!is_numeric($id_evento) || !is_numeric($id_usuario)) {
    echo json_encode([
        "error" => "Los IDs no son válidos"
    ]);
    exit;
}

$id_evento = intval($id_evento);
$id_usuario = intval($id_usuario);


/*
    Validar estado
*/
$estadosPermitidos = [
    "Presente",
    "Ausente",
    "Justificado"
];

if (!in_array($estado, $estadosPermitidos)) {
    echo json_encode([
        "error" => "Estado de asistencia no válido"
    ]);
    exit;
}


/*
    Verificar que el evento pertenezca
    a un club del profesor
*/
$sqlEvento = "SELECT
                e.id_evento,
                e.id_club
              FROM evento_club e
              INNER JOIN club c
                  ON e.id_club = c.id_club
              WHERE e.id_evento = ?
              AND c.id_profesor = ?";

$stmtEvento = $conexion->prepare($sqlEvento);
$stmtEvento->bind_param("ii", $id_evento, $id_profesor);
$stmtEvento->execute();

$resultadoEvento = $stmtEvento->get_result();
$evento = $resultadoEvento->fetch_assoc();

if (!$evento) {
    echo json_encode([
        "error" => "No tienes permiso para modificar este evento"
    ]);
    exit;
}

$id_club = $evento["id_club"];


/*
    Verificar que el estudiante pertenezca
    al club del evento
*/
$sqlMiembro = "SELECT id_usuario
               FROM inscripcion
               WHERE id_usuario = ?
               AND id_club = ?";

$stmtMiembro = $conexion->prepare($sqlMiembro);
$stmtMiembro->bind_param("ii", $id_usuario, $id_club);
$stmtMiembro->execute();

$resultadoMiembro = $stmtMiembro->get_result();

if ($resultadoMiembro->num_rows === 0) {
    echo json_encode([
        "error" => "El estudiante no pertenece a este club"
    ]);
    exit;
}


/*
    Crear o actualizar asistencia
*/
$sqlAsistencia = "INSERT INTO asistencia (
                    id_evento,
                    id_usuario,
                    estado
                  )
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    estado = VALUES(estado)";

$stmtAsistencia = $conexion->prepare($sqlAsistencia);
$stmtAsistencia->bind_param(
    "iis",
    $id_evento,
    $id_usuario,
    $estado
);

if ($stmtAsistencia->execute()) {

    echo json_encode([
        "success" => true,
        "mensaje" => "Asistencia registrada correctamente",
        "id_evento" => $id_evento,
        "id_usuario" => $id_usuario,
        "estado" => $estado
    ]);

} else {

    echo json_encode([
        "success" => false,
        "error" => "No se pudo registrar la asistencia"
    ]);
}

?>