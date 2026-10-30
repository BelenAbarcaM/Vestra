<?php


require_once __DIR__ . '/../../config/cors.php';
require_once "../../models/Afinidad.php";

afinidadInicioApi("GET");

afinidadResponder([
    "success" => true,
    "preguntas" => afinidadPreguntas(false)
]);