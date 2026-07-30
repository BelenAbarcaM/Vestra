<?php

include '../config/conexion.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


$correo = $_POST['correo'] ?? '';

if(empty($correo)){

    echo json_encode([
        "success" => false,
        "mensaje" => "Debe ingresar un correo."
    ]);

    exit();

}


$buscar = mysqli_prepare(
    $conexion,
    "SELECT id_usuario, Nombre, verificado 
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


// Revisar si ya está verificado
if($usuario['verificado'] == 1){

    echo json_encode([
        "success" => false,
        "mensaje" => "Esta cuenta ya está verificada."
    ]);

    exit();

}


// Crear nuevo código
$codigo = rand(100000,999999);


// Actualizar código
$actualizar = mysqli_prepare(
    $conexion,
    "UPDATE usuario
     SET codigo_verificacion = ?
     WHERE id_usuario = ?"
);


mysqli_stmt_bind_param(
    $actualizar,
    "si",
    $codigo,
    $usuario['id_usuario']
);


mysqli_stmt_execute($actualizar);



// PHPMailer

require '../PHPMailer/src/Exception.php';
require '../PHPMailer/src/PHPMailer.php';
require '../PHPMailer/src/SMTP.php';


$mail = new PHPMailer(true);


try{

    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;

    $mail->Username = 'vestra.cedesdonbosco@gmail.com';
    $mail->Password = 'afegazzpvwchxqfq';

    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;


    $mail->setFrom(
        'vestra.cedesdonbosco@gmail.com',
        'Vestra'
    );


    $mail->addAddress(
        $correo,
        $usuario['Nombre']
    );


    $mail->isHTML(true);

    $mail->Subject = "Nuevo codigo de verificacion - Vestra";


    $mail->Body = "

<!DOCTYPE html>
<html>
<head>
<meta charset='UTF-8'>
</head>

<body style='margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, sans-serif;'>

<table width='100%' cellpadding='0' cellspacing='0'>
<tr>
<td align='center'>

<table width='600' style='background:white; margin-top:40px; border-radius:15px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);'>

<tr>
<td style='background:#3E5C76; padding:30px; text-align:center;'>

<h1 style='color:white; margin:0; font-size:32px;'>
VESTRA
</h1>

<p style='color:#dbe7f0; margin-top:10px;'>
Vía Estudiantil Salesiana
</p>

</td>
</tr>


<tr>
<td style='padding:35px; color:#333;'>

<h2 style='color:#3E5C76;'>
¡Hola {$usuario['Nombre']}! 👋
</h2>


<p style='font-size:16px; line-height:1.6;'>
Gracias por registrarte en <b>VESTRA</b>.
Para completar la creación de tu cuenta necesitamos verificar tu correo electrónico.
</p>


<p style='font-size:16px;'>
Tu código de verificación es:
</p>


<div style='background:#f3b562; 
            color:white; 
            font-size:32px; 
            font-weight:bold; 
            letter-spacing:8px;
            text-align:center;
            padding:20px;
            border-radius:12px;
            margin:25px 0;'>

$codigo

</div>


<p style='font-size:15px; color:#555;'>
Ingresa este código en la aplicación para activar tu cuenta.
</p>


<p style='font-size:14px; color:#888; margin-top:30px;'>
Si tú no realizaste este registro, puedes ignorar este correo.
</p>


</td>
</tr>


<tr>
<td style='background:#f5f7fb; padding:20px; text-align:center;'>

<p style='margin:0; font-size:13px; color:#777;'>
© VESTRA - Colegio Técnico Profesional Don Bosco
</p>

</td>
</tr>


</table>

</td>
</tr>
</table>

</body>
</html>

";


    $mail->send();



    echo json_encode([
        "success" => true,
        "mensaje" => "Código enviado correctamente."
    ]);



}catch(Exception $e){

    echo json_encode([
        "success" => false,
        "mensaje" => "Error enviando correo."
    ]);

}

?>