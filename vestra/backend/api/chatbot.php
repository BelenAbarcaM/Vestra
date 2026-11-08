<?php

ini_set('log_errors', '1');
ini_set('display_errors', '0');

error_reporting(E_ALL);

register_shutdown_function(function () {
    $error = error_get_last();

    if ($error !== null) {
        error_log("VESTRA CHATBOT SHUTDOWN ERROR:");
        error_log(print_r($error, true));
    }
});



require_once __DIR__ . '/../config/cors.php';
session_start();
if (function_exists('mysqli_report')) {
    mysqli_report(MYSQLI_REPORT_OFF);
}
include '../config/conexion.php';
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

    $resultado = $conexion->query("
        SELECT Nombre, Descripcion
        FROM club
        ORDER BY Nombre
    ");

    if ($resultado) {
        while ($fila = $resultado->fetch_assoc()) {
            $clubes[] = $fila;
        }
    }

    return $clubes;
}

function obtenerHistorialGemini($conexion, $conversacionId) {
    $historial = [];

    if ($conversacionId <= 0) {
        return $historial;
    }

    $stmt = $conexion->prepare("
        SELECT remitente, mensaje
        FROM (
            SELECT id, remitente, mensaje
            FROM mensajes
            WHERE conversacion_id = ?
            ORDER BY id DESC
            LIMIT 12
        ) AS recientes
        ORDER BY id ASC
    ");

    if (!$stmt) return $historial;

    $stmt->bind_param("i", $conversacionId);
    $stmt->execute();

    $resultado = $stmt->get_result();

    while ($fila = $resultado->fetch_assoc()) {
        if ($fila['remitente'] === 'user') {
            $historial[] = [
                'role' => 'user',
                'parts' => [['text' => $fila['mensaje']]]
            ];
        } elseif ($fila['remitente'] === 'bot') {
            $historial[] = [
                'role' => 'model',
                'parts' => [['text' => $fila['mensaje']]]
            ];
        }
    }

    $stmt->close();

    return $historial;
}

function obtenerContextoVestra($conexion) {
    $clubes = obtenerClubes($conexion);

    $listaClubes = [];

    foreach ($clubes as $club) {
        $listaClubes[] =
            $club['Nombre'] . ': ' . $club['Descripcion'];
    }

    return "
INFORMACIÓN DE VESTRA:

Vestra significa Vía Estudiantil Salesiana.

Es una plataforma escolar para CEDES Don Bosco
que busca mejorar la comunicación y participación
de la comunidad educativa.

FUNCIONALIDADES:
- Publicaciones.
- Clubes y asociaciones.
- Inscripciones a clubes.
- Eventos y actividades.
- Comentarios.
- Perfiles de usuarios.

CLUBES REGISTRADOS:
" . implode("\n", $listaClubes) . "

DATOS DE LA PLATAFORMA:
Publicaciones: " . contarFilas($conexion, 'publicacion') . "
Comentarios: " . contarFilas($conexion, 'comentario') . "
Eventos: " . contarFilas($conexion, 'evento') . "

Utiliza estos datos cuando sean relevantes.
Nunca inventes información que no esté disponible.
";
}


function generarRespuestaGemini(
    $mensaje,
    $conexion,
    $conversacionId,
    $modoSinBd
) {
    $gemini = obtenerConfigGemini();

    if (
        empty($gemini['api_key']) ||
        !function_exists('curl_init')
    ) {
        error_log("Vestra: Gemini no tiene API KEY o CURL.");
        return '';
    }

    // Modelo principal y modelo de respaldo.
    $modelos = array_unique([
        $gemini['model'] ?? 'gemini-3.8-flash',
        $gemini['fallback_model'] ?? 'gemini-3.5-flash-lite'
    ]);

    $historial = [];

    if (!$modoSinBd) {
        $historial = obtenerHistorialGemini(
            $conexion,
            $conversacionId
        );

        $contexto = obtenerContextoVestra($conexion);
    } else {
        $contexto = "
Vestra es una red social escolar para CEDES Don Bosco.
Centraliza publicaciones, clubes, inscripciones,
eventos y comunicación estudiantil.

No tienes acceso a la base de datos en este momento.
No inventes registros ni información específica.
";
    }

    $instrucciones = "
Eres Vivi, la asistente virtual de Vestra.

PERSONALIDAD:
- Eres amable, inteligente y cercana.
- Hablas español natural.
- Tu tono es juvenil, pero respetuoso.
- No pareces un robot ni un asistente excesivamente formal.
- Evitas repetir estructuras y frases.
- No comienzas todas tus respuestas con la misma expresión.

COMPORTAMIENTO:
- Comprende la intención de cada pregunta.
- Analiza el contexto de los mensajes anteriores.
- Responde directamente y con información útil.
- Puedes explicar, comparar, dar ejemplos y desarrollar ideas.
- No te limites a responder con definiciones.
- Si el usuario hace una pregunta de seguimiento,
  comprende a qué se refiere utilizando el historial.
- No repitas información que ya explicaste innecesariamente.

RESTRICCIONES:
- Tu función principal es ayudar con Vestra y su funcionamiento.
- Puedes conversar sobre CEDES Don Bosco,
  clubes, actividades, inscripciones y funcionalidades.
- Si te preguntan algo completamente ajeno al proyecto,
  explica amablemente que tu especialidad es Vestra.
- Nunca inventes clubes, eventos, horarios o registros.
- Si no tienes acceso a un dato, dilo claramente.
- No afirmes haber realizado acciones que no puedes ejecutar.

INFORMACIÓN DEL PROYECTO:
$contexto

Responde según lo que realmente te está preguntando
el estudiante. Prioriza la utilidad y la naturalidad.
";

    $historial[] = [
        'role' => 'user',
        'parts' => [
            ['text' => $mensaje]
        ]
    ];

    $payload = [
        'systemInstruction' => [
            'parts' => [
                ['text' => $instrucciones]
            ]
        ],
        'contents' => $historial,
        'generationConfig' => [
            'temperature' => 0.7,
            'topP' => 0.9,
            'maxOutputTokens' => 700
        ]
    ];

    // Intentar primero el modelo principal y luego el alternativo.
    foreach ($modelos as $indice => $modelo) {

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($modelo)
            . ':generateContent?key='
            . urlencode($gemini['api_key']);

        $curl = curl_init($url);

        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode(
                $payload,
                JSON_UNESCAPED_UNICODE
            ),
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_PROXY => '',
            CURLOPT_NOPROXY => '*'
        ]);

        $rawResponse = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);

        curl_close($curl);

        // Si la solicitud falla, registrar el error.
        if (
            $rawResponse === false ||
            $httpCode < 200 ||
            $httpCode >= 300
        ) {
            error_log("========== VESTRA GEMINI ERROR ==========");
            error_log("MODELO: " . $modelo);
            error_log("HTTP: " . $httpCode);
            error_log("CURL: " . $curlError);
            error_log("RESPUESTA GOOGLE: " . ($rawResponse ?: 'Sin respuesta'));
            error_log("=========================================");

            // Errores ante los que vale la pena probar el respaldo.
            $erroresReintentables = [
                0, 404, 429, 500, 502, 503, 504
            ];

            if (!in_array($httpCode, $erroresReintentables, true)) {
                return '';
            }

            continue;
        }

        $respuesta = json_decode($rawResponse, true);

        if (!is_array($respuesta)) {
            error_log("Vestra: respuesta JSON inválida de " . $modelo);
            continue;
        }

        // Si Google bloquea el mensaje, no probar otro modelo.
        if (
            !empty($respuesta['promptFeedback']['blockReason']) ||
            (($respuesta['candidates'][0]['finishReason'] ?? '') === 'SAFETY')
        ) {
            return respuestaMensajeBloqueado();
        }

        $texto = extraerTextoGemini($respuesta);

        if ($texto !== '') {

            if ($indice > 0) {
                error_log(
                    "VESTRA: respuesta generada con modelo de respaldo: "
                    . $modelo
                );
            }

            return $texto;
        }

        error_log("Vestra: el modelo " . $modelo . " no devolvió texto.");
    }

    error_log("Vestra: fallaron el modelo principal y el de respaldo.");

    return '';
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

