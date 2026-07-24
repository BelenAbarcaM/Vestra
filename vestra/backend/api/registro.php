<?php

include '../config/conexion.php';
include '../models/Usuario.php';


$nombre = $_POST['name'];
$correo = $_POST['email'];
$contra = password_hash($_POST['password'], PASSWORD_DEFAULT);
$foto = "default.png";
if (str_ends_with($correo, "@est.cedesdonbosco.ed.cr")) {

    $tipo_usuario = 1;

} elseif (str_ends_with($correo, "@cedesdonbosco.ed.cr")) {

    $tipo_usuario = 2;

} else {

    $tipo_usuario = 3;

}


registrarUsuario($conexion, $nombre, $correo, $contra, $foto, $tipo_usuario);

?>
