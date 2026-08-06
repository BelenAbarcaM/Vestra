<?php
session_start();
include '../config/conexion.php';

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($conexion->connect_errno) {
    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudo conectar con la base de datos."
    ]);
    exit;
}

function crearTablasChatbot($conexion) {
    $conexion->query("
        CREATE TABLE IF NOT EXISTS conversaciones (
            id int unsigned NOT NULL AUTO_INCREMENT,
            usuario_id int unsigned DEFAULT NULL,
            session_token varchar(255) DEFAULT NULL,
            titulo varchar(255) DEFAULT 'Nueva Conversacion',
            fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_conversaciones_session (session_token),
            KEY idx_conversaciones_usuario (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $conexion->query("
        CREATE TABLE IF NOT EXISTS mensajes (
            id int unsigned NOT NULL AUTO_INCREMENT,
            conversacion_id int unsigned NOT NULL,
            remitente enum('user','bot','system') NOT NULL,
            mensaje text NOT NULL,
            fecha_envio datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_mensajes_conversacion (conversacion_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function normalizarTexto($texto) {
    $texto = function_exists('mb_strtolower')
        ? mb_strtolower($texto, 'UTF-8')
        : strtolower($texto);
    $texto = str_replace(
        ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
        ['a', 'e', 'i', 'o', 'u', 'u', 'n'],
        $texto
    );
    return $texto;
}

function obtenerClubes($conexion) {
    $clubes = [];
    $resultado = $conexion->query("SELECT Nombre, Descripcion FROM club ORDER BY Nombre LIMIT 8");

    if ($resultado) {
        while ($fila = $resultado->fetch_assoc()) {
            $clubes[] = $fila;
        }
    }

    return $clubes;
}

function contarFilas($conexion, $tabla) {
    $tabla = preg_replace('/[^a-zA-Z0-9_]/', '', $tabla);
    $resultado = $conexion->query("SELECT COUNT(*) AS total FROM `$tabla`");

    if ($resultado && ($fila = $resultado->fetch_assoc())) {
        return (int) $fila['total'];
    }

    return 0;
}

function generarRespuesta($mensaje, $conexion) {
    $texto = normalizarTexto($mensaje);

    $bloqueadas = ['puta', 'carepicha', 'mierda', 'hijueputa'];
    foreach ($bloqueadas as $palabra) {
        if (strpos($texto, $palabra) !== false) {
            return "Soy Vivi, el asistente de Vestra. Puedo ayudarte con informacion del proyecto, clubes, publicaciones, inscripciones y funcionamiento de la plataforma. Mantengamos una conversacion respetuosa.";
        }
    }

    if (preg_match('/\b(hola|buenas|hey|saludos)\b/', $texto)) {
        return "Hola, soy Vivi. Puedo ayudarte con dudas sobre Vestra, clubes, inscripciones, publicaciones y el uso de la plataforma.";
    }

    if (strpos($texto, 'que es vestra') !== false || strpos($texto, 'que significa vestra') !== false || strpos($texto, 'vestra') !== false && strpos($texto, 'que') !== false) {
        return "Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.";
    }

    if (strpos($texto, 'problema') !== false || strpos($texto, 'objetivo') !== false) {
        return "El problema principal que atiende Vestra es la falta de informacion centralizada y la baja participacion estudiantil en actividades, clubes y eventos. El objetivo es facilitar la comunicacion y motivar a la comunidad a involucrarse.";
    }

    if (strpos($texto, 'club') !== false || strpos($texto, 'asociacionismo') !== false || strpos($texto, 'inscripcion') !== false) {
        $clubes = obtenerClubes($conexion);

        if (count($clubes) > 0) {
            $resumenes = array_map(function ($club) {
                $descripcion = trim($club['Descripcion'] ?? '');
                $largo = function_exists('mb_strlen') ? mb_strlen($descripcion) : strlen($descripcion);
                if ($largo > 90) {
                    $descripcion = function_exists('mb_substr')
                        ? mb_substr($descripcion, 0, 87) . '...'
                        : substr($descripcion, 0, 87) . '...';
                }
                return $club['Nombre'] . ($descripcion ? ': ' . $descripcion : '');
            }, $clubes);

            return "En Vestra puedes revisar clubes e inscripciones. Clubes registrados: " . implode(" | ", $resumenes);
        }

        return "En Vestra los estudiantes pueden descubrir clubes, revisar informacion e iniciar solicitudes de inscripcion. Aun no encontre clubes cargados en la base de datos.";
    }

    if (strpos($texto, 'publicacion') !== false || strpos($texto, 'post') !== false || strpos($texto, 'comentario') !== false) {
        $publicaciones = contarFilas($conexion, 'publicacion');
        $comentarios = contarFilas($conexion, 'comentario');

        return "La plataforma maneja publicaciones y comentarios para mantener informada a la comunidad. Ahora mismo la base de datos registra " . $publicaciones . " publicaciones y " . $comentarios . " comentarios.";
    }

    if (strpos($texto, 'evento') !== false || strpos($texto, 'actividad') !== false || strpos($texto, 'calendario') !== false) {
        $eventos = contarFilas($conexion, 'evento');
        return "Vestra puede centralizar eventos y actividades institucionales. En la base de datos hay " . $eventos . " eventos registrados.";
    }

    if (strpos($texto, 'base de datos') !== false || strpos($texto, 'mysql') !== false || strpos($texto, 'phpmyadmin') !== false) {
        return "Este chatbot funciona con MySQL desde PHP. Guarda la conversacion en las tablas conversaciones y mensajes, y puede consultar tablas de Vestra como club, publicacion, comentario y evento.";
    }

    return "Puedo ayudarte con informacion sobre Vestra, CEDES Don Bosco, clubes, inscripciones, publicaciones, eventos y la base de datos del proyecto. Preguntame algo de esas areas y te respondo con gusto.";
}

crearTablasChatbot($conexion);

$data = json_decode(file_get_contents("php://input"), true);
$mensaje = trim($data['mensaje'] ?? '');
$sessionToken = trim($data['session_token'] ?? '');
$conversacionId = isset($data['conversacion_id']) ? (int) $data['conversacion_id'] : 0;
$usuarioId = null;

if ($mensaje === '') {
    echo json_encode([
        "success" => false,
        "mensaje" => "Escriba un mensaje para continuar."
    ]);
    exit;
}

if ($sessionToken === '') {
    $sessionToken = uniqid('sess_', true);
}

if ($conversacionId <= 0) {
    $stmt = $conexion->prepare("SELECT id FROM conversaciones WHERE session_token = ? ORDER BY id DESC LIMIT 1");
    $stmt->bind_param("s", $sessionToken);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($fila = $resultado->fetch_assoc()) {
        $conversacionId = (int) $fila['id'];
    }
    $stmt->close();
}

if ($conversacionId <= 0) {
    $titulo = function_exists('mb_substr') ? mb_substr($mensaje, 0, 70) : substr($mensaje, 0, 70);
    $stmt = $conexion->prepare("INSERT INTO conversaciones (usuario_id, session_token, titulo) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $usuarioId, $sessionToken, $titulo);
    $stmt->execute();
    $conversacionId = $stmt->insert_id;
    $stmt->close();
}

$respuesta = generarRespuesta($mensaje, $conexion);

$stmt = $conexion->prepare("INSERT INTO mensajes (conversacion_id, remitente, mensaje) VALUES (?, 'user', ?)");
$stmt->bind_param("is", $conversacionId, $mensaje);
$stmt->execute();
$stmt->close();

$stmt = $conexion->prepare("INSERT INTO mensajes (conversacion_id, remitente, mensaje) VALUES (?, 'bot', ?)");
$stmt->bind_param("is", $conversacionId, $respuesta);
$stmt->execute();
$stmt->close();

echo json_encode([
    "success" => true,
    "respuesta" => $respuesta,
    "conversacion_id" => $conversacionId,
    "session_token" => $sessionToken
]);

$conexion->close();
?>