function respuestaFueraDelProyecto() {
    return "Puedo ayudarte con gusto, pero solo con temas relacionados con Vestra: clubes, inscripciones, publicaciones, eventos, objetivos del proyecto, CEDES Don Bosco y funcionamiento de la plataforma.";
}

function prepararTextoModeracion($mensaje) {
    $texto = normalizarTexto($mensaje);

    if (function_exists('iconv')) {
        $sinAcentos = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
        if ($sinAcentos !== false) {
            $texto = strtolower($sinAcentos);
        }
    }

    $texto = strtr($texto, [
        '4' => 'a',
        '@' => 'a',
        '3' => 'e',
        '1' => 'i',
        '!' => 'i',
        '0' => 'o',
        '5' => 's',
        '7' => 't',
        '$' => 's'
    ]);

    return preg_replace('/(.)\1{2,}/', '$1$1', $texto);
}

function mensajeBloqueadoLocal($mensaje) {
    $texto = prepararTextoModeracion($mensaje);
    $compacto = preg_replace('/[^a-z0-9]+/', '', $texto);

    $bloqueadas = [
        'puta',
        'puto',
        'putas',
        'putos',
        'carepicha',
        'mierda',
        'mrd',
        'hijueputa',
        'hp',
        'malparido',
        'maldito',
        'imbecil',
        'idiota',
        'estupido',
        'estupida',
        'maricon',
        'zorra',
        'perra',
        'cabron',
        'cabrona',
        'pendejo',
        'pendeja',
        'mamapichas',
        'cochino',
        'cochina'
    ];

    foreach ($bloqueadas as $palabra) {
        if (strpos($compacto, $palabra) !== false) {
            return true;
        }
    }

    return false;
}

