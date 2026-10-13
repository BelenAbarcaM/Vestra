<?php
require_once __DIR__ . '/_comun.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') foro_json(405, ['success' => false, 'mensaje' => 'Método no permitido.']);
$idUsuario = foro_usuario_autenticado();
$idClub = filter_input(INPUT_GET, 'id_club', FILTER_VALIDATE_INT);
try {
    $idForo = foro_id_foro($conexion, (int)$idClub);
    $sql = "SELECT p.id_publicacion, p.id_foro, p.id_usuario, p.titulo, p.categoria, p.texto, p.fecha_creacion,
                   u.Nombre AS autor, u.Foto_url AS foto_usuario,
                   (SELECT COUNT(*) FROM foro_publicacion_like l WHERE l.id_publicacion = p.id_publicacion) AS likes,
                   EXISTS(SELECT 1 FROM foro_publicacion_like l2 WHERE l2.id_publicacion = p.id_publicacion AND l2.id_usuario = ?) AS liked,
                   (SELECT r.reaccion FROM foro_publicacion_reaccion r WHERE r.id_publicacion = p.id_publicacion AND r.id_usuario = ? LIMIT 1) AS mi_reaccion,
                   (SELECT COUNT(*) FROM foro_publicacion_reaccion r2 WHERE r2.id_publicacion = p.id_publicacion AND r2.reaccion = 'util') AS reaccion_util,
                   (SELECT COUNT(*) FROM foro_publicacion_reaccion r3 WHERE r3.id_publicacion = p.id_publicacion AND r3.reaccion = 'interesante') AS reaccion_interesante,
                   (SELECT COUNT(*) FROM foro_publicacion_reaccion r4 WHERE r4.id_publicacion = p.id_publicacion AND r4.reaccion = 'gracioso') AS reaccion_gracioso
            FROM foro_publicacion p INNER JOIN usuario u ON u.id_usuario = p.id_usuario
            WHERE p.id_foro = ? ORDER BY p.fecha_creacion DESC, p.id_publicacion DESC LIMIT 300";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('iii', $idUsuario, $idUsuario, $idForo);
    $stmt->execute();
    $res = $stmt->get_result();
    $publicaciones = [];
    while ($row = $res->fetch_assoc()) {
        $row['id_publicacion'] = (int)$row['id_publicacion'];
        $row['id_foro'] = (int)$row['id_foro'];
        $row['id_usuario'] = (int)$row['id_usuario'];
        $row['likes'] = (int)$row['likes'];
        $row['liked'] = (bool)$row['liked'];
        $row['reaccion_util'] = (int)$row['reaccion_util'];
        $row['reaccion_interesante'] = (int)$row['reaccion_interesante'];
        $row['reaccion_gracioso'] = (int)$row['reaccion_gracioso'];
        $row['detalle'] = $row['texto'];
        $publicaciones[] = $row;
    }
    $stmt->close();
    $stmt = $conexion->prepare('SELECT Nombre FROM club WHERE id_club = ? LIMIT 1');
    $stmt->bind_param('i', $idClub); $stmt->execute();
    $club = $stmt->get_result()->fetch_assoc(); $stmt->close();
    foro_json(200, ['success' => true, 'id_foro' => $idForo, 'nombre_club' => $club['Nombre'] ?? '', 'publicaciones' => $publicaciones]);
} catch (Throwable $e) {
    error_log('Foro listar publicaciones: '.$e->getMessage());
    foro_json(500, ['success' => false, 'mensaje' => 'No se pudieron cargar las publicaciones.']);
}
