<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once "../../config/conexion.php";

session_start();


// verificra sesion

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "error" => "Usuario no autenticado"
    ]);
    exit;
}

$id_profesor = intval($_SESSION["id_usuario"]);


// recibir datos

$id_solicitud = $_POST["id_solicitud"] ?? null;
$accion = $_POST["accion"] ?? null;


if (!$id_solicitud || !$accion) {
    echo json_encode([
        "error" => "Faltan datos obligatorios"
    ]);
    exit;
}

if (!is_numeric($id_solicitud)) {
    echo json_encode([
        "error" => "ID de solicitud no válido"
    ]);
    exit;
}

$id_solicitud = intval($id_solicitud);


//validar la acción
if ($accion !== "Aceptar" && $accion !== "Rechazar") {
    echo json_encode([
        "error" => "Acción no válida"
    ]);
    exit;
}


//obtener la soli

$sqlSolicitud = "SELECT
                    s.id_solicitud,
                    s.id_usuario,
                    s.id_club,
                    s.estado

                 FROM solicitudclub s

                 INNER JOIN club c
                     ON s.id_club = c.id_club

                 WHERE s.id_solicitud = ?
                 AND c.id_profesor = ?";

$stmtSolicitud = $conexion->prepare($sqlSolicitud);
$stmtSolicitud->bind_param(
    "ii",
    $id_solicitud,
    $id_profesor
);

$stmtSolicitud->execute();

$resultadoSolicitud = $stmtSolicitud->get_result();
$solicitud = $resultadoSolicitud->fetch_assoc();


if (!$solicitud) {
    echo json_encode([
        "error" => "Solicitud no encontrada o no tienes permiso"
    ]);
    exit;
}


// verificar q este pendiente

if ($solicitud["estado"] !== "Pendiente") {
    echo json_encode([
        "error" => "Esta solicitud ya fue procesada"
    ]);
    exit;
}


$id_usuario = intval($solicitud["id_usuario"]);
$id_club = intval($solicitud["id_club"]);



$conexion->begin_transaction();


try {

    //aceptar

    if ($accion === "Aceptar") {

        // Verificar que no esté ya inscrito
        $sqlExiste = "SELECT COUNT(*) AS total
                      FROM inscripcion
                      WHERE id_usuario = ?
                      AND id_club = ?";

        $stmtExiste = $conexion->prepare($sqlExiste);
        $stmtExiste->bind_param(
            "ii",
            $id_usuario,
            $id_club
        );

        $stmtExiste->execute();

        $yaExiste = intval(
            $stmtExiste
                ->get_result()
                ->fetch_assoc()["total"]
        );


        // Crear inscripción si todavía no existe
        if ($yaExiste === 0) {

            $sqlInscripcion = "INSERT INTO inscripcion (
                                    id_usuario,
                                    id_club,
                                    fecha_ingreso,
                                    anio_ingreso
                               )
                               VALUES (?, ?, CURDATE(), YEAR(CURDATE()))";

            $stmtInscripcion = $conexion->prepare($sqlInscripcion);
            $stmtInscripcion->bind_param(
                "ii",
                $id_usuario,
                $id_club
            );

            if (!$stmtInscripcion->execute()) {
                throw new Exception(
                    "No se pudo crear la inscripción"
                );
            }
        }


        // Cambiar solicitud a Aceptado
        $sqlActualizar = "UPDATE solicitudclub
                          SET estado = 'Aceptado'
                          WHERE id_solicitud = ?";

        $stmtActualizar = $conexion->prepare($sqlActualizar);
        $stmtActualizar->bind_param(
            "i",
            $id_solicitud
        );

        if (!$stmtActualizar->execute()) {
            throw new Exception(
                "No se pudo actualizar la solicitud"
            );
        }


        $conexion->commit();

        echo json_encode([
            "success" => true,
            "mensaje" => "Solicitud aceptada correctamente"
        ]);

        exit;
    }


    // rerchazar

    if ($accion === "Rechazar") {

        $sqlActualizar = "UPDATE solicitudclub
                          SET estado = 'Rechazado'
                          WHERE id_solicitud = ?";

        $stmtActualizar = $conexion->prepare($sqlActualizar);
        $stmtActualizar->bind_param(
            "i",
            $id_solicitud
        );

        if (!$stmtActualizar->execute()) {
            throw new Exception(
                "No se pudo rechazar la solicitud"
            );
        }


        $conexion->commit();

        echo json_encode([
            "success" => true,
            "mensaje" => "Solicitud rechazada correctamente"
        ]);

        exit;
    }

} catch (Exception $e) {

    $conexion->rollback();

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

?>