<?php

$server= "localhost";
$user= "root";
$password= "admin#123";
$db= "vestra";

$conexion = new mysqli($server, $user, $password, $db);
$conexion->set_charset("utf8mb4");
/*
if($conexion->connect_errno){
    die("Conexion fallida" . $conexion->connect_errno);
} else {
    echo "Conectado";
}
?>*/
