<?php
function registrarUsuario($conexion, $nombre, $correo, $contra, $foto, $tipo_usuario){
    $query = "INSERT INTO usuario(Nombre, Correo, Contraseña, Foto_url, id_tipo_usuario)
            VALUES('$nombre', '$correo', '$contra', '$foto', '$tipo_usuario')";

            //Ver q no se repita el correo
$verificar_correo = mysqli_query($conexion, "SELECT * FROM usuario WHERE Correo='$correo'");
if(mysqli_num_rows($verificar_correo) > 0){
echo '
<script> alert("Este correo ya está registrado, intenta con otro diferete");
window.location = "../prueba.php";
</script>
';
exit();
}

//Ver q no se repita el usuario
$verificar_usuario = mysqli_query($conexion, "SELECT * FROM usuario WHERE Nombre='$nombre'");
if(mysqli_num_rows($verificar_usuario) > 0){
echo '
<script> alert("Este usuario ya está registrado, intenta con otro diferete");
window.location = "../prueba.php";
</script>
';
exit();
}


$ejecutar = mysqli_query($conexion, $query);

if ($ejecutar) {
    echo "Usuario registrado correctamente.";
} else {
    echo "Error: " . mysqli_error($conexion);
}

mysqli_close($conexion);
}

?>