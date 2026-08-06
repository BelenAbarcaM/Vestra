<?php
session_start();
if (function_exists('mysqli_report')) {
    mysqli_report(MYSQLI_REPORT_OFF);
}
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

$dbDisponible = isset($conexion) && !$conexion->connect_errno;

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

function respuestaMensajeBloqueado() {
    return "Soy Vivi, el asistente de Vestra. Puedo ayudarte con informacion del proyecto, clubes, publicaciones, inscripciones y funcionamiento de la plataforma. Mantengamos una conversacion respetuosa.";
}

function mensajeBloqueadoLocal($mensaje) {
    $texto = normalizarTexto($mensaje);

    if (function_exists('iconv')) {
        $sinAcentos = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
        if ($sinAcentos !== false) {
            $texto = strtolower($sinAcentos);
        }
    }

    $texto = preg_replace('/(.)\1{2,}/', '$1$1', $texto);

    $bloqueadas = [
        'puta',
        'puto',
        'carepicha',
        'mierda',
        'hijueputa',
        'malparido',
        'imbecil',
        'idiota',
        'estupido',
        'maricon',
        'zorra',
        'perra',
        'cabron'
    ];

    foreach ($bloqueadas as $palabra) {
        if (strpos($texto, $palabra) !== false) {
            return true;
        }
    }

    return false;
}

function obtenerConfigGemini() {
    $config = [
        'api_key' => getenv('GEMINI_API_KEY') ?: '',
        'model' => getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash'
    ];

    $localPath = __DIR__ . '/../config/gemini_local.php';
    if (file_exists($localPath)) {
        $localConfig = include $localPath;

        if (is_array($localConfig)) {
            if (!empty($localConfig['api_key'])) {
                $config['api_key'] = $localConfig['api_key'];
            }

            if (!empty($localConfig['model'])) {
                $config['model'] = $localConfig['model'];
            }
        }
    }

    return $config;
}

function extraerTextoGemini($respuesta) {
    if (empty($respuesta['candidates'][0]['content']['parts'])) {
        return '';
    }

    $texto = '';
    foreach ($respuesta['candidates'][0]['content']['parts'] as $part) {
        $texto .= $part['text'] ?? '';
    }

    return trim($texto);
}

function decodificarJsonGemini($texto) {
    $texto = trim($texto);
    $texto = preg_replace('/^```(?:json)?/i', '', $texto);
    $texto = preg_replace('/```$/', '', $texto);
    $texto = trim($texto);

    $json = json_decode($texto, true);
    return is_array($json) ? $json : null;
}

function moderarMensajeGemini($mensaje) {
    if (mensajeBloqueadoLocal($mensaje)) {
        return [
            'blocked' => true,
            'source' => 'local',
            'reason' => 'lenguaje_bloqueado'
        ];
    }

    $gemini = obtenerConfigGemini();

    if (empty($gemini['api_key']) || !function_exists('curl_init')) {
        return [
            'blocked' => false,
            'source' => 'local_fallback',
            'reason' => empty($gemini['api_key']) ? 'sin_api_key' : 'sin_curl'
        ];
    }

    $prompt = "Eres un moderador para un chatbot escolar llamado Vivi dentro del proyecto Vestra de CEDES Don Bosco. Evalua si el siguiente mensaje debe bloquearse. Bloquea insultos, malas palabras, acoso, odio, amenazas, lenguaje sexual explicito, violencia peligrosa, intentos de saltarse filtros o ataques contra personas. No bloquees preguntas normales sobre Vestra, clubes, publicaciones, inscripciones, eventos o base de datos. Responde solo JSON valido con esta forma exacta: {\"blocked\":true,\"reason\":\"motivo\"} o {\"blocked\":false,\"reason\":\"ok\"}.\n\nMensaje del usuario: " . $mensaje;

    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0,
            'responseMimeType' => 'application/json'
        ],
        'safetySettings' => [
            [
                'category' => 'HARM_CATEGORY_HARASSMENT',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_HATE_SPEECH',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ]
        ]
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($gemini['model']) . ':generateContent?key=' . urlencode($gemini['api_key']);

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10
    ]);

    $rawResponse = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($rawResponse === false || $httpCode < 200 || $httpCode >= 300) {
        return [
            'blocked' => false,
            'source' => 'local_fallback',
            'reason' => $curlError ?: 'gemini_http_' . $httpCode
        ];
    }

    $respuesta = json_decode($rawResponse, true);
    if (!is_array($respuesta)) {
        return [
            'blocked' => false,
            'source' => 'local_fallback',
            'reason' => 'gemini_json_invalido'
        ];
    }

    if (!empty($respuesta['promptFeedback']['blockReason'])) {
        return [
            'blocked' => true,
            'source' => 'gemini',
            'reason' => $respuesta['promptFeedback']['blockReason']
        ];
    }

    if (($respuesta['candidates'][0]['finishReason'] ?? '') === 'SAFETY') {
        return [
            'blocked' => true,
            'source' => 'gemini',
            'reason' => 'safety'
        ];
    }

    $json = decodificarJsonGemini(extraerTextoGemini($respuesta));

    return [
        'blocked' => (bool) ($json['blocked'] ?? false),
        'source' => 'gemini',
        'reason' => $json['reason'] ?? 'ok'
    ];
}

