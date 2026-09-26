<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

session_start();

require_once "../../config/conexion.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);

$id_club = isset($_GET["id"]) ? intval($_GET["id"]) : 0;

if ($id_club <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "Debes indicar el ID del club."
    ]);
    exit;
}


/*verifdicra que el club es del profe*/

$sqlClub = "
    SELECT
        id_club,
        Nombre
    FROM club
    WHERE id_club = ?
    AND id_profesor = ?
";

$stmtClub = $conexion->prepare($sqlClub);
$stmtClub->bind_param("ii", $id_club, $id_profesor);
$stmtClub->execute();

$club = $stmtClub->get_result()->fetch_assoc();

if (!$club) {
    echo json_encode([
        "success" => false,
        "error" => "No tienes permiso para consultar este club."
    ]);
    exit;
}


/*filtarr por mes y año*/

$mes = isset($_GET["mes"]) ? intval($_GET["mes"]) : 0;
$anio = isset($_GET["anio"]) ? intval($_GET["anio"]) : 0;


/*obtener los eventos*/

if ($mes >= 1 && $mes <= 12 && $anio > 0) {

    $sql = "
        SELECT
            id_evento,
            id_club,
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin,
            tipo
        FROM evento_club
        WHERE id_club = ?
        AND MONTH(fecha) = ?
        AND YEAR(fecha) = ?
        ORDER BY fecha ASC, hora_inicio ASC
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("iii", $id_club, $mes, $anio);

} else {

    $sql = "
        SELECT
            id_evento,
            id_club,
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin,
            tipo
        FROM evento_club
        WHERE id_club = ?
        ORDER BY fecha ASC, hora_inicio ASC
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $id_club);
}

$stmt->execute();

$resultado = $stmt->get_result();

$eventos = [];

while ($fila = $resultado->fetch_assoc()) {

    $eventos[] = [
        "id_evento" => intval($fila["id_evento"]),
        "id_club" => intval($fila["id_club"]),
        "titulo" => $fila["titulo"],
        "descripcion" => $fila["descripcion"],
        "fecha" => $fila["fecha"],
        "hora_inicio" => $fila["hora_inicio"],
        "hora_fin" => $fila["hora_fin"],
        "tipo" => $fila["tipo"]
    ];
}


echo json_encode([
    "success" => true,
    "club" => $club,
    "total_eventos" => count($eventos),
    "eventos" => $eventos
]);

?>