function mensajeEsDelProyectoLocal($mensaje) {
    $texto = prepararTextoModeracion($mensaje);
    $compacto = preg_replace('/[^a-z0-9]+/', '', $texto);

    $permitidas = [
        'vestra',
        'viaestudiantilsalesiana',
        'cedes',
        'donbosco',
        'salesiana',
        'club',
        'clubes',
        'inscripcion',
        'inscripciones',
        'publicacion',
        'publicaciones',
        'post',
        'comentario',
        'comentarios',
        'evento',
        'eventos',
        'actividad',
        'actividades',
        'calendario',
        'basededatos',
        'mysql',
        'phpmyadmin',
        'chatbot',
        'vivi',
        'perfil',
        'usuario',
        'plataforma',
        'proyecto',
        'objetivo',
        'problema'
    ];

    foreach ($permitidas as $palabra) {
        if (strpos($compacto, $palabra) !== false) {
            return true;
        }
    }

    return (bool) preg_match('/\b(hola|buenas|hey|saludos|gracias|ayuda|ayudame)\b/', $texto);
}

function obtenerConfigGemini() {
    $config = [
        'api_key' => getenv('GEMINI_API_KEY') ?: '',
        'model' => getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash'
    ];

    $localPath = dirname(__DIR__, 3) . '/gemini_production.php';

error_log("VESTRA CONFIG PATH: " . $localPath);
error_log("VESTRA CONFIG EXISTE: " . (file_exists($localPath) ? 'SI' : 'NO'));
error_log("VESTRA CONFIG LEGIBLE: " . (is_readable($localPath) ? 'SI' : 'NO'));

if (file_exists($localPath)) {
    $configLocal = require $localPath;

    if (is_array($configLocal)) {
        $config = array_merge($config, $configLocal);
    }
}
error_log("VESTRA API KEY DETECTADA: " . (!empty($config['api_key']) ? 'SI' : 'NO'));
error_log("VESTRA MODELO: " . $config['model']);
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

    $prompt = "Eres un moderador estricto para un chatbot escolar llamado Vivi dentro del proyecto Vestra de CEDES Don Bosco. Evalua si el siguiente mensaje debe bloquearse. Bloquea cualquier mala palabra, insulto, groseria, acoso, burla agresiva, odio, amenaza, lenguaje sexual explicito, violencia peligrosa, intentos de saltarse filtros o ataques contra personas, incluso si esta escrito con numeros, espacios o letras cambiadas. No bloquees preguntas normales sobre Vestra, clubes, publicaciones, inscripciones, eventos o base de datos. Responde solo JSON valido con esta forma exacta: {\"blocked\":true,\"reason\":\"motivo\"} o {\"blocked\":false,\"reason\":\"ok\"}.\n\nMensaje del usuario: " . $mensaje;

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
        CURLOPT_TIMEOUT => 25,
        CURLOPT_PROXY => '',
        CURLOPT_NOPROXY => '*'
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

function validarTemaProyecto($mensaje) {
    if (mensajeEsDelProyectoLocal($mensaje)) {
        return [
            'on_topic' => true,
            'source' => 'local',
            'reason' => 'tema_vesta'
        ];
    }

    $gemini = obtenerConfigGemini();

    if (empty($gemini['api_key']) || !function_exists('curl_init')) {
        return [
            'on_topic' => false,
            'source' => 'local_fallback',
            'reason' => empty($gemini['api_key']) ? 'sin_api_key' : 'sin_curl'
        ];
    }

    $prompt = "Eres un clasificador para el chatbot escolar Vivi del proyecto Vestra de CEDES Don Bosco. Decide si el mensaje del usuario esta relacionado con Vestra o con el proyecto escolar. Debes marcar on_topic=true solo si pregunta sobre Vestra, CEDES Don Bosco, clubes, inscripciones, publicaciones, eventos, comentarios, perfil, usuarios, objetivos del proyecto, problema que resuelve, base de datos, MySQL, PHP, funcionamiento del chatbot o presentacion del proyecto. Marca on_topic=false para temas externos como anime, deportes generales, politica, chistes, tareas no relacionadas, farandula, videojuegos, comida o preguntas generales que no tengan relacion con Vestra. Responde solo JSON valido con esta forma exacta: {\"on_topic\":true,\"reason\":\"motivo\"} o {\"on_topic\":false,\"reason\":\"motivo\"}.\n\nMensaje del usuario: " . $mensaje;

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
        CURLOPT_TIMEOUT => 25,
        CURLOPT_PROXY => '',
        CURLOPT_NOPROXY => '*'
    ]);

    $rawResponse = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($rawResponse === false || $httpCode < 200 || $httpCode >= 300) {
        return [
            'on_topic' => false,
            'source' => 'local_fallback',
            'reason' => 'gemini_no_disponible'
        ];
    }

    $respuesta = json_decode($rawResponse, true);
    if (!is_array($respuesta)) {
        return [
            'on_topic' => false,
            'source' => 'local_fallback',
            'reason' => 'gemini_json_invalido'
        ];
    }

    $json = decodificarJsonGemini(extraerTextoGemini($respuesta));

    return [
        'on_topic' => (bool) ($json['on_topic'] ?? false),
        'source' => 'gemini',
        'reason' => $json['reason'] ?? 'sin_motivo'
    ];
}

