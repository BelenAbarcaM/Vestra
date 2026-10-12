
<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

include '../../config/conexion.php';

// Verificar sesión y rol de profesor.
if (
    !isset($_SESSION['id_usuario']) ||
    !isset($_SESSION['id_tipo_usuario']) ||
    (int) $_SESSION['id_tipo_usuario'] !== 2
) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "mensaje" => "Debes iniciar sesión como profesor."
    ]);
    exit;
}

$conexion->begin_transaction();

$rutaImagenCreada = null;

try {
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $idProfe = (int) $_SESSION['id_usuario'];

    if ($nombre === '' || $descripcion === '') {
        throw new Exception(
            "El nombre y la descripción son obligatorios."
        );
    }

    // Procesar imagen del club.
    $nombreImagen = null;

    if (
        isset($_FILES['imagen']) &&
        $_FILES['imagen']['error'] !== UPLOAD_ERR_NO_FILE
    ) {
        if ($_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("No se pudo recibir la imagen.");
        }

        $directorioImagenes = __DIR__ . '/../../../uploads/clubes/';

        if (
            !is_dir($directorioImagenes) &&
            !mkdir($directorioImagenes, 0775, true)
        ) {
            throw new Exception(
                "No se pudo crear la carpeta de imágenes."
            );
        }

        $extension = strtolower(
            pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION)
        );

        $extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array($extension, $extensionesPermitidas, true)) {
            throw new Exception(
                "La imagen debe ser JPG, JPEG, PNG o WEBP."
            );
        }

        $nombreImagen = bin2hex(random_bytes(16)) . '.' . $extension;
        $rutaImagenCreada = $directorioImagenes . $nombreImagen;

        if (
            !move_uploaded_file(
                $_FILES['imagen']['tmp_name'],
                $rutaImagenCreada
            )
        ) {
            throw new Exception("No se pudo guardar la imagen.");
        }
    }

    // 1. Crear club.
    $sqlClub = "
        INSERT INTO club
            (Nombre, Descripcion, Foto_url, id_profesor)
        VALUES (?, ?, ?, ?)
    ";

    $stmtClub = $conexion->prepare($sqlClub);
    $stmtClub->bind_param(
        "sssi",
        $nombre,
        $descripcion,
        $nombreImagen,
        $idProfe
    );
    $stmtClub->execute();

    $idClub = (int) $conexion->insert_id;
    $stmtClub->close();

    // 2. Crear automáticamente el foro de este club.
    $sqlForo = "INSERT INTO foro (id_club) VALUES (?)";

    $stmtForo = $conexion->prepare($sqlForo);
    $stmtForo->bind_param("i", $idClub);
    $stmtForo->execute();
    $idForo = (int) $conexion->insert_id;
    $stmtForo->close();

    // 3. Guardar horarios.
    if (isset($_POST['horarios'])) {
        $horarios = json_decode($_POST['horarios'], true);

        if (!is_array($horarios)) {
            throw new Exception("El formato de los horarios no es válido.");
        }

        $sqlHorario = "
            INSERT INTO horario_club
                (id_club, dia, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?)
        ";

        $stmtHorario = $conexion->prepare($sqlHorario);

        foreach ($horarios as $horario) {
            $dia = $horario['dia'] ?? '';
            $inicio = $horario['hora_inicio'] ?? '';
            $fin = $horario['hora_fin'] ?? '';

            if ($dia === '' || $inicio === '' || $fin === '') {
                continue;
            }

            $stmtHorario->bind_param(
                "isss",
                $idClub,
                $dia,
                $inicio,
                $fin
            );
            $stmtHorario->execute();
        }

        $stmtHorario->close();
    }

    // 4. Guardar cuotas.
    if (isset($_POST['cuotas'])) {
        $cuotas = json_decode($_POST['cuotas'], true);

        if (!is_array($cuotas)) {
            throw new Exception("El formato de las cuotas no es válido.");
        }

        $sqlCuota = "
            INSERT INTO cuota_club (id_club, curso, valor)
            VALUES (?, ?, ?)
        ";

        $stmtCuota = $conexion->prepare($sqlCuota);

        foreach ($cuotas as $cuota) {
            $curso = trim($cuota['curso'] ?? '');
            $valor = (float) ($cuota['valor'] ?? 0);

            if ($curso === '') {
                continue;
            }

            $stmtCuota->bind_param("isd", $idClub, $curso, $valor);
            $stmtCuota->execute();
        }

        $stmtCuota->close();
    }

    // 5. Guardar requisitos.
    if (isset($_POST['requisitos'])) {
        $requisitos = json_decode($_POST['requisitos'], true);

        if (!is_array($requisitos)) {
            throw new Exception(
                "El formato de los requisitos no es válido."
            );
        }

        $sqlRequisito = "
            INSERT INTO requisito_club (id_club, requisito)
            VALUES (?, ?)
        ";

        $stmtReq = $conexion->prepare($sqlRequisito);

        foreach ($requisitos as $requisito) {
            $requisito = trim($requisito);

            if ($requisito === '') {
                continue;
            }

            $stmtReq->bind_param("is", $idClub, $requisito);
            $stmtReq->execute();
        }

        $stmtReq->close();
    }

    // Guardar todas las operaciones juntas.
    $conexion->commit();

    echo json_encode([
        "success" => true,
        "mensaje" => "Club y foro creados correctamente.",
        "id_club" => $idClub,
        "id_foro" => $idForo
    ]);

} catch (Throwable $e) {
    $conexion->rollback();

    // Evitar dejar una imagen huérfana si falla la operación.
    if (
        $rutaImagenCreada !== null &&
        file_exists($rutaImagenCreada)
    ) {
        unlink($rutaImagenCreada);
    }

    error_log("Error al crear club y foro: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudo crear el club y su foro."
    ]);
}
?>