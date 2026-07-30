<?php

include '../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");


$correo = $_POST['correo'] ?? '';
$codigo = $_POST['codigo'] ?? '';


if(empty($correo) || empty($codigo)){
    echo json_encode([
        "success" => false,
        "mensaje" => "Faltan datos."
    ]);
    exit;
}


// Buscar usuario
$sql = "SELECT id_usuario, codigo_verificacion 
        FROM usuario 
        WHERE Correo = ?";

$stmt = mysqli_prepare($conexion, $sql);

mysqli_stmt_bind_param(
    $stmt,
    "s",
    $correo
);

mysqli_stmt_execute($stmt);

$resultado = mysqli_stmt_get_result($stmt);


if(mysqli_num_rows($resultado) == 0){

    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no encontrado."
    ]);

    exit;
}


$usuario = mysqli_fetch_assoc($resultado);


// Comparar códigos
if($usuario['codigo_verificacion'] == $codigo){


    $actualizar = mysqli_prepare(
        $conexion,
        "UPDATE usuario 
         SET verificado = 1,
             codigo_verificacion = NULL
         WHERE id_usuario = ?"
    );


    mysqli_stmt_bind_param(
        $actualizar,
        "i",
        $usuario['id_usuario']
    );


    mysqli_stmt_execute($actualizar);


    echo json_encode([
        "success" => true,
        "mensaje" => "Cuenta verificada correctamente."
    ]);


}else{


    echo json_encode([
        "success" => false,
        "mensaje" => "Código incorrecto."
    ]);

}

?>