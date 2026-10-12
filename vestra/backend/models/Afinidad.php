<?php

function afinidadCategorias() {
    return [
        'deporte'      => 'Deporte y vida activa',
        'arte'         => 'Arte y creatividad',
        'musica'       => 'Música y escena',
        'tecnologia'   => 'Tecnología e innovación',
        'ciencia'      => 'Ciencias y lógica',
        'idiomas'      => 'Idiomas y cultura',
        'comunicacion' => 'Comunicación y medios',
        'liderazgo'    => 'Liderazgo y servicio',
    ];
}

function afinidadPalabrasClave() {
    return [
        'deporte' => [
            'futbol', 'deporte', 'baloncesto', 'basket', 'voleibol', 'volei', 'atletismo',
            'natacion', 'entrenamiento', 'torneo', 'karate', 'taekwondo', 'gimnasia',
            'balonmano', 'softbol', 'beisbol', 'ciclismo', 'ejercicio', 'fisico', 'futsal', 'boxeo',
        ],
        'arte' => [
            'arte', 'dibujo', 'pintura', 'manualidad', 'teatro', 'danza', 'baile', 'folklor',
            'diseno', 'fotografia', 'artesania', 'ceramica', 'creativ', 'cine', 'escenic', 'folclor',
        ],
        'musica' => [
            'banda', 'musica', 'coro', 'canto', 'guitarra', 'orquesta', 'instrumento',
            'flauta', 'percusion', 'rondalla', 'marimba', 'musical', 'desfile', 'banda de marcha'
        ],
        'tecnologia' => [
            'robotica', 'programacion', 'tecnologia', 'informatica', 'computacion', 'electronica',
            'f1', 'formula', 'drone', 'software', 'web', 'videojuego', 'ingenieria',
            'mecanica', 'innovacion', 'automovil', 'carros',
        ],
        'ciencia' => [
            'matematica', 'matem', 'ciencia', 'fisica', 'quimica', 'biologia', 'ajedrez',
            'olimpiada', 'ecologia', 'ambiente', 'laboratorio', 'astronomia', 'estadistica',
        ],
        'idiomas' => [
            'idioma', 'ingles', 'frances', 'aleman', 'italiano', 'mandarin', 'portugues',
            'lengua', 'lectura', 'literatura', 'cultura', 'bilingue',
        ],
        'comunicacion' => [
            'radio', 'locucion', 'periodismo', 'prensa', 'medios', 'debate', 'oratoria',
            'podcast', 'comunicacion', 'noticia', 'audiovisual', 'locutor', 'camara',
        ],
        'liderazgo' => [
            'actividades', 'liderazgo', 'servicio', 'voluntariado', 'solidari', 'comunidad',
            'pastoral', 'scout', 'gobierno', 'organizacion', 'estudiantil', 'social', 'accion',
        ],
    ];
}

