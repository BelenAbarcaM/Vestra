
<?php

require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';

function responder($datos, $estado = 200)
{
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Manejar CORS.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Solo permitir GET.
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder([
        "success" => false,
        "error" => "Método no permitido."
    ], 405);
}

// Comprobar sesión.
if (!isset($_SESSION["id_usuario"])) {
    responder([
        "success" => false,
        "error" => "Debes iniciar sesión."
    ], 401);
}

$id_usuario = (int) $_SESSION["id_usuario"];

try {
    // Comprobar que el usuario exista.
    $sqlUsuario = "
        SELECT id_tipo_usuario
        FROM usuario
        WHERE id_usuario = ?
    ";

    $stmtUsuario = $conexion->prepare($sqlUsuario);

    if (!$stmtUsuario) {
        throw new Exception("No se pudo verificar el usuario.");
    }

    $stmtUsuario->bind_param("i", $id_usuario);
    $stmtUsuario->execute();

    $usuario = $stmtUsuario->get_result()->fetch_assoc();
    $stmtUsuario->close();

    if (!$usuario) {
        responder([
            "success" => false,
            "error" => "El usuario no existe."
        ], 401);
    }

    // Los invitados no pueden utilizar el chat.
    if ((int) $usuario["id_tipo_usuario"] === 3) {
        responder([
            "success" => false,
            "error" => "Los invitados no pueden utilizar el chat."
        ], 403);
    }

    // Obtener todos los profesores registrados.
    $sqlProfesores = "
        SELECT
            id_usuario,
            Nombre,
            Foto_url,
            Bio
        FROM usuario
        WHERE id_tipo_usuario = 2
          AND id_usuario <> ?
        ORDER BY Nombre ASC
    ";

    $stmtProfesores = $conexion->prepare($sqlProfesores);

    if (!$stmtProfesores) {
        throw new Exception("No se pudo preparar la lista de profesores.");
    }

    $stmtProfesores->bind_param("i", $id_usuario);
    $stmtProfesores->execute();

    $resultado = $stmtProfesores->get_result();
    $profesores = [];

    while ($fila = $resultado->fetch_assoc()) {
        $profesores[] = [
            "id_usuario" => (int) $fila["id_usuario"],
            "nombre" => $fila["Nombre"],
            "foto" => $fila["Foto_url"],
            "bio" => $fila["Bio"]
        ];
    }

    $stmtProfesores->close();

    responder([
        "success" => true,
        "profesores" => $profesores
    ]);

} catch (Throwable $e) {
    error_log(
        "Error en listar_profesores.php: " . $e->getMessage()
    );

    responder([
        "success" => false,
        "error" => "No se pudo cargar la lista de profesores."
    ], 500);
}
?>