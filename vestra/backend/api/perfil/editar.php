<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../../config/conexion.php";
require_once "../../models/Usuario.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
    exit;
}

if (!isset($_POST["id_usuario"])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id del usuario."
    ]);
    exit;
}

$id_usuario = intval($_POST["id_usuario"]);

$nombre = isset($_POST["nombre"])
    ? trim($_POST["nombre"])
    : "";

$bio = isset($_POST["bio"])
    ? trim($_POST["bio"])
    : "";

if ($nombre === "") {
    echo json_encode([
        "success" => false,
        "mensaje" => "El nombre no puede estar vacío."
    ]);
    exit;
}



$foto = null;



if (isset($_FILES["foto"]) && $_FILES["foto"]["error"] === UPLOAD_ERR_OK) {

    $archivo = $_FILES["foto"];

    $extension = strtolower(
        pathinfo($archivo["name"], PATHINFO_EXTENSION)
    );

    $extensionesPermitidas = [
        "jpg",
        "jpeg",
        "png",
        "webp"
    ];

    if (!in_array($extension, $extensionesPermitidas)) {

        echo json_encode([
            "success" => false,
            "mensaje" => "Formato de imagen no permitido."
        ]);

        exit;
    }


    $nombreFoto =
        uniqid("perfil_", true)
        . "."
        . $extension;


    $carpeta =
        "../../../uploads/perfiles/";


    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0777, true);
    }


    $rutaFoto =
        $carpeta
        . $nombreFoto;


    if (!move_uploaded_file(
        $archivo["tmp_name"],
        $rutaFoto
    )) {

        echo json_encode([
            "success" => false,
            "mensaje" => "No se pudo guardar la imagen."
        ]);

        exit;
    }


    $foto = $nombreFoto;

} else {


    $perfilActual =
        obtenerPerfil(
            $conexion,
            $id_usuario
        );

    if ($perfilActual === false) {

        echo json_encode([
            "success" => false,
            "mensaje" => "Usuario no encontrado."
        ]);

        exit;
    }

    $foto = $perfilActual["Foto_url"];
}


$resultado = actualizarPerfil(
    $conexion,
    $id_usuario,
    $nombre,
    $bio,
    $foto
);


if ($resultado === false) {

    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudo actualizar el perfil."
    ]);

    exit;
}

echo json_encode([
    "success" => true,
    "mensaje" => "Perfil actualizado correctamente.",
    "foto" => $foto
]);