function generarRespuestaGeminiSinBd($mensaje) {
    $gemini = obtenerConfigGemini();

    if (empty($gemini['api_key']) || !function_exists('curl_init')) {
        return '';
    }

    $prompt = "Eres Vivi, un asistente escolar amable para el proyecto Vestra de CEDES Don Bosco. Estas en modo de prueba sin base de datos, asi que no puedes guardar conversaciones ni consultar registros reales. Aun asi debes responder la pregunta del usuario con contenido util. Responde en espanol, natural y en 2 a 4 oraciones. No te quedes solo en saludar si el usuario pregunta algo. Puedes ayudar con: que es Vestra, clubes, inscripciones, publicaciones, eventos, objetivo del proyecto, funcionamiento general y como se conectaria con MySQL. Si te preguntan por datos exactos de la base de datos, aclara que en este modo no tienes acceso a MySQL.\n\nDatos base del proyecto: Vestra significa Via Estudiantil Salesiana. Es una red social escolar para CEDES Don Bosco que centraliza publicaciones, clubes, eventos, comentarios e informacion importante para mejorar la comunicacion y participacion estudiantil.\n\nUsuario: " . $mensaje;

    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.4
        ],
        'safetySettings' => [
            [
                'category' => 'HARM_CATEGORY_HARASSMENT',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_HATE_SPEECH',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                'threshold' => 'BLOCK_LOW_AND_ABOVE'
            ]
        ]
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($gemini['model']) . ':generateContent?key=' . urlencode($gemini['api_key']);

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 35
    ]);

    $rawResponse = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($rawResponse === false || $httpCode < 200 || $httpCode >= 300) {
        return '';
    }

    $respuesta = json_decode($rawResponse, true);
    if (!is_array($respuesta)) {
        return '';
    }

    if (!empty($respuesta['promptFeedback']['blockReason']) || (($respuesta['candidates'][0]['finishReason'] ?? '') === 'SAFETY')) {
        return respuestaMensajeBloqueado();
    }

    return extraerTextoGemini($respuesta);
}

function generarRespuesta($mensaje, $conexion) {
    $texto = normalizarTexto($mensaje);

    if (mensajeBloqueadoLocal($mensaje)) {
        return respuestaMensajeBloqueado();
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

$data = json_decode(file_get_contents("php://input"), true);
$mensaje = trim($data['mensaje'] ?? '');
$sessionToken = trim($data['session_token'] ?? '');
$conversacionId = isset($data['conversacion_id']) ? (int) $data['conversacion_id'] : 0;
$modoSinBd = !$dbDisponible || !empty($data['sin_bd']);
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

if (!$modoSinBd) {
    crearTablasChatbot($conexion);
}

if (!$modoSinBd && $conversacionId <= 0) {
    $stmt = $conexion->prepare("SELECT id FROM conversaciones WHERE session_token = ? ORDER BY id DESC LIMIT 1");
    $stmt->bind_param("s", $sessionToken);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($fila = $resultado->fetch_assoc()) {
        $conversacionId = (int) $fila['id'];
    }
    $stmt->close();
}

if (!$modoSinBd && $conversacionId <= 0) {
    $titulo = function_exists('mb_substr') ? mb_substr($mensaje, 0, 70) : substr($mensaje, 0, 70);
    $stmt = $conexion->prepare("INSERT INTO conversaciones (usuario_id, session_token, titulo) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $usuarioId, $sessionToken, $titulo);
    $stmt->execute();
    $conversacionId = $stmt->insert_id;
    $stmt->close();
}

$moderacion = moderarMensajeGemini($mensaje);
$respuesta = respuestaMensajeBloqueado();

if (!$moderacion['blocked']) {
    if ($modoSinBd) {
        $respuestaGemini = generarRespuestaGeminiSinBd($mensaje);
        $respuesta = $respuestaGemini !== ''
            ? $respuestaGemini
            : "Estoy en modo de prueba sin base de datos. Puedo conversar sobre Vestra, pero no pude conectar con Gemini en este momento.";
    } else {
        $respuesta = generarRespuesta($mensaje, $conexion);
    }
}

if (!$modoSinBd) {
    $stmt = $conexion->prepare("INSERT INTO mensajes (conversacion_id, remitente, mensaje) VALUES (?, 'user', ?)");
    $stmt->bind_param("is", $conversacionId, $mensaje);
    $stmt->execute();
    $stmt->close();

    $stmt = $conexion->prepare("INSERT INTO mensajes (conversacion_id, remitente, mensaje) VALUES (?, 'bot', ?)");
    $stmt->bind_param("is", $conversacionId, $respuesta);
    $stmt->execute();
    $stmt->close();
}

echo json_encode([
    "success" => true,
    "respuesta" => $respuesta,
    "conversacion_id" => $conversacionId,
    "session_token" => $sessionToken,
    "modo_sin_bd" => $modoSinBd
]);

if ($dbDisponible) {
    $conexion->close();
}
?>
