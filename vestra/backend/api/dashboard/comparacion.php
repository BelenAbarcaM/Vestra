<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();


/* Manejar OPTIONS */

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}


/* Verificar método */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido."
    ]);
    exit;
}


/* Verificar sesión */

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no autenticado."
    ]);
    exit;
}


/* Verificar ID del club */

if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "success" => false,
        "message" => "ID del club no válido."
    ]);
    exit;
}


$id_usuario = intval($_SESSION["id_usuario"]);
$id_club = intval($_GET["id"]);


/* Verificar que el club esdel profesor */

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


/* Obtener fechas de los dos meses*/

$mesActual = date("Y-m");
$mesAnterior = date("Y-m", strtotime("-1 month"));

$inicioActual = date("Y-m-01");
$inicioAnterior = date("Y-m-01", strtotime("-1 month"));

$inicioSiguiente = date("Y-m-01", strtotime("+1 month"));


/*nuevos miembros*/

$sql = "SELECT COUNT(*) AS total
        FROM inscripcion
        WHERE id_club = ?
        AND fecha_ingreso >= ?
        AND fecha_ingreso < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioActual,
    $inicioSiguiente
);

$stmt->execute();

$resultado = $stmt->get_result();
$nuevosActual = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


$sql = "SELECT COUNT(*) AS total
        FROM inscripcion
        WHERE id_club = ?
        AND fecha_ingreso >= ?
        AND fecha_ingreso < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioAnterior,
    $inicioActual
);

$stmt->execute();

$resultado = $stmt->get_result();
$nuevosAnterior = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


/* eventos*/

$sql = "SELECT COUNT(*) AS total
        FROM evento_club
        WHERE id_club = ?
        AND fecha >= ?
        AND fecha < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioActual,
    $inicioSiguiente
);

$stmt->execute();

$resultado = $stmt->get_result();
$eventosActual = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


$sql = "SELECT COUNT(*) AS total
        FROM evento_club
        WHERE id_club = ?
        AND fecha >= ?
        AND fecha < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioAnterior,
    $inicioActual
);

$stmt->execute();

$resultado = $stmt->get_result();
$eventosAnterior = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


/* publis*/

$sql = "SELECT COUNT(*) AS total
        FROM publicacion
        WHERE id_club = ?
        AND Estado != 'Eliminada'
        AND fecha >= ?
        AND fecha < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioActual,
    $inicioSiguiente
);

$stmt->execute();

$resultado = $stmt->get_result();
$publicacionesActual = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


$sql = "SELECT COUNT(*) AS total
        FROM publicacion
        WHERE id_club = ?
        AND Estado != 'Eliminada'
        AND fecha >= ?
        AND fecha < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioAnterior,
    $inicioActual
);

$stmt->execute();

$resultado = $stmt->get_result();
$publicacionesAnterior = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


/* asistencias */

$sql = "SELECT COUNT(*) AS total
        FROM asistencia a
        INNER JOIN evento_club e
            ON a.id_evento = e.id_evento
        WHERE e.id_club = ?
        AND e.fecha >= ?
        AND e.fecha < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioActual,
    $inicioSiguiente
);

$stmt->execute();

$resultado = $stmt->get_result();
$asistenciasActual = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


$sql = "SELECT COUNT(*) AS total
        FROM asistencia a
        INNER JOIN evento_club e
            ON a.id_evento = e.id_evento
        WHERE e.id_club = ?
        AND e.fecha >= ?
        AND e.fecha < ?";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "iss",
    $id_club,
    $inicioAnterior,
    $inicioActual
);

$stmt->execute();

$resultado = $stmt->get_result();
$asistenciasAnterior = intval($resultado->fetch_assoc()["total"]);

$stmt->close();


/* calcular cambio */

function calcularCambio($actual, $anterior)
{
    if ($anterior == 0) {

        if ($actual == 0) {
            return 0;
        }

        return 100;
    }

    return round(
        (($actual - $anterior) / $anterior) * 100,
        2
    );
}


/* respuesta */

echo json_encode([

    "success" => true,

    "club" => $club,

    "mes_actual" => $mesActual,

    "mes_anterior" => $mesAnterior,

    "comparacion" => [

        "nuevos_miembros" => [
            "mes_actual" => $nuevosActual,
            "mes_anterior" => $nuevosAnterior,
            "cambio_porcentaje" =>
                calcularCambio(
                    $nuevosActual,
                    $nuevosAnterior
                )
        ],

        "eventos" => [
            "mes_actual" => $eventosActual,
            "mes_anterior" => $eventosAnterior,
            "cambio_porcentaje" =>
                calcularCambio(
                    $eventosActual,
                    $eventosAnterior
                )
        ],

        "publicaciones" => [
            "mes_actual" => $publicacionesActual,
            "mes_anterior" => $publicacionesAnterior,
            "cambio_porcentaje" =>
                calcularCambio(
                    $publicacionesActual,
                    $publicacionesAnterior
                )
        ],

        "asistencias_registradas" => [
            "mes_actual" => $asistenciasActual,
            "mes_anterior" => $asistenciasAnterior,
            "cambio_porcentaje" =>
                calcularCambio(
                    $asistenciasActual,
                    $asistenciasAnterior
                )
        ]

    ]

]);


$conexion->close();

?>