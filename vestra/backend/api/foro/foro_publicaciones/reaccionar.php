<?php

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/_comun.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') foro_json(405, ['success'=>false,'mensaje'=>'Método no permitido.']);
$idUsuario = foro_usuario_autenticado(); $data = foro_json_entrada();
$idPublicacion = filter_var($data['id_publicacion'] ?? null, FILTER_VALIDATE_INT);
$reaccion = (string)($data['reaccion'] ?? '');
if (!$idPublicacion || $idPublicacion < 1) foro_json(400, ['success'=>false,'mensaje'=>'Publicación no válida.']);
if (!in_array($reaccion, ['util','interesante','gracioso'], true)) foro_json(400, ['success'=>false,'mensaje'=>'La reacción seleccionada no es válida.']);
try {
    foro_comprobar_publicacion($conexion, (int)$idPublicacion);
    $stmt = $conexion->prepare('SELECT reaccion FROM foro_publicacion_reaccion WHERE id_publicacion = ? AND id_usuario = ? LIMIT 1');
    $stmt->bind_param('ii', $idPublicacion, $idUsuario); $stmt->execute();
    $actual = $stmt->get_result()->fetch_assoc(); $stmt->close();
    if ($actual && $actual['reaccion'] === $reaccion) {
        $stmt = $conexion->prepare('DELETE FROM foro_publicacion_reaccion WHERE id_publicacion = ? AND id_usuario = ?');
        $stmt->bind_param('ii', $idPublicacion, $idUsuario); $stmt->execute(); $miReaccion = null;
    } else {
        $stmt = $conexion->prepare('INSERT INTO foro_publicacion_reaccion (id_publicacion, id_usuario, reaccion) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reaccion = VALUES(reaccion)');
        $stmt->bind_param('iis', $idPublicacion, $idUsuario, $reaccion); $stmt->execute(); $miReaccion = $reaccion;
    }
    $stmt->close();
    $counts = ['util'=>0,'interesante'=>0,'gracioso'=>0];
    $stmt = $conexion->prepare('SELECT reaccion, COUNT(*) AS total FROM foro_publicacion_reaccion WHERE id_publicacion = ? GROUP BY reaccion');
    $stmt->bind_param('i', $idPublicacion); $stmt->execute(); $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) $counts[$row['reaccion']] = (int)$row['total'];
    $stmt->close();
    foro_json(200, ['success'=>true,'mi_reaccion'=>$miReaccion,'reacciones'=>$counts]);
} catch (Throwable $e) {
    error_log('Foro reacción: '.$e->getMessage()); foro_json(500, ['success'=>false,'mensaje'=>'No se pudo guardar la reacción.']);
}
