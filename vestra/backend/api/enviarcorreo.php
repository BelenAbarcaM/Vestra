<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMailer/src/Exception.php';
require '../PHPMailer/src/PHPMailer.php';
require '../PHPMailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {

    // Configuración del servidor Gmail
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;

    $mail->Username = 'vestra.cedesdonbosco@gmail.com';

    $mail->Password = 'afegazzpvwchxqfq';

    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;


    // Remitente
    $mail->setFrom('vestra.cedesdonbosco@gmail.com', 'Vestra');

    // Destinatario de prueba
    $mail->addAddress('vestra.cedesdonbosco@gmail.com');


    // Contenido
    $mail->isHTML(true);
    $mail->Subject = 'Prueba PHPMailer';
    $mail->Body = '
        <h1>Hola bro 🔥</h1>
        <p>Si recibiste este correo, PHPMailer funciona correctamente.</p>
    ';


    $mail->send();

    echo "Correo enviado correctamente";

} catch (Exception $e) {

    echo "Error al enviar correo: {$mail->ErrorInfo}";

}

?>