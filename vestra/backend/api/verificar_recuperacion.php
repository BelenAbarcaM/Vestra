<?php
session_start();

include '../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");


$correo = $_SESSION['correo_recuperacion'] ?? '';
$codigo = $_POST['codigo'] ?? '';


if(empty($correo) || empty($codigo)){

    echo json_encode([
        "success" => false,
        "mensaje" => "Faltan datos."
    ]);

    exit();

}


// Buscar al brosito
$buscar = mysqli_prepare(
    $conexion,
    "SELECT id_usuario, codigo_recuperacion, recuperacion_expira
     FROM usuario
     WHERE Correo = ?"
);


mysqli_stmt_bind_param(
    $buscar,
    "s",
    $correo
);


mysqli_stmt_execute($buscar);


$resultado = mysqli_stmt_get_result($buscar);



if(mysqli_num_rows($resultado) == 0){

    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no encontrado."
    ]);

    exit();

}


$usuario = mysqli_fetch_assoc($resultado);



// Revisar código

if($usuario['codigo_recuperacion'] != $codigo){

    echo json_encode([
        "success" => false,
        "mensaje" => "Código incorrecto."
    ]);

    exit();

}



// Revisar expiración

if(strtotime($usuario['recuperacion_expira']) < time()){


    echo json_encode([
        "success" => false,
        "mensaje" => "El código expiró."
    ]);

    exit();

}



// Código correcto
$actualizar = mysqli_prepare(
    $conexion,
    "UPDATE usuario
     SET codigo_recuperacion = NULL,
         recuperacion_expira = NULL
     WHERE id_usuario = ?"
);

mysqli_stmt_bind_param(
    $actualizar,
    "i",
    $usuario['id_usuario']
);

mysqli_stmt_execute($actualizar);
$_SESSION['recuperacion_verificada'] = true;
$_SESSION['id_usuario_recuperacion'] = $usuario['id_usuario'];
echo json_encode([
    "success" => true,
    "mensaje" => "Código válido.",
    "id_usuario" => $usuario['id_usuario']
]);


?>