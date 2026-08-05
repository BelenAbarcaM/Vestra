<?php
session_start();

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
    "SELECT id_usuario, Nombre 
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
        "mensaje" => "No existe una cuenta con ese correo."
    ]);

    exit();

}



$usuario = mysqli_fetch_assoc($resultado);


$codigo = rand(100000,999999);


// Fecha q se vence
$expira = date(
    "Y-m-d H:i:s",
    strtotime("+15 minutes")
);



$actualizar = mysqli_prepare(
    $conexion,
    "UPDATE usuario
     SET codigo_recuperacion = ?,
         recuperacion_expira = ?
     WHERE id_usuario = ?"
);


mysqli_stmt_bind_param(
    $actualizar,
    "ssi",
    $codigo,
    $expira,
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

    $mail->Subject = "Recuperacion de contraseña - Vestra";


    $mail->Body = "

<!DOCTYPE html>
<html>
<head>
<meta charset='UTF-8'>
</head>

<body style='margin:0; padding:0; background:#f5f7fb; font-family:Arial, sans-serif;'>

<table width='100%' cellpadding='0' cellspacing='0'>
<tr>
<td align='center'>


<table width='600' style='background:white; margin-top:40px; border-radius:18px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.08);'>


<!-- Encabezado -->

<tr>
<td style='background:#3E5C76; padding:35px; text-align:center;'>

<h1 style='margin:0; color:white; font-size:34px;'>
VESTRA
</h1>

<p style='margin:10px 0 0; color:#d8e5ef; font-size:15px;'>
Vía Estudiantil Salesiana
</p>

</td>
</tr>



<!-- Contenido -->

<tr>
<td style='padding:40px; color:#333;'>


<h2 style='color:#3E5C76; margin-top:0;'>
Hola {$usuario['Nombre']} 
</h2>


<p style='font-size:16px; line-height:1.6;'>
Recibimos una solicitud para restablecer la contraseña de tu cuenta en <b>VESTRA</b>.
</p>


<p style='font-size:16px; line-height:1.6;'>
Si realizaste esta solicitud, utiliza el siguiente código para continuar:
</p>



<div style='background:#f3b562;
            border-radius:14px;
            padding:25px;
            text-align:center;
            margin:30px 0;'>


<p style='margin:0 0 12px; color:white; font-size:14px;'>
CÓDIGO DE RECUPERACIÓN
</p>


<h1 style='margin:0;
           color:white;
           font-size:38px;
           letter-spacing:10px;'>
$codigo
</h1>


</div>



<div style='background:#f5f7fb;
            border-radius:12px;
            padding:18px;
            margin-top:25px;'>


<p style='margin:0; color:#666; font-size:14px; line-height:1.5;'>

⏱ Este código estará disponible durante <b>15 minutos</b>.

<br><br>

Si tú no solicitaste cambiar tu contraseña, puedes ignorar este correo. Tu cuenta seguirá protegida.

</p>


</div>



</td>
</tr>



<!-- Footer -->

<tr>
<td style='background:#f5f7fb; padding:25px; text-align:center;'>


<p style='margin:0; color:#777; font-size:13px;'>
VESTRA · Colegio Técnico Profesional Don Bosco
</p>


<p style='margin:8px 0 0; color:#999; font-size:12px;'>
Conectando estudiantes, clubes y comunidad 
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

    $_SESSION['correo_recuperacion'] = $correo;


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