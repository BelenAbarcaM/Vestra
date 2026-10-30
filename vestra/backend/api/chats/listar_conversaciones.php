
<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';


function responder($datos, $estado = 200) {
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder([
        "success" => false,
        "error" => "Método no permitido."
    ], 405);
}

if (!isset($_SESSION["id_usuario"])) {
    responder([
        "success" => false,
        "error" => "Debes iniciar sesión."
    ], 401);
}

$id_usuario = (int) $_SESSION["id_usuario"];

try {
    // Obtener el rol del usuario.
    $sqlRol = "
        SELECT id_tipo_usuario
        FROM usuario
        WHERE id_usuario = ?
    ";

    $stmtRol = $conexion->prepare($sqlRol);

    if (!$stmtRol) {
        throw new Exception("No se pudo preparar la consulta del usuario.");
    }

    $stmtRol->bind_param("i", $id_usuario);
    $stmtRol->execute();

    $usuario = $stmtRol->get_result()->fetch_assoc();
    $stmtRol->close();

    if (!$usuario) {
        responder([
            "success" => false,
            "error" => "El usuario no existe."
        ], 401);
    }

    $rol = (int) $usuario["id_tipo_usuario"];

    if ($rol === 3) {
        responder([
            "success" => false,
            "error" => "Los invitados no pueden utilizar el chat."
        ], 403);
    }

    if ($rol !== 1 && $rol !== 2) {
        responder([
            "success" => false,
            "error" => "No tienes permiso para utilizar el chat."
        ], 403);
    }

    // Estudiante: obtiene sus conversaciones con profesores.
    if ($rol === 1) {
        $sql = "
            SELECT
                c.id_conversacion,
                u.id_usuario AS id_contacto,
                u.Nombre AS nombre_contacto,
                u.Foto_url AS foto_contacto,

                (
                    SELECT m.contenido
                    FROM chat_profesor_mensaje m
                    WHERE m.id_conversacion = c.id_conversacion
                    ORDER BY m.fecha_envio DESC, m.id_mensaje DESC
                    LIMIT 1
                ) AS ultimo_mensaje,

                (
                    SELECT m.fecha_envio
                    FROM chat_profesor_mensaje m
                    WHERE m.id_conversacion = c.id_conversacion
                    ORDER BY m.fecha_envio DESC, m.id_mensaje DESC
                    LIMIT 1
                ) AS fecha_ultimo_mensaje,

                (
                    SELECT COUNT(*)
                    FROM chat_profesor_mensaje m
                    WHERE m.id_conversacion = c.id_conversacion
                      AND m.id_remitente <> ?
                      AND m.leido = 0
                ) AS mensajes_no_leidos

            FROM chat_profesor_conversacion c

            INNER JOIN usuario u
                ON u.id_usuario = c.id_profesor

            WHERE c.id_estudiante = ?

              AND EXISTS (
                  SELECT 1
                  FROM chat_profesor_mensaje m
                  WHERE m.id_conversacion = c.id_conversacion
              )

            ORDER BY
                fecha_ultimo_mensaje DESC,
                c.id_conversacion DESC
        ";

    } else {
        // Profesor: solo conversaciones iniciadas por estudiantes.
        $sql = "
            SELECT
                c.id_conversacion,
                u.id_usuario AS id_contacto,
                u.Nombre AS nombre_contacto,
                u.Foto_url AS foto_contacto,

                (
                    SELECT m.contenido
                    FROM chat_profesor_mensaje m
                    WHERE m.id_conversacion = c.id_conversacion
                    ORDER BY m.fecha_envio DESC, m.id_mensaje DESC
                    LIMIT 1
                ) AS ultimo_mensaje,

                (
                    SELECT m.fecha_envio
                    FROM chat_profesor_mensaje m
                    WHERE m.id_conversacion = c.id_conversacion
                    ORDER BY m.fecha_envio DESC, m.id_mensaje DESC
                    LIMIT 1
                ) AS fecha_ultimo_mensaje,

                (
                    SELECT COUNT(*)
                    FROM chat_profesor_mensaje m
                    WHERE m.id_conversacion = c.id_conversacion
                      AND m.id_remitente <> ?
                      AND m.leido = 0
                ) AS mensajes_no_leidos

            FROM chat_profesor_conversacion c

            INNER JOIN usuario u
                ON u.id_usuario = c.id_estudiante

            WHERE c.id_profesor = ?

              AND EXISTS (
                  SELECT 1
                  FROM chat_profesor_mensaje m
                  WHERE m.id_conversacion = c.id_conversacion
                    AND m.id_remitente = c.id_estudiante
              )

            ORDER BY
                fecha_ultimo_mensaje DESC,
                c.id_conversacion DESC
        ";
    }

    $stmt = $conexion->prepare($sql);

    if (!$stmt) {
        throw new Exception("No se pudo preparar la consulta de conversaciones.");
    }

    $stmt->bind_param("ii", $id_usuario, $id_usuario);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $conversaciones = [];

    while ($fila = $resultado->fetch_assoc()) {
        $conversaciones[] = [
            "id_conversacion" => (int) $fila["id_conversacion"],
            "id_contacto" => (int) $fila["id_contacto"],
            "nombre_contacto" => $fila["nombre_contacto"],
            "foto_contacto" => $fila["foto_contacto"],
            "ultimo_mensaje" => $fila["ultimo_mensaje"],
            "fecha_ultimo_mensaje" => $fila["fecha_ultimo_mensaje"],
            "mensajes_no_leidos" => (int) $fila["mensajes_no_leidos"]
        ];
    }

    $stmt->close();

    responder([
        "success" => true,
        "conversaciones" => $conversaciones
    ]);

} catch (Throwable $e) {
    error_log(
        "Error en listar_conversaciones.php: " . $e->getMessage()
    );

    responder([
        "success" => false,
        "error" => "No se pudieron cargar las conversaciones."
    ], 500);
}

?>