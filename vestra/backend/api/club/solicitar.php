<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

/**
 * Devuelve una respuesta JSON y finaliza la ejecución.
 */
function responder($datos, $estado = 200)
{
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Manejar solicitudes CORS OPTIONS.
 */
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/**
 * Verificar método HTTP.
 */
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder([
        "success" => false,
        "message" => "Método no permitido."
    ], 405);
}

/**
 * Verificar que el usuario tenga una sesión iniciada.
 */
if (!isset($_SESSION["id_usuario"])) {
    responder([
        "success" => false,
        "message" => "Debes iniciar sesión para solicitar ingresar a un club."
    ], 401);
}

/**
 * Obtener los datos enviados desde React.
 */
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    responder([
        "success" => false,
        "message" => "Los datos enviados no son válidos."
    ], 400);
}

/**
 * Validar el identificador del club.
 */
if (
    !isset($data["id_club"]) ||
    !is_numeric($data["id_club"]) ||
    (int)$data["id_club"] < 1 ||
    (string)(int)$data["id_club"] !== (string)$data["id_club"]
) {
    responder([
        "success" => false,
        "message" => "No se indicó un club válido."
    ], 400);
}

/**
 * Validar los datos del estudiante.
 */
foreach (["carnet", "correo", "seccion"] as $campo) {
    if (
        !isset($data[$campo]) ||
        !is_string($data[$campo]) ||
        trim($data[$campo]) === ""
    ) {
        responder([
            "success" => false,
            "message" => "Falta completar correctamente el campo: " . $campo . "."
        ], 400);
    }
}

$carnet = trim($data["carnet"]);
$correo = trim($data["correo"]);
$seccion = trim($data["seccion"]);

/**
 * Validar formato del correo.
 */
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder([
        "success" => false,
        "message" => "El correo electrónico no tiene un formato válido."
    ], 400);
}

/**
 * Validar el tipo de membresía.
 */
$tipo_membresia = $data["tipo_membresia"] ?? null;

if (
    !is_string($tipo_membresia) ||
    !in_array($tipo_membresia, ["Nuevo", "Antiguo"], true)
) {
    responder([
        "success" => false,
        "message" => "Debes indicar si eres un miembro nuevo o antiguo."
    ], 400);
}

/**
 * Validar la fecha declarada por los miembros antiguos.
 *
 * La fecha solicitada no se considera oficial hasta que
 * el profesor la revise y la apruebe.
 */
$fecha_ingreso_solicitada = null;
$estado_fecha_ingreso = "No solicitada";

if ($tipo_membresia === "Antiguo") {
    $fechaRecibida = $data["fecha_ingreso_solicitada"] ?? null;

    if (!is_string($fechaRecibida) || trim($fechaRecibida) === "") {
        responder([
            "success" => false,
            "message" => "Debes indicar la fecha desde la que perteneces al club."
        ], 400);
    }

    $fechaRecibida = trim($fechaRecibida);

    $fechaValidada = DateTime::createFromFormat(
        "!Y-m-d",
        $fechaRecibida
    );

    $erroresFecha = DateTime::getLastErrors();

    $fechaCorrecta = (
        $fechaValidada !== false &&
        (
            $erroresFecha === false ||
            (
                $erroresFecha["warning_count"] === 0 &&
                $erroresFecha["error_count"] === 0
            )
        ) &&
        $fechaValidada->format("Y-m-d") === $fechaRecibida
    );

    if (!$fechaCorrecta) {
        responder([
            "success" => false,
            "message" => "La fecha de ingreso no es válida."
        ], 400);
    }

    if ($fechaRecibida > date("Y-m-d")) {
        responder([
            "success" => false,
            "message" => "La fecha de ingreso no puede ser futura."
        ], 400);
    }

    $fecha_ingreso_solicitada = $fechaRecibida;
    $estado_fecha_ingreso = "Pendiente";
}

/**
 * Validar los requisitos marcados.
 */
if (
    !isset($data["requisitos"]) ||
    !is_array($data["requisitos"])
) {
    responder([
        "success" => false,
        "message" => "Debes marcar todos los requisitos del club."
    ], 400);
}

$requisitosMarcados = [];

foreach ($data["requisitos"] as $id) {
    if (
        !is_int($id) &&
        !(is_string($id) && ctype_digit($id))
    ) {
        responder([
            "success" => false,
            "message" => "La lista de requisitos contiene datos inválidos."
        ], 400);
    }

    $id = (int)$id;

    if ($id < 1 || in_array($id, $requisitosMarcados, true)) {
        responder([
            "success" => false,
            "message" => "La lista de requisitos contiene identificadores inválidos o repetidos."
        ], 400);
    }

    $requisitosMarcados[] = $id;
}