/* Preguntas y sistema de puntos. */
function afinidadBancoPreguntas() {
    return [
        [
            '¿Cómo prefieres pasar una tarde libre?',
            [
                ['Jugando o entrenando algún deporte',                    ['deporte' => 3, 'liderazgo' => 1, 'musica' => -1, 'ciencia' => -1]],
                ['Tocando, cantando o escuchando música',                 ['musica' => 3, 'arte' => 1, 'deporte' => -1]],
                ['Armando, programando o resolviendo un reto',            ['tecnologia' => 3, 'ciencia' => 2, 'arte' => -1]],
                ['Leyendo, aprendiendo idiomas o conversando con gente',  ['idiomas' => 3, 'comunicacion' => 2, 'deporte' => -1]],
            ],
        ],
        [
            'En un trabajo grupal, ¿qué rol sueles tomar?',
            [
                ['Organizo al equipo y reparto las tareas',               ['liderazgo' => 3, 'comunicacion' => 1]],
                ['Aporto ideas creativas y me encargo del diseño',        ['arte' => 3, 'musica' => 1]],
                ['Investigo y resuelvo la parte técnica o los cálculos',  ['ciencia' => 3, 'tecnologia' => 2]],
                ['Presento y explico el trabajo al frente de la clase',   ['comunicacion' => 3, 'idiomas' => 1, 'liderazgo' => 1]],
            ],
        ],
        [
            '¿Qué materia o área disfrutas más?',
            [
                ['Educación física',                                      ['deporte' => 3]],
                ['Matemáticas o Física',                                  ['ciencia' => 3, 'tecnologia' => 1]],
                ['Informática o Electrónica',                             ['tecnologia' => 3, 'ciencia' => 1]],
                ['Artes plásticas o Música',                              ['arte' => 2, 'musica' => 2]],
                ['Inglés, Español u otro idioma',                         ['idiomas' => 3, 'comunicacion' => 1]],
            ],
        ],
        [
            '¿Qué tan cómodo(a) te sientes hablando frente a muchas personas?',
            [
                ['Me encanta, hasta me emociona',                         ['comunicacion' => 3, 'liderazgo' => 2, 'idiomas' => 1]],
                ['Me dan nervios, pero puedo hacerlo',                    ['comunicacion' => 1, 'liderazgo' => 1]],
                ['Prefiero participar en segundo plano',                  ['comunicacion' => -1, 'tecnologia' => 1, 'ciencia' => 1, 'arte' => 1]],
                ['Lo evito cuando puedo',                                 ['comunicacion' => -2, 'liderazgo' => -1]],
            ],
        ],
        [
            '¿Qué tipo de reto te motiva más?',
            [
                ['Superar una marca o ganar una competencia',             ['deporte' => 3, 'liderazgo' => 1]],
                ['Resolver un problema difícil paso a paso',              ['ciencia' => 3, 'tecnologia' => 2]],
                ['Crear algo original desde cero',                        ['arte' => 3, 'tecnologia' => 1, 'musica' => 1]],
                ['Lograr que una actividad o evento salga perfecto',      ['liderazgo' => 3, 'comunicacion' => 1]],
            ],
        ],
        [
            '¿Cuál de estas actividades te gustaría probar?',
            [
                ['Armar un robot o crear una página web',                 ['tecnologia' => 3, 'ciencia' => 1]],
                ['Formar parte de una banda o un coro',                   ['musica' => 3, 'arte' => 1]],
                ['Locutar o producir un programa de radio',               ['comunicacion' => 3, 'tecnologia' => 1, 'musica' => 1]],
                ['Entrenar en un equipo y competir contra otros colegios', ['deporte' => 3, 'liderazgo' => 1]],
                ['Conversar y hacer amistades de otros países',           ['idiomas' => 3, 'comunicacion' => 1]],
            ],
        ],
        [
            '¿Cuánto movimiento físico te gusta que tengan tus actividades?',
            [
                ['Mucho, necesito moverme',                               ['deporte' => 3, 'liderazgo' => 1]],
                ['Algo, siempre que sea divertido',                       ['deporte' => 1, 'arte' => 1, 'musica' => 1]],
                ['Poco, prefiero actividades tranquilas',                 ['deporte' => -2, 'tecnologia' => 1, 'ciencia' => 1, 'idiomas' => 1]],
                ['Ninguno, prefiero actividades de pensar',               ['deporte' => -3, 'ciencia' => 2, 'tecnologia' => 1]],
            ],
        ],
        [
            '¿Cuál de estas frases te describe mejor?',
            [
                ['Siempre tengo energía para jugar y moverme',            ['deporte' => 2, 'liderazgo' => 1]],
                ['Me gusta expresarme con mi creatividad',                ['arte' => 3, 'musica' => 2]],
                ['Me encanta entender cómo funcionan las cosas',          ['ciencia' => 3, 'tecnologia' => 2]],
                ['Se me da fácil llevarme con todos y ayudar',            ['liderazgo' => 3, 'comunicacion' => 2, 'idiomas' => 1]],
            ],
        ],
        [
            '¿Qué prefieres hacer en un evento del colegio?',
            [
                ['Participar en la competencia o el torneo',              ['deporte' => 3]],
                ['Presentarme en el escenario',                           ['musica' => 3, 'arte' => 2, 'comunicacion' => 1]],
                ['Encargarme del sonido, las luces o la pantalla',        ['tecnologia' => 3, 'comunicacion' => 1]],
                ['Organizar y recibir a los invitados',                   ['liderazgo' => 3, 'comunicacion' => 1, 'idiomas' => 1]],
            ],
        ],
        [
            '¿Qué haces cuando te dan una tarea difícil?',
            [
                ['La divido en partes y la resuelvo con lógica',          ['ciencia' => 3, 'tecnologia' => 1]],
                ['Busco una forma creativa y diferente de hacerla',       ['arte' => 2, 'tecnologia' => 1]],
                ['Pido ayuda y la hacemos en equipo',                     ['liderazgo' => 2, 'comunicacion' => 2, 'deporte' => 1]],
                ['Investigo en libros o internet hasta aprender',         ['idiomas' => 1, 'ciencia' => 1, 'tecnologia' => 1]],
            ],
        ],
        [
            '¿Qué te gustaría aprender este año?',
            [
                ['Un nuevo idioma o conocer otras culturas',              ['idiomas' => 3, 'comunicacion' => 1]],
                ['Tocar un instrumento o cantar mejor',                   ['musica' => 3]],
                ['Programar, construir o usar nueva tecnología',          ['tecnologia' => 3, 'ciencia' => 1]],
                ['Una técnica deportiva o mejorar mi condición física',   ['deporte' => 3]],
                ['Dibujar, pintar o hacer manualidades',                  ['arte' => 3]],
            ],
        ],
        [
            '¿Cuál de estas cosas disfrutas más?',
            [
                ['Ayudar a otros y organizar actividades solidarias',     ['liderazgo' => 3, 'comunicacion' => 1]],
                ['Grabar, editar o contar historias',                     ['comunicacion' => 3, 'arte' => 1, 'tecnologia' => 1]],
                ['Hacer cálculos, experimentos o acertijos',              ['ciencia' => 3]],
                ['Trabajar en equipo hacia una meta común',               ['deporte' => 1, 'liderazgo' => 2, 'musica' => 1]],
            ],
        ],
    ];
}

