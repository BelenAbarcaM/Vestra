<?php

require_once "../../models/Afinidad.php";

$idUsuario = afinidadInicioApi("POST");

try {
    require_once "../../config/conexion.php";

    $datos = json_decode(file_get_contents("php://input"), true);

    if (!is_array($datos) || !isset($datos['respuestas'])) {
        afinidadResponder(["success" => false, "mensaje" => "No se recibieron respuestas."], 400);
    }

    $preguntas = afinidadPreguntas(true);
    $error = afinidadRevisarRespuestas($preguntas, $datos['respuestas']);

    if ($error != "") {
        afinidadResponder(["success" => false, "mensaje" => $error], 422);
    }

    $clubes = afinidadCargarClubes($conexion);

    if (count($clubes) == 0) {
        afinidadResponder(["success" => false, "mensaje" => "Todavía no hay clubes registrados."], 409);
    }

    if (afinidadDemasiadosIntentos($conexion, $idUsuario)) {
        afinidadResponder(["success" => false, "mensaje" => "Has hecho el test varias veces seguidas. Espera unos minutos."], 429);
    }

    $afinidad = afinidadCalcularCategorias($preguntas, $datos['respuestas']);
    $categorias = afinidadListaCategorias($afinidad);
    $ranking = afinidadPuntuarClubes($clubes, $afinidad);

   //gUardar
    $idTest = afinidadGuardarTest($conexion, $idUsuario, $ranking);

    // IA
    $texto = afinidadPedirFeedbackIA($_SESSION['usuario'], $preguntas, $datos['respuestas'], $ranking, $categorias);
    $fuente = "ia";

    if ($texto == null) {
        $texto = afinidadFeedbackLocal($ranking, $categorias);
        $fuente = "local";
    }

    afinidadResponder([
        "success" => true,
        "id_test" => $idTest,
        "mejor" => $ranking[0],
        "ranking" => $ranking,
        "categorias" => $categorias,
        "resumen" => $texto['resumen'],
        "feedback" => $texto['feedback'],
        "fuente" => $fuente
    ]);
} catch (Exception $e) {
    afinidadResponder(["success" => false, "mensaje" => "No se pudo procesar el test."], 500);
}
