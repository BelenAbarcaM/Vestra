<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

// verificar sesion

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);


// verificaR EL ID club

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "error" => "ID del club no válido"
    ]);
    exit;
}

$id_club = intval($_GET["id"]);


//verificAR Q SI sea del profe

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


// total de miembros

$sqlMiembros = "SELECT COUNT(*) AS total
                FROM inscripcion
                WHERE id_club = ?";

$stmtMiembros = $conexion->prepare($sqlMiembros);
$stmtMiembros->bind_param("i", $id_club);
$stmtMiembros->execute();

$totalMiembros = intval(
    $stmtMiembros->get_result()->fetch_assoc()["total"]
);


// solicitudes opendientes

$sqlSolicitudes = "SELECT COUNT(*) AS total
                   FROM solicitudclub
                   WHERE id_club = ?
                   AND estado = 'Pendiente'";

$stmtSolicitudes = $conexion->prepare($sqlSolicitudes);
$stmtSolicitudes->bind_param("i", $id_club);
$stmtSolicitudes->execute();

$solicitudesPendientes = intval(
    $stmtSolicitudes->get_result()->fetch_assoc()["total"]
);


// total de publis

$sqlPublicaciones = "SELECT COUNT(*) AS total
                     FROM publicacion
                     WHERE id_club = ?
                     AND Estado != 'Eliminada'";

$stmtPublicaciones = $conexion->prepare($sqlPublicaciones);
$stmtPublicaciones->bind_param("i", $id_club);
$stmtPublicaciones->execute();

$totalPublicaciones = intval(
    $stmtPublicaciones->get_result()->fetch_assoc()["total"]
);


// total de likes

$sqlLikes = "SELECT COUNT(*) AS total
             FROM likepublicacion lp
             INNER JOIN publicacion p
                 ON lp.id_publicacion = p.id_publicacion
             WHERE p.id_club = ?
             AND p.Estado != 'Eliminada'";

$stmtLikes = $conexion->prepare($sqlLikes);
$stmtLikes->bind_param("i", $id_club);
$stmtLikes->execute();

$totalLikes = intval(
    $stmtLikes->get_result()->fetch_assoc()["total"]
);


// total de comentarios

$sqlComentarios = "SELECT COUNT(*) AS total
                   FROM comentario c
                   INNER JOIN publicacion p
                       ON c.id_publicacion = p.id_publicacion
                   WHERE p.id_club = ?
                   AND p.Estado != 'Eliminada'";

$stmtComentarios = $conexion->prepare($sqlComentarios);
$stmtComentarios->bind_param("i", $id_club);
$stmtComentarios->execute();

$totalComentarios = intval(
    $stmtComentarios->get_result()->fetch_assoc()["total"]
);


// proximo evento

$sqlProximoEvento = "SELECT
                        id_evento,
                        titulo,
                        descripcion,
                        fecha,
                        hora_inicio,
                        hora_fin,
                        tipo
                      FROM evento_club
                      WHERE id_club = ?
                      AND fecha >= CURDATE()
                      ORDER BY fecha ASC, hora_inicio ASC
                      LIMIT 1";

$stmtProximoEvento = $conexion->prepare($sqlProximoEvento);
$stmtProximoEvento->bind_param("i", $id_club);
$stmtProximoEvento->execute();

$proximoEvento = $stmtProximoEvento
    ->get_result()
    ->fetch_assoc();


//porcentaje de asietncia

$sqlAsistencia = "SELECT
                    COUNT(*) AS total,
                    SUM(
                        CASE
                            WHEN a.estado = 'Presente'
                            THEN 1
                            ELSE 0
                        END
                    ) AS presentes
                  FROM asistencia a
                  INNER JOIN evento_club e
                      ON a.id_evento = e.id_evento
                  WHERE e.id_club = ?";

$stmtAsistencia = $conexion->prepare($sqlAsistencia);
$stmtAsistencia->bind_param("i", $id_club);
$stmtAsistencia->execute();

$datosAsistencia = $stmtAsistencia
    ->get_result()
    ->fetch_assoc();

$totalAsistencia = intval($datosAsistencia["total"]);
$totalPresentes = intval($datosAsistencia["presentes"]);

$porcentajeAsistencia = 0;

if ($totalAsistencia > 0) {
    $porcentajeAsistencia = round(
        ($totalPresentes / $totalAsistencia) * 100,
        2
    );
}


// respuesta

echo json_encode([
    "club" => $club,

    "resumen" => [
        "total_miembros" => $totalMiembros,
        "solicitudes_pendientes" => $solicitudesPendientes,
        "total_publicaciones" => $totalPublicaciones,
        "total_likes" => $totalLikes,
        "total_comentarios" => $totalComentarios,
        "porcentaje_asistencia" => $porcentajeAsistencia
    ],

    "proximo_evento" => $proximoEvento
]);

?>