function afinidadResponder($datos, $codigo = 200) {
    http_response_code($codigo);
    echo json_encode($datos);
    exit;
}

function afinidadInicioApi($metodo) {
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: " . $metodo . ", OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        afinidadResponder(["success" => false, "mensaje" => "Método no permitido."], 405);
    }

    session_start();

    if (!isset($_SESSION['id_usuario'])) {
        afinidadResponder(["success" => false, "mensaje" => "Debes iniciar sesión."], 401);
    }

    if ($_SESSION['tipo'] != 1) {
        afinidadResponder(["success" => false, "mensaje" => "El test de afinidad es solo para estudiantes."], 403);
    }

    return $_SESSION['id_usuario'];
}

function afinidadPreguntas($conPesos) {
    $preguntas = [];
    $numero = 1;

    foreach (afinidadBancoPreguntas() as $fila) {
        $opciones = [];
        $letra = 1;

        foreach ($fila[1] as $opcion) {
            $nueva = [
                "id_opcion" => $letra,
                "texto" => $opcion[0]
            ];

            if ($conPesos) {
                $nueva["pesos"] = $opcion[1];
            }

            $opciones[] = $nueva;
            $letra++;
        }

        $preguntas[] = [
            "id_pregunta" => $numero,
            "texto" => $fila[0],
            "opciones" => $opciones
        ];
        $numero++;
    }

    return $preguntas;
}

function afinidadCargarClubes($conexion) {
    $resultado = $conexion->query("SELECT id_club, Nombre, Descripcion, Foto_url FROM club ORDER BY Nombre ASC");
    $clubes = [];

    while ($fila = $resultado->fetch_assoc()) {
        $clubes[] = $fila;
    }

    return $clubes;
}

// validacion de que si respondio. devuelve respuestas
function afinidadRevisarRespuestas($preguntas, $enviadas) {
    if (!is_array($enviadas)) {
        return "No se recibieron respuestas.";
    }

    foreach ($preguntas as $pregunta) {
        $id = $pregunta['id_pregunta'];

        if (!isset($enviadas[$id])) {
            return "Falta responder una pregunta.";
        }

        $valida = false;

        foreach ($pregunta['opciones'] as $opcion) {
            if ($opcion['id_opcion'] == $enviadas[$id]) {
                $valida = true;
            }
        }

        if (!$valida) {
            return "Una de las respuestas no es válida.";
        }
    }

    return "";
}

//afinidad por categoria
function afinidadCalcularCategorias($preguntas, $enviadas) {
    $afinidad = [];

    foreach (afinidadCategorias() as $clave => $nombre) {
        $puntos = 0;
        $minimo = 0;
        $maximo = 0;

        foreach ($preguntas as $pregunta) {
            $menor = 100;
            $mayor = -100;

            foreach ($pregunta['opciones'] as $opcion) {
                $valor = $opcion['pesos'][$clave] ?? 0;

                if ($valor < $menor) {
                    $menor = $valor;
                }

                if ($valor > $mayor) {
                    $mayor = $valor;
                }

                if ($opcion['id_opcion'] == $enviadas[$pregunta['id_pregunta']]) {
                    $puntos = $puntos + $valor;
                }
            }

            $minimo = $minimo + $menor;
            $maximo = $maximo + $mayor;
        }

        if ($maximo > $minimo) {
            $afinidad[$clave] = round(($puntos - $minimo) / ($maximo - $minimo) * 100, 2);
        } else {
            $afinidad[$clave] = 50;
        }
    }

    return $afinidad;
}

