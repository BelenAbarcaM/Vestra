
<?php

require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once '../../config/conexion.php';

header("Content-Type: application/json; charset=UTF-8");

function responder($success, $mensaje, $status = 200, $datos = []) {
    http_response_code($status);

    echo json_encode(array_merge([
        "success" => $success,
        "mensaje" => $mensaje
    ], $datos));

    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, "Método no permitido.", 405);
}

// Comprobar sesión
if (empty($_SESSION['id_usuario'])) {
    responder(false, "Debes iniciar sesión.", 401);
}

$idUsuario = (int) $_SESSION['id_usuario'];

$texto = trim($_POST['texto'] ?? '');
$idClub = (int) ($_POST['id_club'] ?? 0);

if ($texto === '') {
    responder(false, "El contenido de la publicación es obligatorio.", 400);
}

if ($idClub <= 0) {
    responder(false, "Debe seleccionar un club.", 400);
}

// Verificar que el profesor tenga asignado el club
$sqlClub = "SELECT id_club FROM club
            WHERE id_club = ? AND id_profesor = ?";

$stmtClub = $conexion->prepare($sqlClub);

if (!$stmtClub) {
    responder(false, "Error al verificar el club.", 500);
}

$stmtClub->bind_param("ii", $idClub, $idUsuario);
$stmtClub->execute();

$resultadoClub = $stmtClub->get_result();

if ($resultadoClub->num_rows === 0) {
    responder(false, "No tienes permiso para publicar en este club.", 403);
}

$stmtClub->close();

// Imagen opcional
$nombreImagen = null;
$rutaDestino = null;

if (
    isset($_FILES['imagen']) &&
    $_FILES['imagen']['error'] !== UPLOAD_ERR_NO_FILE
) {
    $imagen = $_FILES['imagen'];

    if ($imagen['error'] !== UPLOAD_ERR_OK) {
        responder(false, "No se pudo recibir la imagen.", 400);
    }

    if ($imagen['size'] > 5 * 1024 * 1024) {
        responder(false, "La imagen no puede superar los 5 MB.", 400);
    }

    $tiposPermitidos = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $tipoImagen = finfo_file($finfo, $imagen['tmp_name']);
    finfo_close($finfo);

    if (!isset($tiposPermitidos[$tipoImagen])) {
        responder(false, "Formato de imagen no permitido.", 400);
    }

    $directorio = __DIR__ . "/../../../uploads/publicaciones/";

    if (!is_dir($directorio) || !is_writable($directorio)) {
        responder(false, "No se puede acceder a la carpeta de imágenes.", 500);
    }

    $nombreImagen = bin2hex(random_bytes(12)) . "." . $tiposPermitidos[$tipoImagen];

    $rutaDestino = $directorio . $nombreImagen;

    if (!move_uploaded_file($imagen['tmp_name'], $rutaDestino)) {
        responder(false, "No se pudo guardar la imagen.", 500);
    }
}

// Crear publicación
$sql = "INSERT INTO publicacion
        (Texto, id_usuario, id_club, imagen_url)
        VALUES (?, ?, ?, ?)";

$stmt = $conexion->prepare($sql);

if (!$stmt) {
    if ($rutaDestino && file_exists($rutaDestino)) {
        unlink($rutaDestino);
    }

    responder(false, "Error al preparar la publicación.", 500);
}

$stmt->bind_param(
    "siis",
    $texto,
    $idUsuario,
    $idClub,
    $nombreImagen
);

if ($stmt->execute()) {

    $idPublicacion = $conexion->insert_id;

    $stmt->close();

    responder(true, "Publicación creada correctamente.", 201, [
        "id_publicacion" => $idPublicacion
    ]);

} else {

    error_log("Error creando publicación: " . $stmt->error);

    $stmt->close();

    if ($rutaDestino && file_exists($rutaDestino)) {
        unlink($rutaDestino);
    }

    responder(false, "No se pudo crear la publicación.", 500);
}

?>
