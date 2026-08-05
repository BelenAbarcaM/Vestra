<?php
session_start();


include '../config/conexion.php';
include '../models/Usuario.php';


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");


$nombre = $_POST['name'] ?? '';
$correo = $_POST['email'] ?? '';
$contra = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);
$foto = "default.png";
$codigo = rand(100000,999999);
if (str_ends_with($correo, "@est.cedesdonbosco.ed.cr")) {

    $tipo_usuario = 1;

} elseif (str_ends_with($correo, "@cedesdonbosco.ed.cr")) {

    $tipo_usuario = 2;

} else {

    $tipo_usuario = 3;

}


$resultado = registrarUsuario(
    $conexion,
    $nombre,
    $correo,
    $contra,
    $foto,
    $tipo_usuario,
    $codigo
);


if ($resultado) {

    require '../PHPMailer/src/Exception.php';
    require '../PHPMailer/src/PHPMailer.php';
    require '../PHPMailer/src/SMTP.php';

    $mail = new PHPMailer(true);

    try {

        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;

        $mail->Username = 'vestra.cedesdonbosco@gmail.com';
        $mail->Password = 'afegazzpvwchxqfq';

        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('vestra.cedesdonbosco@gmail.com', 'Vestra');
        $mail->addAddress($correo, $nombre);

        $mail->isHTML(true);
        $mail->Subject = 'Código de verificación - Vestra';

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
<td style='background:#3E5C76; padding:35px; text-align:center;'>

<h1 style='color:white; margin:0; font-size:34px;'>
VESTRA
</h1>

<p style='color:#dbe7f0; margin-top:10px; font-size:15px;'>
Vía Estudiantil Salesiana
</p>

</td>
</tr>



<tr>
<td style='padding:35px; color:#333;'>


<h2 style='color:#3E5C76;'>
¡Bienvenido a VESTRA, $nombre! 
</h2>


<p style='font-size:16px; line-height:1.6;'>
Tu cuenta ha sido creada correctamente.
Estamos felices de tenerte dentro de la comunidad estudiantil de VESTRA.
</p>


<p style='font-size:16px; line-height:1.6;'>
Para comenzar a utilizar la plataforma, necesitamos confirmar que este correo electrónico te pertenece.
</p>



<div style='background:#f3f4f6; 
            padding:25px;
            border-radius:12px;
            text-align:center;
            margin:25px 0;'>


<p style='margin:0 0 15px; font-size:15px; color:#555;'>
Tu código de verificación es:
</p>


<h1 style='margin:0; 
           color:#3E5C76;
           font-size:36px;
           letter-spacing:8px;'>
$codigo
</h1>


</div>



<p style='font-size:15px; color:#555;'>
Introduce este código en la aplicación para activar tu cuenta y comenzar a disfrutar de todas las funciones de VESTRA.
</p>



<p style='font-size:14px; color:#888; margin-top:30px;'>
Si no realizaste este registro, puedes ignorar este mensaje.
</p>


</td>
</tr>



<tr>
<td style='background:#f5f7fb; padding:20px; text-align:center;'>


<p style='margin:0; font-size:13px; color:#777;'>
VESTRA · Colegio Técnico Profesional Don Bosco
</p>


<p style='margin:8px 0 0; font-size:12px; color:#999;'>
Conectando estudiantes, clubes y comunidad.
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
        $_SESSION['correo_verificacion'] = $correo;

    } catch (Exception $e) {
    }
}
echo json_encode($resultado);

?>