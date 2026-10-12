<?php

session_start();
include '../../config/conexion.php';
require_once '../lib/moderacion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

$idPubli = (int) ($_POST['id_publicacion'] ?? 0);
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

if ($idPubli <= 0 || $texto === '' || $idClub <= 0) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Faltan datos para actualizar la publicacion."
    ]);
    exit;
}

$moderacion = vestra_moderar_contenido($texto, 'edicion de publicacion');

if (!empty($moderacion['blocked'])) {
    vestra_responder_bloqueo_json($moderacion);
}

if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
    $imagen = $_FILES['imagen'];
    $nombreImagen = uniqid() . "_" . basename($imagen['name']);
    $rutaDestino = __DIR__ . "/../../../uploads/publicaciones/" . $nombreImagen;

    move_uploaded_file($imagen['tmp_name'], $rutaDestino);
} else {
    $sqlFoto = "SELECT imagen_url
                FROM publicacion
                WHERE id_publicacion = ?";

    $stmtFoto = $conexion->prepare($sqlFoto);
    $stmtFoto->bind_param("i", $idPubli);
    $stmtFoto->execute();

    $resultado = $stmtFoto->get_result();
    $publicacion = $resultado->fetch_assoc();

    $nombreImagen = $publicacion['imagen_url'] ?? null;
    $stmtFoto->close();
}

$edit = "UPDATE publicacion
SET
    Texto = ?,
    id_usuario = ?,
    id_club = ?,
    imagen_url = ?
WHERE id_publicacion = ?";

$stmt = $conexion->prepare($edit);
$stmt->bind_param("siisi", $texto, $idUsuario, $idClub, $nombreImagen, $idPubli);

if ($stmt->execute()) {
    echo "Publicación actualizada correctamente.";
} else {
    echo "Error: " . $stmt->error;
}

$stmt->close();
$conexion->close();
?>