function generarRespuestaGeminiSinBd($mensaje) {
    $gemini = obtenerConfigGemini();

    if (empty($gemini['api_key']) || !function_exists('curl_init')) {
        return '';
    }

    $modelos = [
        $gemini['model'] ?? 'gemini-3.8-flash',
        $gemini['fallback_model'] ?? 'gemini-3.5-flash-lite'
    ];

    // Evitar intentar dos veces el mismo modelo.
    $modelos = array_unique($modelos);

    $prompt = "Eres Vivi, un asistente escolar amable para el proyecto Vestra de CEDES Don Bosco. La interfaz del chat ya mostro el saludo inicial, asi que NO empieces con hola, no digas Soy Vivi y no te presentes otra vez. Responde directamente la pregunta del usuario con un inicio natural y variado; puedes empezar con frases como Claro, Sobre eso, En Vestra, Buena pregunta, Te cuento, o directamente con la informacion. No uses siempre la frase La respuesta a tu pregunta es. Estas en modo de prueba sin base de datos, asi que no puedes guardar conversaciones ni consultar registros reales. Responde en espanol, natural y en 2 a 4 oraciones. Puedes ayudar con: que es Vestra, clubes, inscripciones, publicaciones, eventos, objetivo del proyecto, funcionamiento general y como se conectaria con MySQL. Si te preguntan por datos exactos de la base de datos, aclara que en este modo no tienes acceso a MySQL.

Datos base del proyecto: Vestra significa Via Estudiantil Salesiana. Es una red social escolar para CEDES Don Bosco que centraliza publicaciones, clubes, eventos, comentarios e informacion importante para mejorar la comunicacion y participacion estudiantil.

Usuario: " . $mensaje;

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

    foreach ($modelos as $indice => $modelo) {

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($modelo)
            . ':generateContent?key='
            . urlencode($gemini['api_key']);

        $curl = curl_init($url);

        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_PROXY => '',
            CURLOPT_NOPROXY => '*'
        ]);

        $rawResponse = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);

        curl_close($curl);

        // Si la solicitud funcionó, procesamos la respuesta.
        if ($rawResponse !== false && $httpCode >= 200 && $httpCode < 300) {

            $respuesta = json_decode($rawResponse, true);

            if (!is_array($respuesta)) {
                return '';
            }

            if (
                !empty($respuesta['promptFeedback']['blockReason']) ||
                (($respuesta['candidates'][0]['finishReason'] ?? '') === 'SAFETY')
            ) {
                return respuestaMensajeBloqueado();
            }

            $texto = extraerTextoGemini($respuesta);

            if ($texto !== '') {
                if ($indice > 0) {
                    error_log("VESTRA: respuesta generada con modelo de respaldo: " . $modelo);
                }

                return $texto;
            }

            return '';
        }

        error_log("VESTRA GEMINI ERROR - Modelo: " . $modelo);
        error_log("HTTP: " . $httpCode);
        error_log("CURL: " . $curlError);
        error_log("RESPUESTA: " . ($rawResponse ?: 'Sin respuesta'));

        // Solo cambiar de modelo ante errores que podrían ser temporales
        // o problemas específicos del modelo principal.
        $erroresReintentables = [0, 404, 429, 500, 502, 503, 504];

        if (!in_array($httpCode, $erroresReintentables, true)) {
            return '';
        }
    }

    return '';
}

