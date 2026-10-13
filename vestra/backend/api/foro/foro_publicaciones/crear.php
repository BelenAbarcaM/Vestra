<?php
require_once __DIR__ . '/_comun.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') foro_json(405, ['success' => false, 'mensaje' => 'Método no permitido.']);
$idUsuario = foro_usuario_autenticado();
$data = foro_json_entrada();
$idClub = filter_var($data['id_club'] ?? null, FILTER_VALIDATE_INT);
$titulo = trim((string)($data['titulo'] ?? ''));
$categoria = trim((string)($data['categoria'] ?? 'General'));
$texto = trim((string)($data['texto'] ?? ''));
$categorias = ['General','Eventos','Preguntas','Logros'];
if (!$idClub || $idClub < 1) foro_json(400, ['success'=>false,'mensaje'=>'Debes indicar un club válido.']);
if ($titulo === '' || mb_strlen($titulo, 'UTF-8') > 100) foro_json(400, ['success'=>false,'mensaje'=>'El título es obligatorio y debe tener como máximo 100 caracteres.']);
if (!in_array($categoria, $categorias, true)) foro_json(400, ['success'=>false,'mensaje'=>'La categoría seleccionada no es válida.']);
if ($texto === '' || mb_strlen($texto, 'UTF-8') > 1000) foro_json(400, ['success'=>false,'mensaje'=>'El texto es obligatorio y debe tener como máximo 1000 caracteres.']);
foro_revisar_contenido($titulo."\n".$texto, 'publicación del foro de Vestra');
try {
    $idForo = foro_id_foro($conexion, (int)$idClub);
    $stmt = $conexion->prepare('INSERT INTO foro_publicacion (id_foro, id_usuario, titulo, categoria, texto) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('iisss', $idForo, $idUsuario, $titulo, $categoria, $texto);
    $stmt->execute(); $idPublicacion = (int)$conexion->insert_id; $stmt->close();
    foro_json(201, ['success'=>true,'mensaje'=>'Publicación creada correctamente.','id_publicacion'=>$idPublicacion]);
} catch (Throwable $e) {
    error_log('Foro crear publicación: '.$e->getMessage());
    foro_json(500, ['success'=>false,'mensaje'=>'No se pudo guardar la publicación.']);
}
