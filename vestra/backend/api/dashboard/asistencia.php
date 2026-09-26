<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

session_start();

require_once "../../config/conexion.php";


// verificar sesion
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);


// recibir el id del evento
$id_evento = isset($_GET["id_evento"])
    ? intval($_GET["id_evento"])
    : 0;

if ($id_evento <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "ID de evento inválido"
    ]);
    exit;
}


//obtener evento
$sqlEvento = "
    SELECT
        e.id_evento,
        e.id_club,
        e.titulo,
        e.descripcion,
        e.fecha,
        e.hora_inicio,
        e.hora_fin,
        e.tipo,
        c.Nombre AS nombre_club

    FROM evento_club e

    INNER JOIN club c
        ON e.id_club = c.id_club

    WHERE e.id_evento = ?
    AND c.id_profesor = ?
";

$stmtEvento = $conexion->prepare($sqlEvento);

$stmtEvento->bind_param(
    "ii",
    $id_evento,
    $id_profesor
);

$stmtEvento->execute();

$resultadoEvento = $stmtEvento->get_result();

$evento = $resultadoEvento->fetch_assoc();

if (!$evento) {
    echo json_encode([
        "success" => false,
        "error" => "Evento no encontrado o no tienes permiso para verlo"
    ]);
    exit;
}


// obtener los miembros
$sqlMiembros = "
    SELECT
        u.id_usuario,
        u.Nombre,
        u.Correo,
        u.Foto_url,
        u.Bio,
        i.fecha_ingreso,
        i.anio_ingreso,

        a.id_asistencia,
        a.estado AS estado_asistencia

    FROM inscripcion i

    INNER JOIN usuario u
        ON i.id_usuario = u.id_usuario

    LEFT JOIN asistencia a
        ON a.id_usuario = i.id_usuario
        AND a.id_evento = ?

    WHERE i.id_club = ?

    ORDER BY u.Nombre ASC
";

$stmtMiembros = $conexion->prepare($sqlMiembros);

$stmtMiembros->bind_param(
    "ii",
    $id_evento,
    $evento["id_club"]
);

$stmtMiembros->execute();

$resultadoMiembros = $stmtMiembros->get_result();

$miembros = [];


//armar lista de los miembros
while ($fila = $resultadoMiembros->fetch_assoc()) {

    $estado = $fila["estado_asistencia"];

    if ($estado === null) {
        $estado = "Sin registrar";
    }

    $miembros[] = [
        "id_usuario" => intval($fila["id_usuario"]),
        "Nombre" => $fila["Nombre"],
        "Correo" => $fila["Correo"],
        "Foto_url" => $fila["Foto_url"],
        "Bio" => $fila["Bio"],
        "fecha_ingreso" => $fila["fecha_ingreso"],
        "anio_ingreso" => intval($fila["anio_ingreso"]),
        "id_asistencia" => $fila["id_asistencia"]
            ? intval($fila["id_asistencia"])
            : null,
        "estado" => $estado
    ];
}


// contadores
$total = count($miembros);

$presentes = 0;
$ausentes = 0;
$justificados = 0;
$sinRegistrar = 0;

foreach ($miembros as $miembro) {

    switch ($miembro["estado"]) {

        case "Presente":
            $presentes++;
            break;

        case "Ausente":
            $ausentes++;
            break;

        case "Justificado":
            $justificados++;
            break;

        case "Sin registrar":
            $sinRegistrar++;
            break;
    }
}


// respuesta
echo json_encode([
    "success" => true,

    "evento" => [
        "id_evento" => intval($evento["id_evento"]),
        "id_club" => intval($evento["id_club"]),
        "titulo" => $evento["titulo"],
        "descripcion" => $evento["descripcion"],
        "fecha" => $evento["fecha"],
        "hora_inicio" => $evento["hora_inicio"],
        "hora_fin" => $evento["hora_fin"],
        "tipo" => $evento["tipo"],
        "nombre_club" => $evento["nombre_club"]
    ],

    "resumen" => [
        "total_miembros" => $total,
        "presentes" => $presentes,
        "ausentes" => $ausentes,
        "justificados" => $justificados,
        "sin_registrar" => $sinRegistrar
    ],

    "miembros" => $miembros
]);

?>