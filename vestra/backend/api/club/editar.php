<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no autenticado."
    ]);
    exit;
}

$idProfesor = intval($_SESSION["id_usuario"]);

$idClub = intval($_POST["id_club"] ?? 0);
$nombre = trim($_POST["nombre"] ?? "");
$descripcion = trim($_POST["descripcion"] ?? "");

if ($idClub <= 0 || empty($nombre) || empty($descripcion)) {
    echo json_encode([
        "success" => false,
        "mensaje" => "El nombre y la descripción son obligatorios."
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Verificar que el club pertenece al profesor
|--------------------------------------------------------------------------
*/

$sqlVerificar = "
    SELECT id_club, Foto_url
    FROM club
    WHERE id_club = ?
    AND id_profesor = ?
";

$stmtVerificar = $conexion->prepare($sqlVerificar);
$stmtVerificar->bind_param("ii", $idClub, $idProfesor);
$stmtVerificar->execute();

$resultado = $stmtVerificar->get_result();
$club = $resultado->fetch_assoc();

if (!$club) {
    echo json_encode([
        "success" => false,
        "mensaje" => "No tienes permiso para editar este club."
    ]);
    exit;
}

$nombreImagen = $club["Foto_url"];

/*
|--------------------------------------------------------------------------
| Imagen
|--------------------------------------------------------------------------
*/

if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === 0) {

    $imagen = $_FILES["imagen"];

    $nombreImagen = uniqid() . "_" . basename($imagen["name"]);

    $rutaDestino = "../../../uploads/club/" . $nombreImagen;

    if (!move_uploaded_file($imagen["tmp_name"], $rutaDestino)) {

        echo json_encode([
            "success" => false,
            "mensaje" => "No se pudo guardar la imagen."
        ]);

        exit;
    }
}

/*
|--------------------------------------------------------------------------
| Actualizar club
|--------------------------------------------------------------------------
*/

$sqlActualizar = "
    UPDATE club
    SET Nombre = ?,
        Descripcion = ?,
        Foto_url = ?
    WHERE id_club = ?
    AND id_profesor = ?
";

$stmtActualizar = $conexion->prepare($sqlActualizar);

$stmtActualizar->bind_param(
    "sssii",
    $nombre,
    $descripcion,
    $nombreImagen,
    $idClub,
    $idProfesor
);

if (!$stmtActualizar->execute()) {

    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudo actualizar el club."
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Horarios
|--------------------------------------------------------------------------
*/

if (isset($_POST["horarios"])) {

    $horarios = json_decode($_POST["horarios"], true);

    if (is_array($horarios)) {

        $sqlEliminar = "DELETE FROM horario_club WHERE id_club = ?";
        $stmtEliminar = $conexion->prepare($sqlEliminar);
        $stmtEliminar->bind_param("i", $idClub);
        $stmtEliminar->execute();

        $sqlHorario = "
            INSERT INTO horario_club
            (id_club, dia, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?)
        ";

        $stmtHorario = $conexion->prepare($sqlHorario);

        foreach ($horarios as $horario) {

            $dia = $horario["dia"] ?? "";
            $inicio = $horario["hora_inicio"] ?? "";
            $fin = $horario["hora_fin"] ?? "";

            if ($dia === "" || $inicio === "" || $fin === "") {
                continue;
            }

            $stmtHorario->bind_param(
                "isss",
                $idClub,
                $dia,
                $inicio,
                $fin
            );

            $stmtHorario->execute();
        }
    }
}

/*
|--------------------------------------------------------------------------
| Cuotas
|--------------------------------------------------------------------------
*/

if (isset($_POST["cuotas"])) {

    $cuotas = json_decode($_POST["cuotas"], true);

    if (is_array($cuotas)) {

        $sqlEliminar = "DELETE FROM cuota_club WHERE id_club = ?";
        $stmtEliminar = $conexion->prepare($sqlEliminar);
        $stmtEliminar->bind_param("i", $idClub);
        $stmtEliminar->execute();

        $sqlCuota = "
            INSERT INTO cuota_club
            (id_club, curso, valor)
            VALUES (?, ?, ?)
        ";

        $stmtCuota = $conexion->prepare($sqlCuota);

        foreach ($cuotas as $cuota) {

            $curso = $cuota["curso"] ?? "";
            $valor = floatval($cuota["valor"] ?? 0);

            if ($curso === "") {
                continue;
            }

            $stmtCuota->bind_param(
                "isd",
                $idClub,
                $curso,
                $valor
            );

            $stmtCuota->execute();
        }
    }
}

/*
|--------------------------------------------------------------------------
| Requisitos
|--------------------------------------------------------------------------
*/

if (isset($_POST["requisitos"])) {

    $requisitos = json_decode($_POST["requisitos"], true);

    if (is_array($requisitos)) {

        $sqlEliminar = "DELETE FROM requisito_club WHERE id_club = ?";
        $stmtEliminar = $conexion->prepare($sqlEliminar);
        $stmtEliminar->bind_param("i", $idClub);
        $stmtEliminar->execute();

        $sqlRequisito = "
            INSERT INTO requisito_club
            (id_club, requisito)
            VALUES (?, ?)
        ";

        $stmtReq = $conexion->prepare($sqlRequisito);

        foreach ($requisitos as $requisito) {

            $requisito = trim($requisito);

            if ($requisito === "") {
                continue;
            }

            $stmtReq->bind_param(
                "is",
                $idClub,
                $requisito
            );

            $stmtReq->execute();
        }
    }
}

echo json_encode([
    "success" => true,
    "mensaje" => "Club actualizado correctamente."
]);
?>