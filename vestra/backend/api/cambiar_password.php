<?php
session_start();


include '../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");


$correo = $_SESSION['correo_recuperacion'] ?? '';
$nueva_password = $_POST['password'] ?? '';



if(empty($correo) || empty($nueva_password)){

    echo json_encode([
        "success" => false,
        "mensaje" => "Faltan datos."
    ]);

    exit();

}




$buscar = mysqli_prepare(
    $conexion,
    "SELECT id_usuario 
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




$password_hash = password_hash(
    $nueva_password,
    PASSWORD_DEFAULT
);



$actualizar = mysqli_prepare(
    $conexion,
    "UPDATE usuario
     SET Contraseña = ?,
         codigo_recuperacion = NULL,
         recuperacion_expira = NULL
     WHERE id_usuario = ?"
);


mysqli_stmt_bind_param(
    $actualizar,
    "si",
    $password_hash,
    $usuario['id_usuario']
);



if(mysqli_stmt_execute($actualizar)){
    unset($_SESSION['correo_recuperacion']);


    echo json_encode([
        "success" => true,
        "mensaje" => "Contraseña actualizada correctamente."
    ]);


}else{


    echo json_encode([
        "success" => false,
        "mensaje" => "Error al actualizar contraseña."
    ]);


}


?>