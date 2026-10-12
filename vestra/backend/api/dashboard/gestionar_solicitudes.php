
<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

/**
 * Responder en JSON.
 */
function responder($datos, $estado = 200)
{
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Manejar CORS.
 */
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/**
 * Verificar método.
 */
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder([
        "success" => false,
        "error" => "Método no permitido."
    ], 405);
}

/**
 * Verificar sesión.
 */
if (!isset($_SESSION["id_usuario"])) {
    responder([
        "success" => false,
        "error" => "Usuario no autenticado."
    ], 401);
}

$id_profesor = (int) $_SESSION["id_usuario"];

/**
 * Recibir datos.
 */
$id_solicitud = $_POST["id_solicitud"] ?? null;
$accion = $_POST["accion"] ?? null;

if (
    $id_solicitud === null ||
    !is_string($accion) ||
    !ctype_digit((string) $id_solicitud) ||
    (int) $id_solicitud < 1
) {
    responder([
        "success" => false,
        "error" => "Los datos enviados no son válidos."
    ], 400);
}

$id_solicitud = (int) $id_solicitud;

/**
 * Acciones permitidas.
 */
$accionesPermitidas = [
    "Aceptar",
    "Rechazar",
    "AprobarFechaIngreso",
    "RechazarFechaIngreso"
];

if (!in_array($accion, $accionesPermitidas, true)) {
    responder([
        "success" => false,
        "error" => "Acción no válida."
    ], 400);
}

