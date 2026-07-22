<?php
session_start();

if(!isset($_SESSION['usuario'])){
    echo '
<script> alert("Por favor debes iniciar sesión");
window.location = "prueba.php";
</script>
';
session_destroy();
die();
}

session_destroy();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Prueba Registro</title>
</head>
<body>
    <form action="api/login.php" method="POST">

    <h2>Iniciar sesión</h2>

    <label for="email">Correo:</label>
    <input type="email" id="email" name="email" placeholder="Ingrese su correo" required>

    <br><br>

    <label for="pass">Contraseña:</label>
    <input type="password" id="pass" name="pass" placeholder="Ingrese su contraseña" required>

    <br><br>

    <button type="submit">Iniciar sesión</button>

</form>

    <h2>Registro de prueba</h2>

    <form action="api/registro.php" method="POST">

        <label>Nombre:</label><br>
        <input type="text" name="name" required><br><br>

        <label>Correo:</label><br>
        <input type="email" name="email" required><br><br>

        <label>Contraseña:</label><br>
        <input type="password" name="pass" required><br><br>

        <button type="submit">Registrarse</button>

    </form>

</body>
</html>