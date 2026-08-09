<?php

session_start();

session_unset();
session_destroy();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

echo json_encode([
    "success" => true,
    "message" => "Sesión cerrada correctamente."
]);

exit();
?>