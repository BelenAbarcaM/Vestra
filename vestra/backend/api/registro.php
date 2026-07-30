<?php

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
    <h2>¡Hola $nombre!</h2>

    <p>Gracias por registrarte en Vestra.</p>

    <p>Tu código de verificación es:</p>

    <h1>$codigo</h1>

    <p>Ingresa este código en la aplicación para activar tu cuenta.</p>
";

        $mail->send();

    } catch (Exception $e) {
    }
}

echo json_encode($resultado);

?>