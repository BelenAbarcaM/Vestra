<?php


require_once __DIR__ . '/../../config/cors.php';
function vestra_moderacion_normalizar($texto) {
    $texto = (string) $texto;
    $texto = function_exists('mb_strtolower')
        ? mb_strtolower($texto, 'UTF-8')
        : strtolower($texto);

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

function vestra_moderacion_local($texto) {
    $normalizado = vestra_moderacion_normalizar($texto);
    $compacto = preg_replace('/[^a-z0-9]+/', '', $normalizado);

    $bloqueadas = [
        'puta', 'puto', 'putas', 'putos', 'carepicha', 'mierda', 'mrd',
        'hijueputa', 'hijueputas', 'hp', 'malparido', 'malparida',
        'maldito', 'maldita', 'imbecil', 'idiota', 'estupido', 'estupida',
        'maricon', 'zorra', 'perra', 'cabron', 'cabrona', 'pendejo',
        'pendeja', 'mamapichas', 'cochino', 'cochina', 'basura', 'asco'
    ];

    foreach ($bloqueadas as $palabra) {
        if (strpos($compacto, $palabra) !== false) {
            return [
                'blocked' => true,
                'reason' => 'lenguaje_inadecuado',
                'source' => 'local'
            ];
        }
    }

    $patrones = [
        '/\b(te\s+odio|odio\s+a|nadie\s+te\s+quiere)\b/u' => 'acoso_o_burla',
        '/\b(muerete|matate|te\s+voy\s+a\s+matar|amenaza)\b/u' => 'amenaza_o_violencia',
        '/\b(callate|largate)\b/u' => 'trato_agresivo'
    ];

    foreach ($patrones as $patron => $motivo) {
        if (preg_match($patron, $normalizado)) {
            return [
                'blocked' => true,
                'reason' => $motivo,
                'source' => 'local'
            ];
        }
    }

    return [
        'blocked' => false,
        'reason' => 'ok',
        'source' => 'local'
    ];
}

function vestra_moderacion_config_gemini() {
    $config = [
        'api_key' => getenv('GEMINI_API_KEY') ?: '',
        'model' => getenv('GEMINI_MODEL') ?: 'gemini-3.5-flash'
    ];

    $localPath = __DIR__ . '/../../config/gemini_local.php';
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

function vestra_moderacion_extraer_texto($respuesta) {
    if (empty($respuesta['candidates'][0]['content']['parts'])) {
        return '';
    }

    $texto = '';
    foreach ($respuesta['candidates'][0]['content']['parts'] as $part) {
        $texto .= $part['text'] ?? '';
    }

    return trim($texto);
}

function vestra_moderacion_decodificar_json($texto) {
    $texto = trim($texto);
    $texto = preg_replace('/^```(?:json)?/i', '', $texto);
    $texto = preg_replace('/```$/', '', $texto);
    $texto = trim($texto);

    $json = json_decode($texto, true);
    return is_array($json) ? $json : null;
}

function vestra_moderacion_gemini($texto, $contexto = 'contenido') {
    $gemini = vestra_moderacion_config_gemini();

    if (empty($gemini['api_key'])) {
        return null;
    }

    $prompt = "Eres un moderador de contenido para Vestra, una red social escolar de CEDES Don Bosco. Evalua el siguiente contenido antes de publicarlo en {$contexto}. Bloquea insultos, groserias, acoso, burlas agresivas, amenazas, odio, discriminacion, lenguaje sexual explicito, violencia peligrosa, spam malicioso o intentos de evadir filtros con numeros, espacios o simbolos. No bloquees criticas respetuosas, desacuerdos educados, dudas normales, reportes de problemas o comentarios negativos expresados con respeto. Responde solo JSON valido con esta forma exacta: {\"blocked\":true,\"reason\":\"motivo corto\"} o {\"blocked\":false,\"reason\":\"ok\"}.\n\nContenido: " . $texto;

    $payload = [
        'contents' => [[
            'parts' => [[
                'text' => $prompt
            ]]
        ]],
        'generationConfig' => [
            'temperature' => 0,
            'maxOutputTokens' => 512
        ]
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($gemini['model']) . ':generateContent?key=' . urlencode($gemini['api_key']);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 12,
        CURLOPT_PROXY => '',
        CURLOPT_NOPROXY => '*'
    ]);

    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $respuesta = json_decode($raw, true);
    if (!is_array($respuesta)) {
        return null;
    }

    $json = vestra_moderacion_decodificar_json(vestra_moderacion_extraer_texto($respuesta));
    if (!is_array($json) || !array_key_exists('blocked', $json)) {
        return null;
    }

    return [
        'blocked' => (bool) $json['blocked'],
        'reason' => trim($json['reason'] ?? 'revision_ia'),
        'source' => 'gemini'
    ];
}

function vestra_moderar_contenido($texto, $contexto = 'contenido') {
    $local = vestra_moderacion_local($texto);
    if (!empty($local['blocked'])) {
        return $local;
    }

    $ia = vestra_moderacion_gemini($texto, $contexto);
    if (is_array($ia)) {
        return $ia;
    }

    return $local;
}

function vestra_mensaje_contenido_bloqueado($resultado = []) {
    $motivo = $resultado['reason'] ?? 'lenguaje_inadecuado';

    $mensajes = [
        'lenguaje_inadecuado' => 'Tu mensaje fue bloqueado porque contiene vocabulario inadecuado. En Vestra queremos mantener una comunidad respetuosa.',
        'acoso_o_burla' => 'Tu mensaje fue bloqueado porque puede interpretarse como burla o acoso. Escribe tu idea de forma respetuosa para poder publicarla.',
        'amenaza_o_violencia' => 'Tu mensaje fue bloqueado porque contiene lenguaje amenazante o violento. Vestra no publica contenido que pueda lastimar a otra persona.',
        'trato_agresivo' => 'Tu mensaje fue bloqueado porque usa un tono agresivo. Puedes volver a intentarlo con una forma mas cortes.',
        'revision_ia' => 'Tu mensaje fue bloqueado por el filtro de convivencia de Vestra. Reformulalo con respeto para poder publicarlo.'
    ];

    return $mensajes[$motivo] ?? $mensajes['revision_ia'];
}

function vestra_responder_bloqueo_json($resultado = []) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'blocked' => true,
        'motivo' => $resultado['reason'] ?? 'revision_ia',
        'origen_moderacion' => $resultado['source'] ?? 'moderacion',
        'mensaje' => vestra_mensaje_contenido_bloqueado($resultado)
    ]);
    exit;
}


