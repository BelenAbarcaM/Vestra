<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido."
    ]);
    exit;
}

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no autenticado."
    ]);
    exit;
}

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "success" => false,
        "message" => "ID del club no válido."
    ]);
    exit;
}

$id_usuario = intval($_SESSION["id_usuario"]);
$id_club = intval($_GET["id"]);


/* Verificar que el club pertenece al profesor */

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


/* Obtener crecimiento mensual */

$sql = "SELECT
            DATE_FORMAT(fecha_ingreso, '%Y-%m') AS periodo,
            DATE_FORMAT(fecha_ingreso, '%M %Y') AS mes,
            COUNT(*) AS nuevos_miembros
        FROM inscripcion
        WHERE id_club = ?
        GROUP BY
            DATE_FORMAT(fecha_ingreso, '%Y-%m'),
            DATE_FORMAT(fecha_ingreso, '%M %Y')
        ORDER BY periodo ASC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

$crecimiento = [];
$total_acumulado = 0;

while ($fila = $resultado->fetch_assoc()) {

    $nuevos = intval($fila["nuevos_miembros"]);

    $total_acumulado += $nuevos;

    $crecimiento[] = [
        "periodo" => $fila["periodo"],
        "mes" => $fila["mes"],
        "nuevos_miembros" => $nuevos,
        "total_miembros" => $total_acumulado
    ];
}

$stmt->close();


/* Total actual */

$sqlTotal = "SELECT COUNT(*) AS total
             FROM inscripcion
             WHERE id_club = ?";

$stmtTotal = $conexion->prepare($sqlTotal);
$stmtTotal->bind_param("i", $id_club);
$stmtTotal->execute();

$resultadoTotal = $stmtTotal->get_result();
$total = $resultadoTotal->fetch_assoc();

$stmtTotal->close();


/* Respuesta */

echo json_encode([
    "success" => true,
    "club" => $club,
    "total_actual" => intval($total["total"]),
    "crecimiento" => $crecimiento
]);

$conexion->close();

?>