<?php

require_once "../../models/Afinidad.php";

afinidadInicioApi("GET");

afinidadResponder([
    "success" => true,
    "preguntas" => afinidadPreguntas(false)
]);