<?php
session_start();

require_once "../../config/conexion.php";
require_once "../../models/Usuario.php";


if(!isset($_SESSION['id_usuario'])){
    echo json_encode([
        "success" => false,
        "message" => "Debe iniciar sesión."
    ]);
    exit();
}


$id_usuario = $_SESSION['id_usuario'];

$nombre = $_POST['nombre'] ?? "";
$clubes = $_POST['clubes'] ?? [];

$nombre = htmlspecialchars(trim($nombre));


if(strlen($nombre) < 3){
    echo json_encode([
        "success" => false,
        "message" => "El nombre es demasiado corto."
    ]);
    exit();
}


if(empty($clubes)){
    echo json_encode([
        "success" => false,
        "message" => "Debe seleccionar al menos un club."
    ]);
    exit();
}


$foto = $_POST['foto_actual'] ?? "default.png";



if(isset($_FILES['foto']) && $_FILES['foto']['error'] == 0){


    if($_FILES['foto']['size'] > 5 * 1024 * 1024){

        echo json_encode([
            "success" => false,
            "message" => "La imagen supera los 5MB."
        ]);

        exit();
    }



    $tipo = mime_content_type($_FILES['foto']['tmp_name']);


    $permitidas = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];



    if(in_array($tipo, $permitidas)){


        $extension = strtolower(
            pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION)
        );


        $nuevoNombre = uniqid() . "." . $extension;


        $ruta = "../../uploads/perfiles/";



        if(!is_dir($ruta)){
            mkdir($ruta,0755,true);
        }



        if(move_uploaded_file(
            $_FILES['foto']['tmp_name'],
            $ruta . $nuevoNombre
        )){

            $foto = $nuevoNombre;

        }

    }else{

        echo json_encode([
            "success" => false,
            "message" => "Formato de imagen no permitido."
        ]);

        exit();

    }

}



if(actualizarPerfil(
    $conexion,
    $id_usuario,
    $nombre,
    $foto,
    $clubes
)){

    echo json_encode([
        "success" => true,
        "message" => "Perfil actualizado correctamente."
    ]);


}else{


    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar el perfil."
    ]);

}

?>