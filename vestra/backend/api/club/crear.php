<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

include '../../config/conexion.php';


$conexion->begin_transaction();


try {


    $nombre = $_POST['nombre'];
    $descripcion = $_POST['descripcion'];
    $idProfe = $_SESSION['id_usuario'];

    if(isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0){

        $imagen = $_FILES['imagen'];

        $nombreImagen = uniqid() . "_" . basename($imagen['name']);

        $rutaDestino = "../../../uploads/club/" . $nombreImagen;

        move_uploaded_file(
            $imagen['tmp_name'],
            $rutaDestino
        );

    } else {

        $nombreImagen = null;

    }

    if(empty($nombre) || empty($descripcion)){
        throw new Exception("El nombre y descripción son obligatorios.");
    }


    $sqlClub = "INSERT INTO club
    (Nombre, Descripcion, Foto_url, id_profesor)
    VALUES (?, ?, ?, ?)";


    $stmtClub = $conexion->prepare($sqlClub);


    $stmtClub->bind_param(
        "sssi",
        $nombre,
        $descripcion,
        $nombreImagen,
        $idProfe
    );


    $stmtClub->execute();



    // ID DEL CLUB NUEVO
    $idClub = $conexion->insert_id;


//horario :V
    if (isset($_POST['horarios'])) {

    $horarios = json_decode($_POST['horarios'], true);

    if (is_array($horarios)) {

        $sqlHorario = "INSERT INTO horario_club
        (id_club, dia, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?)";

        $stmtHorario = $conexion->prepare($sqlHorario);

        foreach ($horarios as $horario) {

            $dia = $horario['dia'] ?? '';
            $inicio = $horario['hora_inicio'] ?? '';
            $fin = $horario['hora_fin'] ?? '';

            if ($dia === '' || $inicio === '' || $fin === '') {
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



//cuota
    if (isset($_POST['cuotas'])) {

    $cuotas = json_decode($_POST['cuotas'], true);

    if (is_array($cuotas)) {

        $sqlCuota = "INSERT INTO cuota_club
        (id_club, curso, valor)
        VALUES (?, ?, ?)";

        $stmtCuota = $conexion->prepare($sqlCuota);

        foreach ($cuotas as $cuota) {

            $curso = $cuota['curso'] ?? '';
            $valor = floatval($cuota['valor'] ?? 0);

            if ($curso === '') {
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


//requisitos
    if (isset($_POST['requisitos'])) {

    $requisitos = json_decode($_POST['requisitos'], true);

    if (is_array($requisitos)) {

        $sqlRequisito = "INSERT INTO requisito_club
        (id_club, requisito)
        VALUES (?, ?)";

        $stmtReq = $conexion->prepare($sqlRequisito);

        foreach ($requisitos as $req) {

            $req = trim($req);

            if ($req === '') {
                continue;
            }

            $stmtReq->bind_param(
                "is",
                $idClub,
                $req
            );

            $stmtReq->execute();
        }
    }
}




    // guardar
    $conexion->commit();


    echo "Club creado correctamente";



} catch(Exception $e){


    $conexion->rollback();


    echo "Error al crear club: " . $e->getMessage();


}


?>