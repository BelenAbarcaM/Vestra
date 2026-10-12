
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

function responder($datos, $estado = 200) {
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Manejar CORS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder([
        "success" => false,
        "error" => "Método no permitido."
    ], 405);
}

// Verificar sesión
if (!isset($_SESSION["id_usuario"])) {
    responder([
        "success" => false,
        "error" => "Debes iniciar sesión."
    ], 401);
}

$id_remitente = (int) $_SESSION["id_usuario"];

// Leer los datos JSON enviados desde React.
// También permite recibir datos mediante POST tradicional.
$entrada = file_get_contents("php://input");
$datos = json_decode($entrada, true);

if (!is_array($datos)) {
    $datos = $_POST;
}

$id_destinatario = filter_var(
    $datos["id_destinatario"] ?? null,
    FILTER_VALIDATE_INT
);

$contenido = trim((string) ($datos["contenido"] ?? ""));

if (!$id_destinatario || $id_destinatario <= 0) {
    responder([
        "success" => false,
        "error" => "El destinatario no es válido."
    ], 400);
}

if ($id_destinatario === $id_remitente) {
    responder([
        "success" => false,
        "error" => "No puedes enviarte mensajes a ti mismo."
    ], 400);
}

if ($contenido === "") {
    responder([
        "success" => false,
        "error" => "El mensaje no puede estar vacío."
    ], 400);
}

$longitud = function_exists("mb_strlen")
    ? mb_strlen($contenido, "UTF-8")
    : strlen($contenido);

if ($longitud > 5000) {
    responder([
        "success" => false,
        "error" => "El mensaje no puede superar los 5000 caracteres."
    ], 400);
}

try {
    // Consultar los roles de ambas personas.
    $sqlUsuarios = "
        SELECT id_usuario, id_tipo_usuario
        FROM usuario
        WHERE id_usuario IN (?, ?)
    ";

    $stmtUsuarios = $conexion->prepare($sqlUsuarios);

    if (!$stmtUsuarios) {
        throw new Exception("No se pudo preparar la consulta de usuarios.");
    }

    $stmtUsuarios->bind_param(
        "ii",
        $id_remitente,
        $id_destinatario
    );

    $stmtUsuarios->execute();
    $resultadoUsuarios = $stmtUsuarios->get_result();

    $usuarios = [];

    while ($fila = $resultadoUsuarios->fetch_assoc()) {
        $usuarios[(int) $fila["id_usuario"]] =
            (int) $fila["id_tipo_usuario"];
    }

    $stmtUsuarios->close();

    if (
        !isset($usuarios[$id_remitente]) ||
        !isset($usuarios[$id_destinatario])
    ) {
        responder([
            "success" => false,
            "error" => "El remitente o el destinatario no existe."
        ], 404);
    }

    $rolRemitente = $usuarios[$id_remitente];
    $rolDestinatario = $usuarios[$id_destinatario];

    // Únicamente estudiantes y profesores pueden usar el chat.
    if (
        !in_array($rolRemitente, [1, 2], true) ||
        !in_array($rolDestinatario, [1, 2], true)
    ) {
        responder([
            "success" => false,
            "error" => "Uno de los usuarios no tiene permiso para utilizar el chat."
        ], 403);
    }

    // Definir quién es el estudiante y quién es el profesor.
    if ($rolRemitente === 1 && $rolDestinatario === 2) {

        // Un estudiante inicia o continúa un chat con un profesor.
        $id_estudiante = $id_remitente;
        $id_profesor = $id_destinatario;
        $esEstudianteQuienEnvia = true;

    } elseif ($rolRemitente === 2 && $rolDestinatario === 1) {

        // Un profesor solo puede responder a un estudiante
        // si ya existe una conversación iniciada por este.
        $id_estudiante = $id_destinatario;
        $id_profesor = $id_remitente;
        $esEstudianteQuienEnvia = false;

    } else {
        responder([
            "success" => false,
            "error" => "Solo puedes conversar entre estudiantes y profesores."
        ], 403);
    }

    $conexion->begin_transaction();

    // Buscar la conversación existente.
    $sqlBuscar = "
        SELECT id_conversacion
        FROM chat_profesor_conversacion
        WHERE id_estudiante = ?
          AND id_profesor = ?
        LIMIT 1
        FOR UPDATE
    ";

    $stmtBuscar = $conexion->prepare($sqlBuscar);

    if (!$stmtBuscar) {
        throw new Exception("No se pudo preparar la búsqueda de conversación.");
    }

    $stmtBuscar->bind_param(
        "ii",
        $id_estudiante,
        $id_profesor
    );

    $stmtBuscar->execute();

    $conversacion = $stmtBuscar
        ->get_result()
        ->fetch_assoc();

    $stmtBuscar->close();

    if (!$conversacion) {

        // Los profesores no pueden crear conversaciones nuevas.
        if (!$esEstudianteQuienEnvia) {
            $conexion->rollback();

            responder([
                "success" => false,
                "error" => "No puedes iniciar una conversación. Espera a que el estudiante te escriba."
            ], 403);
        }

        // Crear la conversación cuando el estudiante envía
        // su primer mensaje.
        $sqlCrear = "
            INSERT INTO chat_profesor_conversacion
                (id_estudiante, id_profesor)
            VALUES (?, ?)
        ";

        $stmtCrear = $conexion->prepare($sqlCrear);

        if (!$stmtCrear) {
            throw new Exception("No se pudo preparar la creación de conversación.");
        }

        $stmtCrear->bind_param(
            "ii",
            $id_estudiante,
            $id_profesor
        );

        $stmtCrear->execute();
        $id_conversacion = (int) $conexion->insert_id;

        $stmtCrear->close();

    } else {
        $id_conversacion = (int) $conversacion["id_conversacion"];
    }

    // Guardar el mensaje.
    $sqlMensaje = "
        INSERT INTO chat_profesor_mensaje
            (id_conversacion, id_remitente, contenido)
        VALUES (?, ?, ?)
    ";

    $stmtMensaje = $conexion->prepare($sqlMensaje);

    if (!$stmtMensaje) {
        throw new Exception("No se pudo preparar el envío del mensaje.");
    }

    $stmtMensaje->bind_param(
        "iis",
        $id_conversacion,
        $id_remitente,
        $contenido
    );

    $stmtMensaje->execute();

    $id_mensaje = (int) $conexion->insert_id;

    $stmtMensaje->close();

    // Actualizar la actividad de la conversación.
    $sqlActualizar = "
        UPDATE chat_profesor_conversacion
        SET fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_conversacion = ?
    ";

    $stmtActualizar = $conexion->prepare($sqlActualizar);

    if (!$stmtActualizar) {
        throw new Exception("No se pudo actualizar la conversación.");
    }

    $stmtActualizar->bind_param("i", $id_conversacion);
    $stmtActualizar->execute();
    $stmtActualizar->close();

    $conexion->commit();

    responder([
        "success" => true,
        "mensaje" => "Mensaje enviado correctamente.",
        "id_mensaje" => $id_mensaje,
        "id_conversacion" => $id_conversacion
    ]);

} catch (Throwable $e) {

    try {
        $conexion->rollback();
    } catch (Throwable $errorRollback) {
        // No interrumpir la respuesta del endpoint.
    }

    error_log(
        "Error en enviar_mensaje.php: " . $e->getMessage()
    );

    responder([
        "success" => false,
        "error" => "No se pudo enviar el mensaje."
    ], 500);
}
?>