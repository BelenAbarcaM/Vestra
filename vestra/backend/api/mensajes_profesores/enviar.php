<?php


require_once __DIR__ . '/../../config/cors.php';
session_start();
require_once '../../config/conexion.php';
require_once '../lib/moderacion.php';
require_once '_comun.php';

chat_profesores_headers();
chat_profesores_preflight();
chat_profesores_crear_tabla($conexion);
$idActual = chat_profesores_exigir_profesor($conexion);

$data = json_decode(file_get_contents('php://input'), true);
$idReceptor = (int) ($data['id_receptor'] ?? 0);
$texto = trim($data['texto'] ?? '');

if ($idReceptor <= 0 || !chat_profesores_es_profesor($conexion, $idReceptor)) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Selecciona un profesor valido.'
    ]);
    exit;
}

if ($idReceptor === $idActual) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'No puedes enviarte un mensaje a ti mismo.'
    ]);
    exit;
}

if ($texto === '') {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Escribe un mensaje para enviarlo.'
    ]);
    exit;
}

if (mb_strlen($texto, 'UTF-8') > 1000) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'El mensaje no puede superar los 1000 caracteres.'
    ]);
    exit;
}

$moderacion = vestra_moderar_contenido($texto, 'chat privado entre profesores');
if (!empty($moderacion['blocked'])) {
    vestra_responder_bloqueo_json($moderacion);
}

$sql = "INSERT INTO mensaje (texto, id_emisor, id_receptor) VALUES (?, ?, ?)";
$stmt = $conexion->prepare($sql);
$stmt->bind_param('sii', $texto, $idActual, $idReceptor);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'mensaje' => 'Mensaje enviado correctamente.',
        'id_mensaje' => $stmt->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'mensaje' => 'No se pudo enviar el mensaje.'
    ]);
}

$stmt->close();
$conexion->close();

