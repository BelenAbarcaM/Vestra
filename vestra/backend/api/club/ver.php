<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();

// Verificar que venga el ID
if (!isset($_GET["id"]) || !is_numeric($_GET["id"])) {
    echo json_encode([
        "error" => "ID del club no válido"
    ]);
    exit;
}

$id_club = intval($_GET["id"]);


/*Info del club*/

$sql = "SELECT
    club.id_club,
    club.Nombre,
    club.Descripcion,
    club.Foto_url,
    club.id_profesor,
    usuario.Nombre AS profesor
FROM club
INNER JOIN usuario
    ON club.id_profesor = usuario.id_usuario
WHERE club.id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$resultado = $stmt->get_result();
$club = $resultado->fetch_assoc();


// Si no existe el club
if (!$club) {
    echo json_encode([
        "error" => "Club no encontrado"
    ]);
    exit;
}

$club["puede_editar"] = false;

if (isset($_SESSION["id_usuario"])) {
    $idSesion = (int) $_SESSION["id_usuario"];

    $sqlPermiso = "
        SELECT id_tipo_usuario
        FROM usuario
        WHERE id_usuario = ?
    ";

    $stmtPermiso = $conexion->prepare($sqlPermiso);
    $stmtPermiso->bind_param("i", $idSesion);
    $stmtPermiso->execute();

    $usuarioActual = $stmtPermiso->get_result()->fetch_assoc();

    $club["puede_editar"] =
        $usuarioActual !== null &&
        (int) $usuarioActual["id_tipo_usuario"] === 2 &&
        $idSesion === (int) $club["id_profesor"];
}

/*horario*/

$sqlHorarios = "SELECT
                    dia,
                    hora_inicio,
                    hora_fin
                FROM horario_club
                WHERE id_club = ?";

$stmtHorarios = $conexion->prepare($sqlHorarios);
$stmtHorarios->bind_param("i", $id_club);
$stmtHorarios->execute();

$resultadoHorarios = $stmtHorarios->get_result();

$horarios = [];

while ($fila = $resultadoHorarios->fetch_assoc()) {
    $horarios[] = $fila;
}


/*cuotas*/

$sqlCuotas = "SELECT
                  curso,
                  valor
              FROM cuota_club
              WHERE id_club = ?";

$stmtCuotas = $conexion->prepare($sqlCuotas);
$stmtCuotas->bind_param("i", $id_club);
$stmtCuotas->execute();

$resultadoCuotas = $stmtCuotas->get_result();

$cuotas = [];

while ($fila = $resultadoCuotas->fetch_assoc()) {
    $cuotas[] = $fila;
}


/*requisitos*/

$sqlRequisitos = "SELECT
                      requisito
                  FROM requisito_club
                  WHERE id_club = ?";

$stmtRequisitos = $conexion->prepare($sqlRequisitos);
$stmtRequisitos->bind_param("i", $id_club);
$stmtRequisitos->execute();

$resultadoRequisitos = $stmtRequisitos->get_result();

$requisitos = [];

while ($fila = $resultadoRequisitos->fetch_assoc()) {
    $requisitos[] = $fila;
}


/*juntar todo*/

$club["horarios"] = $horarios;
$club["cuotas"] = $cuotas;
$club["requisitos"] = $requisitos;


// Devolver información completa
echo json_encode($club);

?>