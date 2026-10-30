<?php


require_once __DIR__ . '/../../config/cors.php';
session_start();
require_once '../../config/conexion.php';
require_once '_comun.php';

chat_profesores_headers();
chat_profesores_preflight();
chat_profesores_crear_tabla($conexion);
$idActual = chat_profesores_exigir_profesor($conexion);

$sql = "SELECT id_usuario, Nombre, Correo, Foto_url
        FROM usuario
        WHERE id_tipo_usuario = 2
        AND id_usuario <> ?
        ORDER BY Nombre ASC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param('i', $idActual);
$stmt->execute();
$resultado = $stmt->get_result();

$contactos = [];
while ($fila = $resultado->fetch_assoc()) {
    $contactos[] = [
        'id_usuario' => (int) $fila['id_usuario'],
        'nombre' => $fila['Nombre'],
        'correo' => $fila['Correo'],
        'foto' => $fila['Foto_url']
    ];
}

$stmt->close();
$conexion->close();

echo json_encode([
    'success' => true,
    'contactos' => $contactos
]);