function afinidadLimpiarTexto($texto) {
    $texto = mb_strtolower($texto, 'UTF-8');
    $texto = str_replace(
        ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', ',', '.', '-', '(', ')'],
        ['a', 'e', 'i', 'o', 'u', 'u', 'n', ' ', ' ', ' ', ' ', ' '],
        $texto
    );

    return " " . $texto;
}

//se muestran los 3 resultados mas altos
function afinidadClasificarClub($club) {
    $nombre = afinidadLimpiarTexto($club['Nombre']);
    $descripcion = afinidadLimpiarTexto($club['Descripcion']);
    $puntos = [];

    foreach (afinidadPalabrasClave() as $categoria => $palabras) {
        $total = 0;

        foreach ($palabras as $palabra) {
            if (strpos($nombre, " " . $palabra) !== false) {
                $total = $total + 3;
            }

            if (strpos($descripcion, " " . $palabra) !== false) {
                $total = $total + 1;
            }
        }

        if ($total > 0) {
            $puntos[$categoria] = $total;
        }
    }

    arsort($puntos);
    $puntos = array_slice($puntos, 0, 3, true);

    $pesos = [];

    foreach ($puntos as $categoria => $total) {
        $pesos[$categoria] = $total / max($puntos);
    }

    return $pesos;
}

function afinidadCompararPuntajes($a, $b) {
    if ($a['puntaje'] == $b['puntaje']) {
        return 0;
    }

    if ($a['puntaje'] < $b['puntaje']) {
        return 1;
    }

    return -1;
}

function afinidadPuntuarClubes($clubes, $afinidad) {
    $promedio = array_sum($afinidad) / count($afinidad);
    $ranking = [];

    foreach ($clubes as $club) {
        $pesos = afinidadClasificarClub($club);

        if (count($pesos) > 0) {
            $suma = 0;
            $sumaPesos = 0;

            foreach ($pesos as $categoria => $peso) {
                $suma = $suma + $afinidad[$categoria] * $peso;
                $sumaPesos = $sumaPesos + $peso;
            }

            $puntaje = $suma / $sumaPesos;
        } else {
            $puntaje = $promedio * 0.85;
        }

        $ranking[] = [
            "id_club" => $club['id_club'],
            "Nombre" => $club['Nombre'],
            "Descripcion" => $club['Descripcion'],
            "Foto_url" => $club['Foto_url'],
            "puntaje" => round($puntaje, 2)
        ];
    }

    usort($ranking, 'afinidadCompararPuntajes');

    return $ranking;
}

function afinidadListaCategorias($afinidad) {
    $nombres = afinidadCategorias();
    $lista = [];

    foreach ($afinidad as $clave => $puntaje) {
        $lista[] = [
            "clave" => $clave,
            "nombre" => $nombres[$clave],
            "puntaje" => $puntaje
        ];
    }

    usort($lista, 'afinidadCompararPuntajes');

    return $lista;
}

function afinidadDemasiadosIntentos($conexion, $idUsuario) {
    $sql = "SELECT COUNT(*) AS total
            FROM testafinidad
            WHERE id_usuario = ?
            AND fecha >= (NOW() - INTERVAL 10 MINUTE)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $fila['total'] >= 3;
}

//Guarda resultdados pro
function afinidadGuardarTest($conexion, $idUsuario, $ranking) {
    $conexion->begin_transaction();

    try {
        $stmt = $conexion->prepare("INSERT INTO testafinidad (id_usuario) VALUES (?)");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $idTest = $conexion->insert_id;
        $stmt->close();

        $stmt = $conexion->prepare("INSERT INTO resultadotest (id_test, id_club, puntaje) VALUES (?, ?, ?)");

        foreach ($ranking as $club) {
            $idClub = $club['id_club'];
            $puntaje = $club['puntaje'];
            $stmt->bind_param("iid", $idTest, $idClub, $puntaje);
            $stmt->execute();
        }

        $stmt->close();
        $conexion->commit();

        return $idTest;
    } catch (Exception $e) {
        $conexion->rollback();
        throw $e;
    }
}

