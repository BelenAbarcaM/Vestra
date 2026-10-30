const data
<?php

require_once __DIR__ . '/../config/cors.php';
session_start();

require_once __DIR__ . '/../config/conexion.php';

header('Content-Type: application/json; charset=utf-8');

function responder($datos, $codigo = 200) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Cargar la biblioteca de Google instalada con Composer.
require_once __DIR__ . '/../../vendor/autoload.php';

$configGoogle = require __DIR__ . '/../config/google.php';

$clientId = $configGoogle['client_id'] ?? '';

if ($clientId === '') {
    responder([
        'success' => false,
        'mensaje' => 'La configuración de Google está incompleta.'
    ], 500);
}

// Recibir la credencial enviada por React.
$entrada = json_decode(file_get_contents('php://input'), true);
$credential = $entrada['credential'] ?? '';

if (!is_string($credential) || $credential === '') {
    responder([
        'success' => false,
        'mensaje' => 'No se recibió la credencial de Google.'
    ], 400);
}

try {
    $clienteGoogle = new Google\Client();
    $clienteGoogle->setClientId($clientId);

    // Verificar la firma y los datos del ID token.
    $datosGoogle = $clienteGoogle->verifyIdToken($credential);

    if (!$datosGoogle) {
        responder([
            'success' => false,
            'mensaje' => 'La credencial de Google no es válida.'
        ], 401);
    }

    $googleSub = $datosGoogle['sub'] ?? '';
    $correo = strtolower(trim($datosGoogle['email'] ?? ''));
    $emailVerificado = $datosGoogle['email_verified'] ?? false;
    $nombre = trim($datosGoogle['name'] ?? '');
    $fotoGoogle = $datosGoogle['picture'] ?? '';

    if (
        $googleSub === '' ||
        $correo === '' ||
        !filter_var($correo, FILTER_VALIDATE_EMAIL) ||
        !in_array($emailVerificado, [true, 1, 'true', '1'], true)
    ) {
        responder([
            'success' => false,
            'mensaje' => 'Google no confirmó una identidad válida y verificada.'
        ], 401);
    }

    if ($nombre === '') {
        $nombre = explode('@', $correo)[0];
    }

    // Buscar primero por el identificador único de Google.
    $buscar = mysqli_prepare(
        $conexion,
        'SELECT id_usuario, Nombre, Correo, Foto_url, id_tipo_usuario,
                google_sub
         FROM usuario
         WHERE google_sub = ?
         LIMIT 1'
    );

    mysqli_stmt_bind_param($buscar, 's', $googleSub);
    mysqli_stmt_execute($buscar);
    $resultado = mysqli_stmt_get_result($buscar);
    $usuario = mysqli_fetch_assoc($resultado);
    mysqli_stmt_close($buscar);

    if (!$usuario) {
        // Si ya existe por correo, conservar su perfil y sus publicaciones.
        $buscar = mysqli_prepare(
            $conexion,
            'SELECT id_usuario, Nombre, Correo, Foto_url, id_tipo_usuario,
                    google_sub
             FROM usuario
             WHERE Correo = ?
             LIMIT 1'
        );

        mysqli_stmt_bind_param($buscar, 's', $correo);
        mysqli_stmt_execute($buscar);
        $resultado = mysqli_stmt_get_result($buscar);
        $usuario = mysqli_fetch_assoc($resultado);
        mysqli_stmt_close($buscar);

        if ($usuario) {
            // No permitir vincular una cuenta que ya pertenece
            // a otra identidad de Google.
            if (
                !empty($usuario['google_sub']) &&
                !hash_equals($usuario['google_sub'], $googleSub)
            ) {
                responder([
                    'success' => false,
                    'mensaje' => 'Esta cuenta ya está vinculada a otra identidad de Google.'
                ], 409);
            }

            $actualizar = mysqli_prepare(
                $conexion,
                'UPDATE usuario
                 SET google_sub = ?, verificado = 1
                 WHERE id_usuario = ?'
            );

            mysqli_stmt_bind_param(
                $actualizar,
                'si',
                $googleSub,
                $usuario['id_usuario']
            );

            if (!mysqli_stmt_execute($actualizar)) {
                mysqli_stmt_close($actualizar);
                responder([
                    'success' => false,
                    'mensaje' => 'No se pudo vincular la cuenta existente.'
                ], 500);
            }

            mysqli_stmt_close($actualizar);
            $usuario['google_sub'] = $googleSub;
        } else {
            // Asignar el rol según el dominio institucional.
            // Comprobar primero el dominio de estudiantes.
            if (str_ends_with($correo, '@est.cedesdonbosco.ed.cr')) {
                $tipoUsuario = 1;
            } elseif (str_ends_with($correo, '@cedesdonbosco.ed.cr')) {
                $tipoUsuario = 2;
            } else {
                $tipoUsuario = 3;
            }

            $foto = filter_var($fotoGoogle, FILTER_VALIDATE_URL)
    ? $fotoGoogle
    : '/vestra/uploads/perfiles/default.jpeg';

            $insertar = mysqli_prepare(
                $conexion,
                'INSERT INTO usuario
                    (Nombre, Correo, Contraseña, Foto_url,
                     id_tipo_usuario, google_sub, verificado)
                 VALUES (?, ?, NULL, ?, ?, ?, 1)'
            );

            mysqli_stmt_bind_param(
                $insertar,
                'sssis',
                $nombre,
                $correo,
                $foto,
                $tipoUsuario,
                $googleSub
            );

            if (!mysqli_stmt_execute($insertar)) {
                mysqli_stmt_close($insertar);
                responder([
                    'success' => false,
                    'mensaje' => 'No se pudo crear el usuario en Vestra.'
                ], 500);
            }

            $idNuevo = mysqli_insert_id($conexion);
            mysqli_stmt_close($insertar);

            $usuario = [
                'id_usuario' => $idNuevo,
                'Nombre' => $nombre,
                'Correo' => $correo,
                'Foto_url' => $foto,
                'id_tipo_usuario' => $tipoUsuario,
                'google_sub' => $googleSub
            ];
        }
    }

    // Crear la sesión PHP existente de Vestra.
    session_regenerate_id(true);

    $_SESSION['id_usuario'] = (int) $usuario['id_usuario'];
    $_SESSION['usuario'] = $usuario['Nombre'];
    $_SESSION['tipo'] = (int) $usuario['id_tipo_usuario'];
    $_SESSION['id_tipo_usuario'] = (int) $usuario['id_tipo_usuario'];

    unset(
        $_SESSION['correo_verificacion'],
        $_SESSION['correo_recuperacion'],
        $_SESSION['recuperacion_verificada'],
        $_SESSION['id_usuario_recuperacion']
    );

    error_log(
    'VESTRA LOGIN: origin=' . ($_SERVER['HTTP_ORIGIN'] ?? 'SIN ORIGIN') .
    ' | session=' . session_id() .
    ' | usuario=' . ($_SESSION['id_usuario'] ?? 'SIN USUARIO')
);

    responder([
        'success' => true,
        'id_usuario' => (int) $usuario['id_usuario'],
        'usuario' => $usuario['Nombre'],
        'tipo_usuario' => (int) $usuario['id_tipo_usuario'],
        'id_tipo_usuario' => (int) $usuario['id_tipo_usuario'],
        'mensaje' => 'Inicio de sesión correcto.'
    ]);

} catch (Throwable $e) {
    error_log('Error en el inicio de sesión con Google: ' . $e->getMessage());

    responder([
        'success' => false,
        'mensaje' => 'No se pudo completar el inicio de sesión con Google.'
    ], 500);
}