try {
    $conexion->begin_transaction();

    /**
     * Obtener la solicitud y comprobar que el profesor
     * sea responsable del club.
     */
    $sqlSolicitud = "
        SELECT
            s.id_solicitud,
            s.id_usuario,
            s.id_club,
            s.estado,
            s.tipo_membresia,
            s.fecha_ingreso_solicitada,
            s.fecha_ingreso_aprobada,
            s.estado_fecha_ingreso
        FROM solicitudclub s
        INNER JOIN club c
            ON c.id_club = s.id_club
        WHERE s.id_solicitud = ?
          AND c.id_profesor = ?
        FOR UPDATE
    ";

    $stmtSolicitud = $conexion->prepare($sqlSolicitud);

    if (!$stmtSolicitud) {
        throw new Exception("No se pudo consultar la solicitud.");
    }

    $stmtSolicitud->bind_param(
        "ii",
        $id_solicitud,
        $id_profesor
    );

    $stmtSolicitud->execute();

    $resultado = $stmtSolicitud->get_result();
    $solicitud = $resultado->fetch_assoc();

    $stmtSolicitud->close();

    if (!$solicitud) {
        throw new Exception(
            "Solicitud no encontrada o no tienes permiso para gestionarla."
        );
    }

    $id_usuario = (int) $solicitud["id_usuario"];
    $id_club = (int) $solicitud["id_club"];

    /**
     * ACCIÓN: ACEPTAR SOLICITUD
     */
    if ($accion === "Aceptar") {

        if ($solicitud["estado"] !== "Pendiente") {
            throw new Exception(
                "Esta solicitud ya fue procesada."
            );
        }

        /**
         * Comprobar que no exista una inscripción previa.
         */
        $sqlExiste = "
            SELECT id_inscripcion
            FROM inscripcion
            WHERE id_usuario = ?
              AND id_club = ?
            FOR UPDATE
        ";

        $stmtExiste = $conexion->prepare($sqlExiste);

        if (!$stmtExiste) {
            throw new Exception(
                "No se pudo comprobar la inscripción existente."
            );
        }

        $stmtExiste->bind_param("ii", $id_usuario, $id_club);
        $stmtExiste->execute();

        $yaExiste = $stmtExiste->get_result()->num_rows > 0;

        $stmtExiste->close();

        if ($yaExiste) {
            throw new Exception(
                "El estudiante ya tiene una inscripción en este club."
            );
        }

        /**
         * Crear la inscripción según el tipo de membresía.
         *
         * NUEVO:
         * Su ingreso oficial es el día de aceptación.
         *
         * ANTIGUO:
         * Su fecha oficial queda pendiente de revisión.
         */
        if ($solicitud["tipo_membresia"] === "Antiguo") {

            $sqlInscripcion = "
                INSERT INTO inscripcion (
                    id_usuario,
                    id_club,
                    fecha_ingreso,
                    anio_ingreso
                )
                VALUES (?, ?, NULL, NULL)
            ";

        } else {

            $sqlInscripcion = "
                INSERT INTO inscripcion (
                    id_usuario,
                    id_club,
                    fecha_ingreso,
                    anio_ingreso
                )
                VALUES (?, ?, CURDATE(), YEAR(CURDATE()))
            ";
        }

        $stmtInscripcion = $conexion->prepare($sqlInscripcion);

        if (!$stmtInscripcion) {
            throw new Exception(
                "No se pudo preparar la inscripción del estudiante."
            );
        }

        $stmtInscripcion->bind_param(
            "ii",
            $id_usuario,
            $id_club
        );

        if (!$stmtInscripcion->execute()) {
            $stmtInscripcion->close();

            throw new Exception(
                "No se pudo crear la inscripción del estudiante."
            );
        }

        $stmtInscripcion->close();

        /**
         * Actualizar el estado de la solicitud.
         */
        $sqlActualizar = "
            UPDATE solicitudclub
            SET estado = 'Aceptado'
            WHERE id_solicitud = ?
              AND estado = 'Pendiente'
        ";

        $stmtActualizar = $conexion->prepare($sqlActualizar);

        if (!$stmtActualizar) {
            throw new Exception(
                "No se pudo preparar la actualización de la solicitud."
            );
        }

        $stmtActualizar->bind_param("i", $id_solicitud);
        $stmtActualizar->execute();

        if ($stmtActualizar->affected_rows !== 1) {
            $stmtActualizar->close();

            throw new Exception(
                "No se pudo actualizar el estado de la solicitud."
            );
        }

        $stmtActualizar->close();

        /**
         * NUEVO: ASIGNAR INSIGNIAS AUTOMÁTICAMENTE.
         *
         * Se asignan todas las insignias aprobadas del club.
         * INSERT IGNORE evita duplicados gracias al índice
         * UNIQUE de usuarioinsignia.
         *
         * Todo ocurre dentro de la misma transacción.
         */
        $sqlInsignias = "
            INSERT IGNORE INTO usuarioinsignia (
                id_usuario,
                id_insignia
            )
            SELECT
                ?,
                i.id_insignia
            FROM insignia i
            WHERE i.id_club = ?
              AND i.estado = 'Aprobado'
        ";

        $stmtInsignias = $conexion->prepare($sqlInsignias);

        if (!$stmtInsignias) {
            throw new Exception(
                "No se pudieron preparar las insignias del club."
            );
        }

        $stmtInsignias->bind_param(
            "ii",
            $id_usuario,
            $id_club
        );

        if (!$stmtInsignias->execute()) {
            $stmtInsignias->close();

            throw new Exception(
                "No se pudieron asignar las insignias del club."
            );
        }

        $stmtInsignias->close();

        /**
         * Confirmar inscripción, solicitud e insignias.
         */
        $conexion->commit();

        if ($solicitud["tipo_membresia"] === "Antiguo") {
            responder([
                "success" => true,
                "mensaje" => "Solicitud aceptada. Las insignias disponibles fueron asignadas y la fecha de antigüedad sigue pendiente de revisión."
            ]);
        }

        responder([
            "success" => true,
            "mensaje" => "Solicitud aceptada, inscripción creada e insignias asignadas correctamente."
        ]);
    }

    /**
     * ACCIÓN: RECHAZAR SOLICITUD
     */
    if ($accion === "Rechazar") {

        if ($solicitud["estado"] !== "Pendiente") {
            throw new Exception(
                "Esta solicitud ya fue procesada."
            );
        }

        $sqlActualizar = "
            UPDATE solicitudclub
            SET estado = 'Rechazado'
            WHERE id_solicitud = ?
              AND estado = 'Pendiente'
        ";

        $stmtActualizar = $conexion->prepare($sqlActualizar);

        if (!$stmtActualizar) {
            throw new Exception(
                "No se pudo preparar el rechazo de la solicitud."
            );
        }

        $stmtActualizar->bind_param("i", $id_solicitud);
        $stmtActualizar->execute();

        if ($stmtActualizar->affected_rows !== 1) {
            $stmtActualizar->close();

            throw new Exception(
                "No se pudo rechazar la solicitud."
            );
        }

        $stmtActualizar->close();

        $conexion->commit();

        responder([
            "success" => true,
            "mensaje" => "Solicitud rechazada correctamente."
        ]);
    }

    /**
     * Las acciones restantes gestionan exclusivamente
     * la fecha de antigüedad.
     */
    if ($solicitud["estado"] !== "Aceptado") {
        throw new Exception(
            "Primero debes aceptar la solicitud de ingreso antes de revisar su antigüedad."
        );
    }

    if ($solicitud["tipo_membresia"] !== "Antiguo") {
        throw new Exception(
            "Esta solicitud no contiene una declaración de antigüedad."
        );
    }

    if (
        $solicitud["estado_fecha_ingreso"] !== "Pendiente" ||
        empty($solicitud["fecha_ingreso_solicitada"])
    ) {
        throw new Exception(
            "La fecha de ingreso ya fue revisada o no existe una fecha pendiente."
        );
    }

    /**
     * ACCIÓN: APROBAR FECHA DE ANTIGÜEDAD
     */
    if ($accion === "AprobarFechaIngreso") {

        $fechaIngreso = $solicitud["fecha_ingreso_solicitada"];

        if ($fechaIngreso > date("Y-m-d")) {
            throw new Exception(
                "La fecha declarada no puede ser futura."
            );
        }

        /**
         * Actualizar la fecha oficial de inscripción.
         */
        $sqlInscripcion = "
            UPDATE inscripcion
            SET fecha_ingreso = ?,
                anio_ingreso = YEAR(?)
            WHERE id_usuario = ?
              AND id_club = ?
        ";

        $stmtInscripcion = $conexion->prepare($sqlInscripcion);

        if (!$stmtInscripcion) {
            throw new Exception(
                "No se pudo preparar la actualización de la inscripción."
            );
        }

        $stmtInscripcion->bind_param(
            "ssii",
            $fechaIngreso,
            $fechaIngreso,
            $id_usuario,
            $id_club
        );

        if (!$stmtInscripcion->execute()) {
            $stmtInscripcion->close();

            throw new Exception(
                "No se pudo actualizar la fecha oficial de ingreso."
            );
        }

        $stmtInscripcion->close();

        /**
         * Registrar la fecha aprobada.
         */
        $sqlActualizar = "
            UPDATE solicitudclub
            SET fecha_ingreso_aprobada = ?,
                estado_fecha_ingreso = 'Aprobada'
            WHERE id_solicitud = ?
              AND estado_fecha_ingreso = 'Pendiente'
        ";

        $stmtActualizar = $conexion->prepare($sqlActualizar);

        if (!$stmtActualizar) {
            throw new Exception(
                "No se pudo preparar la aprobación de la antigüedad."
            );
        }

        $stmtActualizar->bind_param(
            "si",
            $fechaIngreso,
            $id_solicitud
        );

        $stmtActualizar->execute();

        if ($stmtActualizar->affected_rows !== 1) {
            $stmtActualizar->close();

            throw new Exception(
                "No se pudo registrar la aprobación de la antigüedad."
            );
        }

        $stmtActualizar->close();

        $conexion->commit();

        responder([
            "success" => true,
            "mensaje" => "Fecha de antigüedad aprobada y registrada correctamente.",
            "fecha_ingreso_aprobada" => $fechaIngreso
        ]);
    }

    /**
     * ACCIÓN: RECHAZAR FECHA DE ANTIGÜEDAD
     */
    if ($accion === "RechazarFechaIngreso") {

        /**
         * Si la inscripción no tiene fecha oficial,
         * establecer la fecha actual.
         */
        $sqlInscripcion = "
            UPDATE inscripcion
            SET fecha_ingreso = COALESCE(fecha_ingreso, CURDATE()),
                anio_ingreso = COALESCE(anio_ingreso, YEAR(CURDATE()))
            WHERE id_usuario = ?
              AND id_club = ?
        ";

        $stmtInscripcion = $conexion->prepare($sqlInscripcion);

        if (!$stmtInscripcion) {
            throw new Exception(
                "No se pudo preparar la actualización de la inscripción."
            );
        }

        $stmtInscripcion->bind_param(
            "ii",
            $id_usuario,
            $id_club
        );

        if (!$stmtInscripcion->execute()) {
            $stmtInscripcion->close();

            throw new Exception(
                "No se pudo actualizar la fecha de inscripción."
            );
        }

        $stmtInscripcion->close();

        /**
         * Registrar el rechazo de la fecha declarada.
         */
        $sqlActualizar = "
            UPDATE solicitudclub
            SET estado_fecha_ingreso = 'Rechazada',
                fecha_ingreso_aprobada = NULL
            WHERE id_solicitud = ?
              AND estado_fecha_ingreso = 'Pendiente'
        ";

        $stmtActualizar = $conexion->prepare($sqlActualizar);

        if (!$stmtActualizar) {
            throw new Exception(
                "No se pudo preparar el rechazo de la antigüedad."
            );
        }

        $stmtActualizar->bind_param("i", $id_solicitud);
        $stmtActualizar->execute();

        if ($stmtActualizar->affected_rows !== 1) {
            $stmtActualizar->close();

            throw new Exception(
                "No se pudo registrar el rechazo de la antigüedad."
            );
        }

        $stmtActualizar->close();

        $conexion->commit();

        responder([
            "success" => true,
            "mensaje" => "La fecha declarada fue rechazada. El estudiante conserva su inscripción con la fecha actual."
        ]);
    }

    throw new Exception("No se pudo completar la acción solicitada.");

} catch (Throwable $e) {

    try {
        $conexion->rollback();
    } catch (Throwable $errorRollback) {
        // No reemplazar el error original.
    }

    error_log(
        "Error en gestionar_solicitudes.php: " . $e->getMessage()
    );

    responder([
        "success" => false,
        "error" => $e instanceof Exception
            ? $e->getMessage()
            : "Ocurrió un error al gestionar la solicitud."
    ], 400);
}

?>