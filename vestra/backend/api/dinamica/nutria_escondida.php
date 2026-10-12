<?php
session_start();
require_once '../../config/conexion.php';

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function responder($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['id_usuario'])) {
    responder(401, ['success' => false, 'mensaje' => 'Inicia sesión para jugar a Nutria Escondida.']);
}
if (!isset($conexion) || $conexion->connect_errno) {
    responder(500, ['success' => false, 'mensaje' => 'No se pudo conectar con la base de datos.']);
}

$idUsuario = (int) $_SESSION['id_usuario'];

$sqlTabla = "CREATE TABLE IF NOT EXISTS nutria_captura_diaria (
    id_captura BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario INT UNSIGNED NOT NULL,
    fecha_captura DATE NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_captura),
    UNIQUE KEY uq_nutria_usuario_fecha (id_usuario, fecha_captura),
    CONSTRAINT fk_nutria_captura_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
if (!$conexion->query($sqlTabla)) {
    responder(500, ['success' => false, 'mensaje' => 'No se pudo preparar el registro diario de la dinámica.']);
}

function obtenerOCrearInsigniaNutria($conexion, $nombre, $descripcion) {
    $stmt = $conexion->prepare('SELECT id_insignia FROM insignia WHERE nombre = ? LIMIT 1');
    if (!$stmt) return null;
    $stmt->bind_param('s', $nombre);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($fila) return (int) $fila['id_insignia'];

    // La tabla insignia exige que cada insignia tenga un profesor propietario.
    $resultado = $conexion->query('SELECT id_usuario FROM usuario WHERE id_tipo_usuario = 2 ORDER BY id_usuario LIMIT 1');
    $profesor = $resultado ? $resultado->fetch_assoc() : null;
    if (!$profesor) return null;

    $foto = 'Vivi.png';
    $estado = 'Aprobado';
    $idProfe = (int) $profesor['id_usuario'];
    $stmt = $conexion->prepare('INSERT INTO insignia (id_profe, nombre, descripcion, foto, estado, fecha_aprobado, id_club) VALUES (?, ?, ?, ?, ?, NOW(), NULL)');
    if (!$stmt) return null;
    $stmt->bind_param('issss', $idProfe, $nombre, $descripcion, $foto, $estado);
    if (!$stmt->execute()) {
        $stmt->close();
        // Otra solicitud podría haber creado la misma insignia a la vez.
        $stmt = $conexion->prepare('SELECT id_insignia FROM insignia WHERE nombre = ? LIMIT 1');
        if (!$stmt) return null;
        $stmt->bind_param('s', $nombre);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $fila ? (int) $fila['id_insignia'] : null;
    }
    $id = (int) $stmt->insert_id;
    $stmt->close();
    return $id;
}

$recompensas = [
    10 => ['nombre' => 'Exploradora de Vivi', 'descripcion' => 'Por encontrar a Vivi 10 veces en Vestra.'],
    50 => ['nombre' => 'Amiga de Vivi', 'descripcion' => 'Por encontrar a Vivi 50 veces en Vestra.'],
    100 => ['nombre' => 'Leyenda de Vivi', 'descripcion' => 'Por encontrar a Vivi 100 veces en Vestra.']
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conexion->prepare('SELECT id_captura FROM nutria_captura_diaria WHERE id_usuario = ? AND fecha_captura = CURDATE() LIMIT 1');
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $capturada = (bool) $stmt->get_result()->fetch_assoc();
    $stmt->close();

    responder(200, ['success' => true, 'puede_atrapar' => !$capturada, 'capturada_hoy' => $capturada]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, ['success' => false, 'mensaje' => 'Método no permitido.']);
}

$datos = json_decode(file_get_contents('php://input'), true) ?: [];
if (($datos['accion'] ?? '') !== 'capturar') {
    responder(400, ['success' => false, 'mensaje' => 'Acción no válida.']);
}

$conexion->begin_transaction();
try {
    $stmt = $conexion->prepare('INSERT INTO nutria_captura_diaria (id_usuario, fecha_captura) VALUES (?, CURDATE())');
    $stmt->bind_param('i', $idUsuario);
    if (!$stmt->execute()) {
        $stmt->close();
        $conexion->rollback();
        responder(409, ['success' => false, 'mensaje' => '¡Ya atrapaste a Vivi hoy! Volvé mañana.']);
    }
    $stmt->close();

    $stmt = $conexion->prepare('SELECT COUNT(*) AS total FROM nutria_captura_diaria WHERE id_usuario = ?');
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $filaTotal = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $total = (int) ($filaTotal['total'] ?? 0);

    $insigniasNuevas = [];
    foreach ($recompensas as $meta => $recompensa) {
        if ($total < $meta) continue;
        $idInsignia = obtenerOCrearInsigniaNutria($conexion, $recompensa['nombre'], $recompensa['descripcion']);
        if ($idInsignia === null) continue;
        $stmt = $conexion->prepare('INSERT IGNORE INTO usuarioinsignia (id_usuario, id_insignia) VALUES (?, ?)');
        if (!$stmt) throw new Exception('No se pudo preparar la asignación de la insignia.');
        $stmt->bind_param('ii', $idUsuario, $idInsignia);
        if (!$stmt->execute()) {
            $stmt->close();
            throw new Exception('No se pudo asignar la insignia.');
        }
        if ($stmt->affected_rows === 1) $insigniasNuevas[] = $recompensa['nombre'];
        $stmt->close();
    }

    $conexion->commit();

    if (count($insigniasNuevas) > 0) {
        $mensaje = '¡Encontraste a Vivi y desbloqueaste ' . implode(', ', $insigniasNuevas) . '!';
    } else {
        $mensaje = '¡Encontraste a Vivi! 🦦 ¡Volvé otro día para encontrarla de nuevo!';
    }

    responder(200, [
        'success' => true,
        'insignias_nuevas' => $insigniasNuevas,
        'insignia_nueva' => count($insigniasNuevas) > 0,
        'mensaje' => $mensaje
    ]);
} catch (Throwable $e) {
    $conexion->rollback();
    error_log('Nutria Escondida: ' . $e->getMessage());
    responder(500, ['success' => false, 'mensaje' => 'Ocurrió un error al guardar tu captura.']);
}
