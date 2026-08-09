<?php
session_start();


include '../config/conexion.php';

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

header("Content-Type: application/json");


$correo = $_POST['email'] ?? '';
$contra = $_POST['pass'] ?? '';

$consulta = mysqli_prepare($conexion,
"SELECT * FROM usuario WHERE Correo=?");

mysqli_stmt_bind_param($consulta, "s", $correo);
mysqli_stmt_execute($consulta);

$resultado = mysqli_stmt_get_result($consulta);

if(mysqli_num_rows($resultado) > 0){

    $usuario = mysqli_fetch_assoc($resultado);
    if($usuario['verificado'] == 0){

    echo json_encode([
        "success" => false,
        "mensaje" => "Debes verificar tu correo antes de iniciar sesión."
    ]);

    exit();

}

   $verificacion = password_verify($contra, $usuario['Contraseña']);

file_put_contents(
    __DIR__ . "/debug_login.txt",
    "Correo: [" . $correo . "]\n" .
    "Password recibida: [" . $contra . "]\n" .
    "Longitud: " . strlen($contra) . "\n" .
    "Hash longitud: " . strlen($usuario['Contraseña']) . "\n" .
    "Verify: " . ($verificacion ? "TRUE" : "FALSE") . "\n" .
    "-------------------------\n",
    FILE_APPEND
);

if($verificacion){
        $_SESSION['id_usuario'] = $usuario['id_usuario'];
        $_SESSION['usuario'] = $usuario['Nombre'];
        $_SESSION['tipo'] = $usuario['id_tipo_usuario'];

        echo json_encode([
    "success" => true,
    "mensaje" => "Login correcto",
    "id_usuario" => $usuario["id_usuario"],
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