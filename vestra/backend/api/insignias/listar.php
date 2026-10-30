
<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';

function responder($success, $mensaje, $extra = []) {
    echo json_encode(
        array_merge([
            "success" => $success,
            "mensaje" => $mensaje
        ], $extra),
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

if (!isset($_SESSION["id_usuario"])) {
    http_response_code(401);
    responder(false, "Debes iniciar sesión.");
}

$idProfesor = (int) $_SESSION["id_usuario"];
$idClub = filter_input(INPUT_GET, "id_club", FILTER_VALIDATE_INT);

if (!$idClub || $idClub < 1) {
    http_response_code(400);
    responder(false, "El club seleccionado no es válido.");
}

try {
    // Confirmar que el club pertenece al profesor conectado.
    $stmtClub = $conexion->prepare(
        "SELECT id_club
         FROM club
         WHERE id_club = ? AND id_profesor = ?
         LIMIT 1"
    );

    if (!$stmtClub) {
        throw new Exception("No se pudo preparar la consulta del club.");
    }

    $stmtClub->bind_param("ii", $idClub, $idProfesor);
    $stmtClub->execute();

    $club = $stmtClub->get_result()->fetch_assoc();
    $stmtClub->close();

    if (!$club) {
        http_response_code(403);
        responder(false, "No tienes permiso para gestionar este club.");
    }

    // Listar las insignias del profesor para ese club.
    $stmt = $conexion->prepare(
        "SELECT
            i.id_insignia,
            i.nombre,
            i.descripcion,
            i.foto,
            i.estado,
            i.fecha_aprobado,
            i.id_club,
            COUNT(ui.id_UsuarioInsignia) AS total_asignados
         FROM insignia i
         LEFT JOIN usuarioinsignia ui
            ON ui.id_insignia = i.id_insignia
         WHERE i.id_profe = ?
           AND i.id_club = ?
         GROUP BY
            i.id_insignia,
            i.nombre,
            i.descripcion,
            i.foto,
            i.estado,
            i.fecha_aprobado,
            i.id_club
         ORDER BY i.id_insignia DESC"
    );

    if (!$stmt) {
        throw new Exception("No se pudo preparar la consulta de insignias.");
    }

    $stmt->bind_param("ii", $idProfesor, $idClub);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $insignias = [];

    while ($fila = $resultado->fetch_assoc()) {
        $fila["total_asignados"] = (int) $fila["total_asignados"];
        $insignias[] = $fila;
    }

    $stmt->close();

    responder(true, "Insignias consultadas correctamente.", [
        "insignias" => $insignias
    ]);

} catch (Throwable $e) {
    error_log("Error al listar insignias: " . $e->getMessage());

    http_response_code(500);
    responder(false, "No se pudieron cargar las insignias.");
}