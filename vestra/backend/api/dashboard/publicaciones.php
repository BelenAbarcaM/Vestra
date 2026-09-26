<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

session_start();

require_once "../../config/conexion.php";


// verificar sesion
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);


// recibir los datos
$id_club = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
$rango = isset($_GET["rango"]) ? $_GET["rango"] : "12";

if ($id_club <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "ID de club inválido"
    ]);
    exit;
}


// validar rango
$rangoPermitido = ["7", "30", "3", "6", "9", "12"];

if (!in_array($rango, $rangoPermitido)) {
    $rango = "12";
}


// verificar que el club es del profe
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

$resultadoClub = $stmtClub->get_result();
$club = $resultadoClub->fetch_assoc();

if (!$club) {
    echo json_encode([
        "success" => false,
        "error" => "No tienes permiso para ver las publicaciones de este club"
    ]);
    exit;
}


//filtar pór fecha
if ($rango === "7") {

    $filtroFecha = "
        p.Fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ";

} elseif ($rango === "30") {

    $filtroFecha = "
        p.Fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ";

} else {

    $filtroFecha = "
        p.Fecha >= DATE_SUB(NOW(), INTERVAL $rango MONTH)
    ";
}


// obtener las publis
$sql = "
    SELECT
        p.id_publicacion,
        p.Texto,
        p.Fecha,
        p.imagen_url,

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
    AND $filtroFecha

    ORDER BY likes DESC, p.Fecha DESC
";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

$publicaciones = [];

$totalLikes = 0;
$totalComentarios = 0;

while ($fila = $resultado->fetch_assoc()) {

    $likes = intval($fila["likes"]);
    $comentarios = intval($fila["comentarios"]);

    $totalLikes += $likes;
    $totalComentarios += $comentarios;

    $publicaciones[] = [
        "id_publicacion" => intval($fila["id_publicacion"]),
        "texto" => $fila["Texto"],
        "fecha" => $fila["Fecha"],
        "imagen_url" => $fila["imagen_url"],
        "likes" => $likes,
        "comentarios" => $comentarios
    ];
}


// respuesta
echo json_encode([
    "success" => true,

    "club" => [
        "id_club" => intval($club["id_club"]),
        "Nombre" => $club["Nombre"]
    ],

    "rango" => is_numeric($rango)
        ? intval($rango)
        : $rango,

    "total_publicaciones" => count($publicaciones),

    "total_likes" => $totalLikes,

    "total_comentarios" => $totalComentarios,

    "publicaciones" => $publicaciones
]);

?>