<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

header("Content-Type: application/json");

require_once "../../config/conexion.php";
require_once "../../models/Usuario.php";


$id_usuario = $_POST['id_usuario'] ?? null;

if(!$id_usuario){
    echo json_encode([
        "success" => false,
        "message" => "Falta el id del usuario."
    ]);
    exit();
}

$id_usuario = intval($id_usuario);


$id_usuario = $_SESSION['id_usuario'];

$nombre = $_POST['nombre'] ?? "";
$bio = $_POST['bio'] ?? "";

$nombre = htmlspecialchars(trim($nombre));
$bio = htmlspecialchars(trim($bio));


if(strlen($nombre) < 3){
    echo json_encode([
        "success" => false,
        "message" => "El nombre es demasiado corto."
    ]);
    exit();
}


$foto = $_POST['foto_actual'] ?? "default.png";


if(isset($_FILES['foto']) && $_FILES['foto']['error'] === 0){

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


    if(!in_array($tipo, $permitidas)){
        echo json_encode([
            "success" => false,
            "message" => "Formato de imagen no permitido."
        ]);
        exit();
    }


    $extension = strtolower(
        pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION)
    );


    $nuevoNombre = uniqid() . "." . $extension;


    $ruta = "../../uploads/perfiles/";


    if(!is_dir($ruta)){
        mkdir($ruta, 0755, true);
    }


    if(move_uploaded_file(
        $_FILES['foto']['tmp_name'],
        $ruta . $nuevoNombre
    )){
        $foto = $nuevoNombre;
    }
}


if(actualizarPerfil(
    $conexion,
    $id_usuario,
    $nombre,
    $bio,
    $foto
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