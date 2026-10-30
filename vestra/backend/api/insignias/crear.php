
<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';

function responder($success, $mensaje, $extra = []) {
    echo json_encode(
        array_merge([
            "success" => $success,
            "mensaje" => $mensaje
        ], $extra),
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    responder(false, "Método no permitido.");
}

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    responder(false, "Debes iniciar sesión.");
}

$idProfesor = (int) $_SESSION["id_usuario"];
$idClub = filter_input(INPUT_POST, "id_club", FILTER_VALIDATE_INT);
$nombre = trim($_POST["nombre"] ?? "");
$descripcion = trim($_POST["descripcion"] ?? "");

if (!$idClub || $idClub < 1) {
    http_response_code(400);
    responder(false, "El club seleccionado no es válido.");
}

if ($nombre === "" || mb_strlen($nombre) > 50) {
    http_response_code(400);
    responder(false, "El nombre es obligatorio y debe tener máximo 50 caracteres.");
}

if ($descripcion === "" || mb_strlen($descripcion) > 255) {
    http_response_code(400);
    responder(false, "La descripción es obligatoria y debe tener máximo 255 caracteres.");
}

if (!isset($_FILES["imagen"]) ||
    $_FILES["imagen"]["error"] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    responder(false, "Debes subir una imagen PNG válida.");
}

$archivo = $_FILES["imagen"];

if ($archivo["size"] <= 0 || $archivo["size"] > 5 * 1024 * 1024) {
    http_response_code(400);
    responder(false, "La imagen debe pesar menos de 5 MB.");
}

// Comprobar el contenido real de la imagen.
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($archivo["tmp_name"]);
$imagenInfo = @getimagesize($archivo["tmp_name"]);

if (
    $mime !== "image/png" ||
    $imagenInfo === false ||
    $imagenInfo["mime"] !== "image/png"
) {
    http_response_code(400);
    responder(false, "Solo se permiten imágenes PNG auténticas.");
}

// Verificar que el profesor sea dueño del club.
$stmtClub = $conexion->prepare(
    "SELECT id_club
     FROM club
     WHERE id_club = ? AND id_profesor = ?
     LIMIT 1"
);

if (!$stmtClub) {
    http_response_code(500);
    responder(false, "No se pudo verificar el club.");
}

$stmtClub->bind_param("ii", $idClub, $idProfesor);
$stmtClub->execute();
$club = $stmtClub->get_result()->fetch_assoc();
$stmtClub->close();

if (!$club) {
    http_response_code(403);
    responder(false, "No tienes permiso para crear insignias para este club.");
}

// backend/api/insignias -> raíz del proyecto -> uploads/insignias
$carpeta = __DIR__ . "/../../../uploads/insignias";

if (!is_dir($carpeta) &&
    !mkdir($carpeta, 0755, true) &&
    !is_dir($carpeta)) {
    http_response_code(500);
    responder(false, "No se pudo preparar la carpeta de imágenes.");
}

// Nombre aleatorio para evitar colisiones y nombres inseguros.
$nombreArchivo = bin2hex(random_bytes(16)) . ".png";
$rutaFisica = $carpeta . "/" . $nombreArchivo;
$rutaBD = "uploads/insignias/" . $nombreArchivo;

if (!move_uploaded_file($archivo["tmp_name"], $rutaFisica)) {
    http_response_code(500);
    responder(false, "No se pudo guardar la imagen.");
}

try {
    $stmt = $conexion->prepare(
        "INSERT INTO insignia
            (id_profe, nombre, descripcion, foto, estado,
             fecha_aprobado, id_club)
         VALUES (?, ?, ?, ?, 'Aprobado', NOW(), ?)"
    );

    if (!$stmt) {
        throw new Exception("No se pudo preparar el registro.");
    }

    $stmt->bind_param(
        "isssi",
        $idProfesor,
        $nombre,
        $descripcion,
        $rutaBD,
        $idClub
    );

    if (!$stmt->execute()) {
        throw new Exception("No se pudo guardar la insignia.");
    }

    $idInsignia = $conexion->insert_id;
    $stmt->close();

    responder(true, "¡Insignia creada y aprobada!", [
        "id_insignia" => $idInsignia,
        "foto" => $rutaBD
    ]);

} catch (Throwable $e) {
    if (file_exists($rutaFisica)) {
        unlink($rutaFisica);
    }

    error_log("Error creando insignia: " . $e->getMessage());
    http_response_code(500);
    responder(false, "No se pudo crear la insignia.");
}