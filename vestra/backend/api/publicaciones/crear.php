<?php

session_start();

include '../../config/conexion.php';
require_once '../lib/moderacion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");


$texto = trim($_POST['texto'] ?? '');
$idClub = (int) ($_POST['id_club'] ?? 0);
$idUsuario = (int) ($_SESSION['id_usuario'] ?? 0);

if ($idUsuario <= 0) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado."
    ]);
    exit;
}

if ($texto === '') {
    echo json_encode([
        "success" => false,
        "mensaje" => "El contenido de la publicacion es obligatorio."
    ]);
    exit;
}

if ($idClub <= 0) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Debe seleccionar un club."
    ]);
    exit;
}

$moderacion = vestra_moderar_contenido($texto, 'publicacion del muro');

if (!empty($moderacion['blocked'])) {
    vestra_responder_bloqueo_json($moderacion);
}

$nombreImagen = null;

if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
    $imagen = $_FILES['imagen'];
    $nombreImagen = uniqid() . "_" . basename($imagen['name']);
    $rutaDestino = __DIR__ . "/../../../uploads/publicaciones/" . $nombreImagen;
    move_uploaded_file(
        $imagen['tmp_name'],
        $rutaDestino
    );
}

$publi = "INSERT INTO publicacion (Texto, id_usuario, id_club, imagen_url)
            VALUES (?, ?, ?, ?)";

$stmt = $conexion->prepare($publi);
$stmt->bind_param("siis", $texto, $idUsuario, $idClub, $nombreImagen);


if ($stmt->execute()) {
    echo "Publicación creada correctamente";
} else {
    echo "Error al crear publicación: " . $stmt->error;
}

$stmt->close();
$conexion->close();
?>

