<?php

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
    if(isset($_POST['horarios'])){


        $sqlHorario = "INSERT INTO horario_club
        (id_club, dia, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?)";


        $stmtHorario = $conexion->prepare($sqlHorario);



        foreach($_POST['horarios'] as $horario){


            $dia = $horario['dia'];
            $inicio = $horario['hora_inicio'];
            $fin = $horario['hora_fin'];


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



//cuota
    if(isset($_POST['cuotas'])){


        $sqlCuota = "INSERT INTO cuota_club
        (id_club, curso, valor)
        VALUES (?, ?, ?)";


        $stmtCuota = $conexion->prepare($sqlCuota);



        foreach($_POST['cuotas'] as $cuota){


            $curso = $cuota['curso'];
            $valor = $cuota['valor'];


            $stmtCuota->bind_param(
                "isd",
                $idClub,
                $curso,
                $valor
            );


            $stmtCuota->execute();

        }

    }


//requisitos
    if(isset($_POST['requisitos'])){


        $sqlRequisito = "INSERT INTO requisito_club
        (id_club, requisito)
        VALUES (?, ?)";


        $stmtReq = $conexion->prepare($sqlRequisito);



        foreach($_POST['requisitos'] as $req){


            $stmtReq->bind_param(
                "is",
                $idClub,
                $req
            );


            $stmtReq->execute();

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