<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

// Manejar petición OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Verificar que sea POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido."
    ]);
    exit;
}

// Verificar sesión
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "message" => "Debes iniciar sesión para solicitar ingresar a un club."
    ]);
    exit;
}

// Obtener datos enviados desde React
$data = json_decode(file_get_contents("php://input"), true);

// Verificar que exista id_club
if (!isset($data["id_club"]) || !is_numeric($data["id_club"])) {
    echo json_encode([
        "success" => false,
        "message" => "No se indicó el club."
    ]);
    exit;
}

// Verificar datos del estudiante
if (
    !isset($data["carnet"]) ||
    !isset($data["correo"]) ||
    !isset($data["seccion"])
) {
    echo json_encode([
        "success" => false,
        "message" => "Faltan datos del estudiante."
    ]);
    exit;
}

// Datos
$id_usuario = $_SESSION["id_usuario"];
$id_club = intval($data["id_club"]);

$carnet = trim($data["carnet"]);
$correo = trim($data["correo"]);
$seccion = trim($data["seccion"]);

$estado = "Pendiente";


// si el club extste

$sql = "SELECT id_club FROM club WHERE id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {

    echo json_encode([
        "success" => false,
        "message" => "El club no existe."
    ]);

    $stmt->close();
    $conexion->close();
    exit;
}

$stmt->close();


//si ya esta en el club

$sql = "SELECT id_usuario
        FROM inscripcion
        WHERE id_usuario = ?
        AND id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {

    echo json_encode([
        "success" => false,
        "message" => "Ya perteneces a este club."
    ]);

    $stmt->close();
    $conexion->close();
    exit;
}

$stmt->close();


//solicitud oendiente

$sql = "SELECT id_solicitud
        FROM solicitudclub
        WHERE id_usuario = ?
        AND id_club = ?
        AND estado = 'Pendiente'";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_usuario, $id_club);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {

    echo json_encode([
        "success" => false,
        "message" => "Ya tienes una solicitud pendiente para este club."
    ]);

    $stmt->close();
    $conexion->close();
    exit;
}

$stmt->close();


// crear kla solicityd

$sql = "INSERT INTO solicitudclub
        (
            id_usuario,
            carnet,
            correo,
            seccion,
            id_club,
            fecha,
            estado
        )
        VALUES (?, ?, ?, ?, ?, NOW(), ?)";

$stmt = $conexion->prepare($sql);

$stmt->bind_param(
    "isssis",
    $id_usuario,
    $carnet,
    $correo,
    $seccion,
    $id_club,
    $estado
);


//respuesta 

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Solicitud enviada correctamente."
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "No se pudo enviar la solicitud.",
        "error" => $stmt->error
    ]);
}


// Cerrar
$stmt->close();
$conexion->close();

?>    