/**
 * Preparar los datos de la solicitud.
 */
$id_usuario = (int)$_SESSION["id_usuario"];
$id_club = (int)$data["id_club"];
$estado = "Pendiente";

/**
 * Verificar que el club exista.
 */
$sql = "SELECT id_club
        FROM club
        WHERE id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();
$clubExiste = $resultado->num_rows > 0;

$stmt->close();

if (!$clubExiste) {
    responder([
        "success" => false,
        "message" => "El club no existe."
    ], 404);
}

/**
 * Obtener los requisitos reales del club.
 */
$sql = "SELECT id_requisito
        FROM requisito_club
        WHERE id_club = ?
        ORDER BY id_requisito";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();
$requisitosReales = [];

while ($fila = $resultado->fetch_assoc()) {
    $requisitosReales[] = (int)$fila["id_requisito"];
}

$stmt->close();

/**
 * No permitir solicitudes si no hay requisitos configurados.
 */
if (count($requisitosReales) === 0) {
    responder([
        "success" => false,
        "message" => "Este club todavía no tiene requisitos configurados."
    ], 400);
}

/**
 * Comparar los requisitos enviados con los del club.
 */
$marcadosOrdenados = $requisitosMarcados;

sort($marcadosOrdenados);
sort($requisitosReales);

if ($marcadosOrdenados !== $requisitosReales) {
    responder([
        "success" => false,
        "message" => "Debes marcar todos los requisitos actuales de este club."
    ], 400);
}

/**
 * Verificar si ya está inscrito en el club.
 */
$sql = "SELECT id_inscripcion
        FROM inscripcion
        WHERE id_usuario = ?
        AND id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_club);
$stmt->execute();

$resultado = $stmt->get_result();
$yaInscrito = $resultado->num_rows > 0;

$stmt->close();

if ($yaInscrito) {
    responder([
        "success" => false,
        "message" => "Ya perteneces a este club."
    ], 409);
}

/**
 * Evitar solicitudes duplicadas que todavía estén pendientes.
 */
$sql = "SELECT id_solicitud
        FROM solicitudclub
        WHERE id_usuario = ?
        AND id_club = ?
        AND estado = 'Pendiente'";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_club);
$stmt->execute();

$resultado = $stmt->get_result();
$tienePendiente = $resultado->num_rows > 0;

$stmt->close();

if ($tienePendiente) {
    responder([
        "success" => false,
        "message" => "Ya tienes una solicitud pendiente para este club."
    ], 409);
}

/**
 * Crear la solicitud.
 *
 * Nuevo:
 * - No declara fecha anterior.
 * - estado_fecha_ingreso = No solicitada.
 *
 * Antiguo:
 * - Guarda la fecha declarada por el estudiante.
 * - estado_fecha_ingreso = Pendiente.
 *
 * La fecha aprobada permanece NULL hasta que el profesor
 * la apruebe desde su panel.
 */
$sql = "INSERT INTO solicitudclub (
            id_usuario,
            carnet,
            correo,
            seccion,
            id_club,
            fecha,
            estado,
            tipo_membresia,
            fecha_ingreso_solicitada,
            fecha_ingreso_aprobada,
            estado_fecha_ingreso
        )
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, NULL, ?)";

$stmt = $conexion->prepare($sql);

if (!$stmt) {
    error_log(
        "Error preparando solicitud de inscripción: " .
        $conexion->error
    );

    responder([
        "success" => false,
        "message" => "No se pudo preparar la solicitud."
    ], 500);
}

$stmt->bind_param(
    "isssissss",
    $id_usuario,
    $carnet,
    $correo,
    $seccion,
    $id_club,
    $estado,
    $tipo_membresia,
    $fecha_ingreso_solicitada,
    $estado_fecha_ingreso
);

if ($stmt->execute()) {
    $id_solicitud = $stmt->insert_id;
    $stmt->close();

    if ($tipo_membresia === "Antiguo") {
        $mensaje = "Solicitud enviada correctamente. La fecha de antigüedad quedó pendiente de revisión por el profesor.";
    } else {
        $mensaje = "Solicitud enviada correctamente. El profesor deberá aprobar tu ingreso al club.";
    }

    responder([
        "success" => true,
        "message" => $mensaje,
        "id_solicitud" => $id_solicitud,
        "tipo_membresia" => $tipo_membresia,
        "estado_solicitud" => "Pendiente",
        "estado_fecha_ingreso" => $estado_fecha_ingreso
    ]);
}

$error = $stmt->error;

error_log(
    "Error al crear solicitud de inscripción: " . $error
);

$stmt->close();

responder([
    "success" => false,
    "message" => "No se pudo enviar la solicitud."
], 500);

?>

