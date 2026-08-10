<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/conexion.php";
require_once "../../models/Usuario.php";

if($_SERVER["REQUEST_METHOD"] !== "GET"){
    echo json_encode([
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
    exit;
}

if(!isset($_GET["id_usuario"])){
    echo json_encode([
        "success" => false,
        "mensaje" => "Falta el id del usuario."
    ]);
    exit;
}

$id_usuario = intval($_GET["id_usuario"]);

$perfil = obtenerPerfil($conexion, $id_usuario);

if($perfil === false){
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no encontrado."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "usuario" => $perfil
]);