//Mario IA God
function afinidadConfigGemini() {
    $config = [
        'api_key' => getenv('GEMINI_API_KEY') ?: '',
        'model' => getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash'
    ];

    //config de la IA del proyecto
    $rutaLocal = __DIR__ . '/../config/gemini_local.php';

    if (file_exists($rutaLocal)) {
        $local = include $rutaLocal;

        if (is_array($local)) {
            if (!empty($local['api_key'])) {
                $config['api_key'] = $local['api_key'];
            }

            if (!empty($local['model'])) {
                $config['model'] = $local['model'];
            }
        }
    }

    return $config;
}

function afinidadPedirFeedbackIA($nombreEstudiante, $preguntas, $enviadas, $ranking, $categorias) {
    $gemini = afinidadConfigGemini();

    if (empty($gemini['api_key']) || !function_exists('curl_init')) {
        return null;
    }

    $respuestasTexto = "";

    foreach ($preguntas as $pregunta) {
        foreach ($pregunta['opciones'] as $opcion) {
            if ($opcion['id_opcion'] == $enviadas[$pregunta['id_pregunta']]) {
                $respuestasTexto = $respuestasTexto . "- " . $pregunta['texto'] . " -> " . $opcion['texto'] . "\n";
            }
        }
    }

    $clubesTexto = "";

    for ($i = 0; $i < 5 && $i < count($ranking); $i++) {
        $clubesTexto = $clubesTexto . "- " . $ranking[$i]['Nombre'] . " (" . $ranking[$i]['puntaje'] . "%): " . $ranking[$i]['Descripcion'] . "\n";
    }

    $areasTexto = $categorias[0]['nombre'] . ", " . $categorias[1]['nombre'] . ", " . $categorias[2]['nombre'];

    $prompt = "Eres Vivi, la asistente amable de Vestra (Via Estudiantil Salesiana), la red social de clubes de CEDES Don Bosco. "
        . "El estudiante " . strip_tags($nombreEstudiante) . " acaba de hacer el test de afinidad para saber a que club encaja mejor.\n\n"
        . "Sus respuestas:\n" . $respuestasTexto . "\n"
        . "Areas donde mas encaja: " . $areasTexto . "\n\n"
        . "Ranking calculado de clubes (afinidad de 0 a 100):\n" . $clubesTexto . "\n"
        . "Evalua sus respuestas y escribe su resultado. El club recomendado es " . $ranking[0]['Nombre'] . ". "
        . "Responde SOLO con un JSON con estas dos claves, en espanol, con tono cercano y positivo: "
        . "{\"resumen\": \"una frase corta (maximo 140 caracteres) que diga a que club encaja y por que\", "
        . "\"feedback\": \"2 a 3 oraciones con un feedback personalizado: que de sus respuestas lo acerca a ese club y que se encontrara ahi\"}";

    $datos = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.6,
            'responseMimeType' => 'application/json'
        ]
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($gemini['model']) . ':generateContent?key=' . urlencode($gemini['api_key']);

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($datos),
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 25
    ]);

    $respuestaCruda = curl_exec($curl);
    $codigoHttp = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($respuestaCruda === false || $codigoHttp < 200 || $codigoHttp >= 300) {
        return null;
    }

    $respuesta = json_decode($respuestaCruda, true);

    if (empty($respuesta['candidates'][0]['content']['parts'][0]['text'])) {
        return null;
    }

    $json = json_decode(trim($respuesta['candidates'][0]['content']['parts'][0]['text']), true);

    if (empty($json['resumen']) || empty($json['feedback'])) {
        return null;
    }

    return [
        'resumen' => trim(strip_tags($json['resumen'])),
        'feedback' => trim(strip_tags($json['feedback']))
    ];
}

//Texto en caso de que la IA no este funcando
function afinidadFeedbackLocal($ranking, $categorias) {
    $resumen = "Tu mejor afinidad es con " . $ranking[0]['Nombre'] . " (" . round($ranking[0]['puntaje']) . "%).";

    $feedback = "Tus respuestas destacan en: " . $categorias[0]['nombre'] . ", " . $categorias[1]['nombre']
        . ". Eso encaja muy bien con el club " . $ranking[0]['Nombre'] . ". Te animamos a conocerlo.";

    if (count($ranking) > 1 && $ranking[1]['puntaje'] >= 60) {
        $feedback = $feedback . " El club " . $ranking[1]['Nombre'] . " también podría gustarte (" . round($ranking[1]['puntaje']) . "%).";
    }

    return [
        'resumen' => $resumen,
        'feedback' => $feedback
    ];
}