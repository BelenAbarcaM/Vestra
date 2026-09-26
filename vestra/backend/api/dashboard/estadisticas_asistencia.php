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

$id_profesor = intval($_SESSION["id_usuario"]);

// Verificar ID del club
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


/*
    1.Miembros
*/
$sqlMiembros = "SELECT COUNT(*) AS total
                FROM inscripcion
                WHERE id_club = ?";

$stmtMiembros = $conexion->prepare($sqlMiembros);
$stmtMiembros->bind_param("i", $id_club);
$stmtMiembros->execute();

$totalMiembros = $stmtMiembros
    ->get_result()
    ->fetch_assoc()["total"];


/*
    2.Estadisticas generales
*/
$sqlEstados = "SELECT
                    SUM(CASE WHEN a.estado = 'Presente' THEN 1 ELSE 0 END) AS presentes,
                    SUM(CASE WHEN a.estado = 'Ausente' THEN 1 ELSE 0 END) AS ausentes,
                    SUM(CASE WHEN a.estado = 'Justificado' THEN 1 ELSE 0 END) AS justificados,
                    COUNT(*) AS total_registros
               FROM asistencia a
               INNER JOIN evento_club e
                   ON a.id_evento = e.id_evento
               WHERE e.id_club = ?";

$stmtEstados = $conexion->prepare($sqlEstados);
$stmtEstados->bind_param("i", $id_club);
$stmtEstados->execute();

$estados = $stmtEstados
    ->get_result()
    ->fetch_assoc();

$presentes = intval($estados["presentes"]);
$ausentes = intval($estados["ausentes"]);
$justificados = intval($estados["justificados"]);
$totalRegistros = intval($estados["total_registros"]);


/*
    3.Porcentaje de Asisetncia
*/
$porcentajeAsistencia = 0;

if ($totalRegistros > 0) {
    $porcentajeAsistencia =
        round(($presentes / $totalRegistros) * 100, 2);
}


/*
    4.Asistencia por evento
*/
$sqlEventos = "SELECT
                    e.id_evento,
                    e.titulo,
                    e.fecha,

                    COUNT(a.id_asistencia) AS total_registros,

                    SUM(
                        CASE
                            WHEN a.estado = 'Presente'
                            THEN 1
                            ELSE 0
                        END
                    ) AS presentes,

                    SUM(
                        CASE
                            WHEN a.estado = 'Ausente'
                            THEN 1
                            ELSE 0
                        END
                    ) AS ausentes,

                    SUM(
                        CASE
                            WHEN a.estado = 'Justificado'
                            THEN 1
                            ELSE 0
                        END
                    ) AS justificados

                FROM evento_club e

                LEFT JOIN asistencia a
                    ON e.id_evento = a.id_evento

                WHERE e.id_club = ?

                GROUP BY
                    e.id_evento,
                    e.titulo,
                    e.fecha

                ORDER BY e.fecha ASC";

$stmtEventos = $conexion->prepare($sqlEventos);
$stmtEventos->bind_param("i", $id_club);
$stmtEventos->execute();

$resultadoEventos = $stmtEventos->get_result();

$eventos = [];

while ($fila = $resultadoEventos->fetch_assoc()) {

    $total = intval($fila["total_registros"]);
    $presentesEvento = intval($fila["presentes"]);

    $porcentajeEvento = 0;

    if ($total > 0) {
        $porcentajeEvento =
            round(($presentesEvento / $total) * 100, 2);
    }

    $eventos[] = [
        "id_evento" => intval($fila["id_evento"]),
        "titulo" => $fila["titulo"],
        "fecha" => $fila["fecha"],
        "presentes" => $presentesEvento,
        "ausentes" => intval($fila["ausentes"]),
        "justificados" => intval($fila["justificados"]),
        "porcentaje_asistencia" => $porcentajeEvento
    ];
}


/*
    Respuesta
*/
echo json_encode([
    "club" => $club,

    "resumen" => [
        "total_miembros" => intval($totalMiembros),
        "presentes" => $presentes,
        "ausentes" => $ausentes,
        "justificados" => $justificados,
        "total_registros" => $totalRegistros,
        "porcentaje_asistencia" => $porcentajeAsistencia
    ],

    "eventos" => $eventos
]);

?>