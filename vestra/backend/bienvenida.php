<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>bienvenida</title>
</head>
<body>
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

echo "Hola " . $_SESSION['usuario'];
?>

<a href="api/logout.php">Cerrar sesión</a>
</body>
</html>