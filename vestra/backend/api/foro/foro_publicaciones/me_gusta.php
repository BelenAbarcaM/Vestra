<?php
require_once __DIR__ . '/_comun.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') foro_json(405, ['success'=>false,'mensaje'=>'Método no permitido.']);
$idUsuario = foro_usuario_autenticado(); $data = foro_json_entrada();
$idPublicacion = filter_var($data['id_publicacion'] ?? null, FILTER_VALIDATE_INT);
if (!$idPublicacion || $idPublicacion < 1) foro_json(400, ['success'=>false,'mensaje'=>'Publicación no válida.']);
try {
    foro_comprobar_publicacion($conexion, (int)$idPublicacion);
    $stmt = $conexion->prepare('SELECT 1 FROM foro_publicacion_like WHERE id_publicacion = ? AND id_usuario = ? LIMIT 1');
    $stmt->bind_param('ii', $idPublicacion, $idUsuario); $stmt->execute();
    $existe = (bool)$stmt->get_result()->fetch_row(); $stmt->close();
    if ($existe) {
        $stmt = $conexion->prepare('DELETE FROM foro_publicacion_like WHERE id_publicacion = ? AND id_usuario = ?');
        $stmt->bind_param('ii', $idPublicacion, $idUsuario); $stmt->execute(); $liked = false;
    } else {
        $stmt = $conexion->prepare('INSERT IGNORE INTO foro_publicacion_like (id_publicacion, id_usuario) VALUES (?, ?)');
        $stmt->bind_param('ii', $idPublicacion, $idUsuario); $stmt->execute(); $liked = true;
    }
    $stmt->close();
    $stmt = $conexion->prepare('SELECT COUNT(*) AS total FROM foro_publicacion_like WHERE id_publicacion = ?');
    $stmt->bind_param('i', $idPublicacion); $stmt->execute(); $total = (int)$stmt->get_result()->fetch_assoc()['total']; $stmt->close();
    foro_json(200, ['success'=>true,'liked'=>$liked,'likes'=>$total]);
} catch (Throwable $e) {
    error_log('Foro like: '.$e->getMessage()); foro_json(500, ['success'=>false,'mensaje'=>'No se pudo actualizar el Me gusta.']);
}
