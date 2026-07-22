<?php
session_start();

function usuarioLogueado() {
    if (!isset($_SESSION["usuario"])) {
        header("Location: ../login.php");
        exit();
    }
}

function permitirRoles($roles) {
    usuarioLogueado();

    if (!in_array($_SESSION["tipo"], $roles)) {
        http_response_code(403);
        die("Acceso denegado.");
    }
}