function generarRespuesta($mensaje, $conexion) {
    $texto = normalizarTexto($mensaje);

    if (mensajeBloqueadoLocal($mensaje)) {
        return respuestaMensajeBloqueado();
    }

    if (preg_match('/\b(hola|buenas|hey|saludos)\b/', $texto)) {
        return "Aqui estoy. Puedo ayudarte con dudas sobre Vestra, clubes, inscripciones, publicaciones y el uso de la plataforma.";
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
$tema = [
    'on_topic' => true,
    'source' => 'not_checked',
    'reason' => 'mensaje_bloqueado'
];
$fueraTema = false;
$respuesta = respuestaMensajeBloqueado();

if (!$moderacion['blocked']) {

    $tema = [
        'on_topic' => true,
        'source' => 'gemini_prompt',
        'reason' => 'clasificacion_delegada'
    ];

    $fueraTema = false;

    $respuestaGemini = generarRespuestaGemini(
        $mensaje,
        $conexion,
        $conversacionId,
        $modoSinBd
    );

    if ($respuestaGemini !== '') {
        $respuesta = $respuestaGemini;
    } else {
        $respuesta = "No pude conectar con mi servicio de inteligencia artificial en este momento. Inténtalo nuevamente en unos segundos.";
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
    "modo_sin_bd" => $modoSinBd,
    "bloqueado" => (bool) $moderacion['blocked'],
    "fuera_tema" => (bool) $fueraTema
]);

if ($dbDisponible) {
    $conexion->close();
}
?>
