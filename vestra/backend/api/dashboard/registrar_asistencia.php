<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

session_start();

require_once "../../config/conexion.php";

// options
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// metodo
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "error" => "Método no permitido"
    ]);
    exit;
}

// verificar sesion
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);

// leer datos
$datos = $_POST;

if (empty($datos)) {
    $datosJson = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (is_array($datosJson)) {
        $datos = $datosJson;
    }
}

if (!is_array($datos) || empty($datos)) {
    echo json_encode([
        "success" => false,
        "error" => "Los datos enviados no son válidos"
    ]);
    exit;
}

// id del evento
$id_evento = isset($datos["id_evento"])
    ? intval($datos["id_evento"])
    : 0;

if ($id_evento <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "ID de evento inválido"
    ]);
    exit;
}

// asistencias
$asistencias = [];

// formato individual
if (
    isset($datos["id_usuario"]) &&
    isset($datos["estado"])
) {
    $asistencias[] = [
        "id_usuario" => intval($datos["id_usuario"]),
        "estado" => $datos["estado"]
    ];
}

// formato múltiple
elseif (
    isset($datos["asistencias"]) &&
    is_array($datos["asistencias"])
) {
    $asistencias = $datos["asistencias"];
}

// verificar que haya algo que registrar
if (count($asistencias) === 0) {
    echo json_encode([
        "success" => false,
        "error" => "No se recibieron asistencias para registrar"
    ]);
    exit;
}

// verificar que el evento es del profesor
$sqlEvento = "
    SELECT
        e.id_evento,
        e.id_club,
        c.Nombre AS nombre_club
    FROM evento_club e
    INNER JOIN club c
        ON e.id_club = c.id_club
    WHERE e.id_evento = ?
    AND c.id_profesor = ?
";

$stmtEvento = $conexion->prepare($sqlEvento);

$stmtEvento->bind_param(
    "ii",
    $id_evento,
    $id_profesor
);

$stmtEvento->execute();

$resultadoEvento = $stmtEvento->get_result();
$evento = $resultadoEvento->fetch_assoc();

if (!$evento) {
    echo json_encode([
        "success" => false,
        "error" => "Evento no encontrado o no tienes permiso para modificarlo"
    ]);
    exit;
}

$id_club = intval($evento["id_club"]);

// consulta de miembros
$sqlMiembro = "
    SELECT id_usuario
    FROM inscripcion
    WHERE id_usuario = ?
    AND id_club = ?
";

$stmtMiembro = $conexion->prepare($sqlMiembro);

// insert y update
$sqlAsistencia = "
    INSERT INTO asistencia (
        id_evento,
        id_usuario,
        estado
    )
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
        estado = VALUES(estado)
";

$stmtAsistencia = $conexion->prepare($sqlAsistencia);

// transaccion
$conexion->begin_transaction();

try {

    $registradas = 0;

    foreach ($asistencias as $asistencia) {

        // validar estructura
        if (
            !isset($asistencia["id_usuario"]) ||
            !isset($asistencia["estado"])
        ) {
            throw new Exception(
                "Una de las asistencias no tiene los datos necesarios"
            );
        }

        $id_usuario = intval($asistencia["id_usuario"]);
        $estado = trim($asistencia["estado"]);

        // validar usuario
        if ($id_usuario <= 0) {
            throw new Exception(
                "ID de usuario inválido"
            );
        }

        // validar estado
        $estadosPermitidos = [
            "Presente",
            "Ausente",
            "Justificado"
        ];

        if (!in_array($estado, $estadosPermitidos, true)) {
            throw new Exception(
                "Estado de asistencia inválido para el usuario " . $id_usuario
            );
        }

        // verificar que es miembro
        $stmtMiembro->bind_param(
            "ii",
            $id_usuario,
            $id_club
        );

        $stmtMiembro->execute();

        $resultadoMiembro = $stmtMiembro->get_result();

        if (!$resultadoMiembro->fetch_assoc()) {
            throw new Exception(
                "El usuario " . $id_usuario .
                " no pertenece al club de este evento"
            );
        }

        // actualizar la asistencia
        $stmtAsistencia->bind_param(
            "iis",
            $id_evento,
            $id_usuario,
            $estado
        );

        $stmtAsistencia->execute();

        $registradas++;
    }

    // confirmar
    $conexion->commit();

    echo json_encode([
        "success" => true,
        "mensaje" => "Asistencia registrada correctamente",
        "id_evento" => $id_evento,
        "registradas" => $registradas
    ]);

} catch (Exception $e) {

    // deshacer todo si falla
    $conexion->rollback();

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$stmtEvento->close();
$stmtMiembro->close();
$stmtAsistencia->close();
$conexion->close();

?>