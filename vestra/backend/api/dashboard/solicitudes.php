
<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

session_start();
require_once "../../config/conexion.php";

// Verificar sesión
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);

// Verificar ID del club
if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "error" => "ID del club no válido"
    ]);
    exit;
}

$id_club = intval($_GET["id"]);

// Verificar que el club pertenezca al profesor
$sqlClub = "SELECT id_club, Nombre
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

// Obtener solicitudes de inscripción pendientes
// y revisiones de fecha de ingreso pendientes
$sqlSolicitudes = "SELECT
    s.id_solicitud,
    s.id_usuario,
    s.id_club,
    s.carnet,
    s.correo,
    s.seccion,
    s.fecha,
    s.estado,
    s.tipo_membresia,
    s.fecha_ingreso_solicitada,
    s.fecha_ingreso_aprobada,
    s.estado_fecha_ingreso,
    u.Nombre,
    u.Foto_url,
    u.Bio
FROM solicitudclub s
INNER JOIN usuario u
    ON s.id_usuario = u.id_usuario
WHERE s.id_club = ?
  AND (
      s.estado = 'Pendiente'
      OR (
          s.estado = 'Aceptado'
          AND s.tipo_membresia = 'Antiguo'
          AND s.estado_fecha_ingreso = 'Pendiente'
      )
  )
ORDER BY s.fecha DESC";

$stmtSolicitudes = $conexion->prepare($sqlSolicitudes);
$stmtSolicitudes->bind_param("i", $id_club);
$stmtSolicitudes->execute();

$resultadoSolicitudes = $stmtSolicitudes->get_result();
$solicitudes = [];

while ($fila = $resultadoSolicitudes->fetch_assoc()) {
    $solicitudes[] = $fila;
}

// Respuesta
echo json_encode([
    "club" => $club,
    "total_solicitudes" => count($solicitudes),
    "solicitudes" => $solicitudes
]);

$stmtSolicitudes->close();
$stmtClub->close();

?>