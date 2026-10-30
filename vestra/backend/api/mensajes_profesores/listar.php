<?php


require_once __DIR__ . '/../../config/cors.php';
session_start();
require_once '../../config/conexion.php';
require_once '_comun.php';

chat_profesores_headers();
chat_profesores_preflight();
chat_profesores_crear_tabla($conexion);
$idActual = chat_profesores_exigir_profesor($conexion);

$data = json_decode(file_get_contents('php://input'), true);
$idContacto = (int) ($data['id_contacto'] ?? 0);

if ($idContacto <= 0 || !chat_profesores_es_profesor($conexion, $idContacto)) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Selecciona un profesor valido.'
    ]);
    exit;
}

$sql = "SELECT id_Mensaje, texto, fecha, id_emisor, id_receptor
        FROM mensaje
        WHERE (id_emisor = ? AND id_receptor = ?)
           OR (id_emisor = ? AND id_receptor = ?)
        ORDER BY fecha ASC, id_Mensaje ASC
        LIMIT 120";

$stmt = $conexion->prepare($sql);
$stmt->bind_param('iiii', $idActual, $idContacto, $idContacto, $idActual);
$stmt->execute();
$resultado = $stmt->get_result();

$mensajes = [];
while ($fila = $resultado->fetch_assoc()) {
    $mensajes[] = [
        'id' => (int) $fila['id_Mensaje'],
        'texto' => $fila['texto'],
        'fecha' => $fila['fecha'],
        'id_emisor' => (int) $fila['id_emisor'],
        'id_receptor' => (int) $fila['id_receptor'],
        'propio' => (int) $fila['id_emisor'] === $idActual
    ];
}

$stmt->close();
$conexion->close();

echo json_encode([
    'success' => true,
    'mensajes' => $mensajes
]);
