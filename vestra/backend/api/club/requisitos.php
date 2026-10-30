
<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();

require_once __DIR__ . '/../../config/conexion.php';

function responder($datos, $estado = 200) {
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder([
        "success" => false,
        "mensaje" => "Método no permitido."
    ], 405);
}

$idClub = filter_input(INPUT_GET, "id_club", FILTER_VALIDATE_INT);

if (!$idClub || $idClub < 1) {
    responder([
        "success" => false,
        "mensaje" => "El identificador del club no es válido."
    ], 400);
}

$sql = "SELECT id_requisito, requisito
        FROM requisito_club
        WHERE id_club = ?
        ORDER BY id_requisito";

$stmt = $conexion->prepare($sql);

if (!$stmt) {
    responder([
        "success" => false,
        "mensaje" => "No se pudieron consultar los requisitos."
    ], 500);
}

$stmt->bind_param("i", $idClub);
$stmt->execute();

$resultado = $stmt->get_result();
$requisitos = [];

while ($fila = $resultado->fetch_assoc()) {
    $requisitos[] = [
        "id_requisito" => (int) $fila["id_requisito"],
        "requisito" => $fila["requisito"]
    ];
}

$stmt->close();

responder([
    "success" => true,
    "requisitos" => $requisitos
]);