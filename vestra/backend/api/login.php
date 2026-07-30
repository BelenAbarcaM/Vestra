<?php
include '../config/conexion.php';

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

header("Content-Type: application/json");

session_start();

$correo = $_POST['email'] ?? '';
$contra = $_POST['pass'] ?? '';

$consulta = mysqli_prepare($conexion,
"SELECT * FROM usuario WHERE Correo=?");

mysqli_stmt_bind_param($consulta, "s", $correo);
mysqli_stmt_execute($consulta);

$resultado = mysqli_stmt_get_result($consulta);

if(mysqli_num_rows($resultado) > 0){

    $usuario = mysqli_fetch_assoc($resultado);

    if(password_verify($contra, $usuario['Contraseña'])){

        $_SESSION['id_usuario'] = $usuario['id_usuario'];
        $_SESSION['usuario'] = $usuario['Nombre'];
        $_SESSION['tipo'] = $usuario['id_tipo_usuario'];

        echo json_encode([
            "success" => true,
            "mensaje" => "Login correcto",
            "usuario" => $usuario["Nombre"],
            "tipo" => $usuario["id_tipo_usuario"]
        ]);

    }else{

        echo json_encode([
            "success" => false,
            "mensaje" => "Contraseña incorrecta"
        ]);

    }

}else{

    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no encontrado"
    ]);

}
