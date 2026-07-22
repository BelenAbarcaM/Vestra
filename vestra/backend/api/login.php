<?php
include '../config/conexion.php';


$correo = $_POST['email'];
$contra = $_POST['pass'];

$consulta = mysqli_query($conexion, "SELECT * FROM usuario WHERE Correo='$correo'");

if(mysqli_num_rows($consulta) > 0){

    $usuario = mysqli_fetch_assoc($consulta);

    if(password_verify($contra, $usuario['Contraseña'])){

    session_start();

    $_SESSION['id_usuario'] = $usuario['id_usuario'];
    $_SESSION['usuario'] = $usuario['Nombre'];
    $_SESSION['tipo'] = $usuario['id_tipo_usuario'];


        header("location: ../bienvenida.php");
        exit();

    } else {

        echo '
        <script>
        alert("Contraseña incorrecta");
        window.location = "../prueba.php";
        </script>';
    }

}else{

    echo '
    <script>
    alert("Este usuario aún no existe");
    window.location = "../prueba.php";
    </script>';

}

?>