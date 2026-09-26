<?php

session_start();

include '../../config/conexion.php';

require_once "../../../vendor/autoload.php";

use Dompdf\Dompdf;
use Dompdf\Options;


// verificar sesion
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "error" => "No hay una sesión activa"
    ]);
    exit;
}

$id_profesor = $_SESSION['id_usuario'];


// id del club
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode([
        "success" => false,
        "error" => "Falta el ID del club"
    ]);
    exit;
}

$id_club = intval($_GET['id']);


//verificra que el club es del profe
$sql = "SELECT id_club, Nombre, Descripcion
        FROM club
        WHERE id_club = ?
        AND id_profesor = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_club, $id_profesor);
$stmt->execute();

$resultado = $stmt->get_result();
$club = $resultado->fetch_assoc();

if (!$club) {
    echo json_encode([
        "success" => false,
        "error" => "No tienes permiso para acceder a este club"
    ]);
    exit;
}


//resumen general
// Miembros
$sql = "SELECT COUNT(*) AS total
        FROM inscripcion
        WHERE id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$total_miembros = $stmt->get_result()->fetch_assoc()['total'];


// Solicitudes pendientes
$sql = "SELECT COUNT(*) AS total
        FROM solicitudclub
        WHERE id_club = ?
        AND estado = 'Pendiente'";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$solicitudes_pendientes = $stmt->get_result()->fetch_assoc()['total'];


// Publicaciones
$sql = "SELECT COUNT(*) AS total
        FROM publicacion
        WHERE id_club = ?
        AND Estado <> 'Eliminada'";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$total_publicaciones = $stmt->get_result()->fetch_assoc()['total'];


// Likes
$sql = "SELECT COUNT(*) AS total
        FROM likepublicacion lp
        INNER JOIN publicacion p
            ON lp.id_publicacion = p.id_publicacion
        WHERE p.id_club = ?
        AND p.Estado <> 'Eliminada'";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$total_likes = $stmt->get_result()->fetch_assoc()['total'];


// Comentarios
$sql = "SELECT COUNT(*) AS total
        FROM comentario c
        INNER JOIN publicacion p
            ON c.id_publicacion = p.id_publicacion
        WHERE p.id_club = ?
        AND p.Estado <> 'Eliminada'";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$total_comentarios = $stmt->get_result()->fetch_assoc()['total'];


// Eventos
$sql = "SELECT COUNT(*) AS total
        FROM evento_club
        WHERE id_club = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$total_eventos = $stmt->get_result()->fetch_assoc()['total'];


//miembros
$sql = "SELECT
            u.Nombre,
            u.Correo,
            i.fecha_ingreso,
            i.anio_ingreso
        FROM inscripcion i
        INNER JOIN usuario u
            ON i.id_usuario = u.id_usuario
        WHERE i.id_club = ?
        ORDER BY u.Nombre ASC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$miembros = $stmt->get_result();


// solicitudes pendientes
$sql = "SELECT
            s.carnet,
            s.correo,
            s.seccion,
            s.fecha,
            u.Nombre
        FROM solicitudclub s
        INNER JOIN usuario u
            ON s.id_usuario = u.id_usuario
        WHERE s.id_club = ?
        AND s.estado = 'Pendiente'
        ORDER BY s.fecha DESC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$solicitudes = $stmt->get_result();


// publicaciones
$sql = "SELECT
            p.id_publicacion,
            p.Texto,
            p.Fecha,
            COUNT(DISTINCT lp.id_publicacion) AS likes,
            COUNT(DISTINCT c.id_publicacion) AS comentarios
        FROM publicacion p
        LEFT JOIN likepublicacion lp
            ON p.id_publicacion = lp.id_publicacion
        LEFT JOIN comentario c
            ON p.id_publicacion = c.id_publicacion
        WHERE p.id_club = ?
        AND p.Estado <> 'Eliminada'
        GROUP BY
            p.id_publicacion,
            p.Texto,
            p.Fecha
        ORDER BY p.Fecha DESC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$publicaciones = $stmt->get_result();


// eventos
$sql = "SELECT
            id_evento,
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin,
            tipo
        FROM evento_club
        WHERE id_club = ?
        ORDER BY fecha DESC, hora_inicio DESC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$eventos = $stmt->get_result();


// asistencia
$sql = "SELECT
            e.id_evento,
            e.titulo,
            e.fecha,
            COUNT(a.id_asistencia) AS registrados,
            SUM(CASE WHEN a.estado = 'Presente' THEN 1 ELSE 0 END) AS presentes,
            SUM(CASE WHEN a.estado = 'Ausente' THEN 1 ELSE 0 END) AS ausentes,
            SUM(CASE WHEN a.estado = 'Justificado' THEN 1 ELSE 0 END) AS justificados
        FROM evento_club e
        LEFT JOIN asistencia a
            ON e.id_evento = a.id_evento
        WHERE e.id_club = ?
        GROUP BY
            e.id_evento,
            e.titulo,
            e.fecha
        ORDER BY e.fecha DESC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$asistencias = $stmt->get_result();


// crecimeinto de miembtros
$sql = "SELECT
            DATE_FORMAT(fecha_ingreso, '%Y-%m') AS periodo,
            DATE_FORMAT(fecha_ingreso, '%M %Y') AS mes,
            COUNT(*) AS nuevos_miembros
        FROM inscripcion
        WHERE id_club = ?
        GROUP BY
            DATE_FORMAT(fecha_ingreso, '%Y-%m'),
            DATE_FORMAT(fecha_ingreso, '%M %Y')
        ORDER BY periodo ASC";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_club);
$stmt->execute();

$crecimiento = $stmt->get_result();


// comparacion mensual
$inicio_mes_actual = date('Y-m-01');
$inicio_mes_anterior = date('Y-m-01', strtotime('-1 month'));
$fin_mes_anterior = date('Y-m-t', strtotime('-1 month'));


// Miembros nuevos
$sql = "SELECT COUNT(*) AS total
        FROM inscripcion
        WHERE id_club = ?
        AND fecha_ingreso >= ?
        AND fecha_ingreso < ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param(
    "iss",
    $id_club,
    $inicio_mes_actual,
    $inicio_mes_anterior
);

$stmt->execute();

$miembros_mes_actual = $stmt->get_result()->fetch_assoc()['total'];


// Eventos mes actual
$sql = "SELECT COUNT(*) AS total
        FROM evento_club
        WHERE id_club = ?
        AND fecha >= ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param(
    "is",
    $id_club,
    $inicio_mes_actual
);

$stmt->execute();

$eventos_mes_actual = $stmt->get_result()->fetch_assoc()['total'];


// Eventos mes anterior
$sql = "SELECT COUNT(*) AS total
        FROM evento_club
        WHERE id_club = ?
        AND fecha BETWEEN ? AND ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param(
    "iss",
    $id_club,
    $inicio_mes_anterior,
    $fin_mes_anterior
);

$stmt->execute();

$eventos_mes_anterior = $stmt->get_result()->fetch_assoc()['total'];


// html para exportar
function escapar($texto)
{
    return htmlspecialchars(
        (string)$texto,
        ENT_QUOTES,
        'UTF-8'
    );
}


$html = '
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<style>


@page {
    margin: 35px 45px;
}

body {
    font-family: DejaVu Sans, sans-serif;
    font-size: 10px;
    color: #2c3a4d;
    background: #fff8ec;
    line-height: 1.45;
}


.header {
    background: #456597;
    color: #ffffff;
    padding: 22px 25px;
    border-radius: 14px;
    margin-bottom: 28px;
}

.header .eyebrow {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #e0f6f8;
    font-weight: bold;
    margin-bottom: 5px;
}

.header h1 {
    font-size: 24px;
    margin: 0 0 4px 0;
    color: #ffffff;
}

.header h2 {
    font-size: 12px;
    margin: 0 0 12px 0;
    color: #e4ebf6;
    border: none;
}

.header .description {
    color: #e4ebf6;
    font-size: 9px;
}

.header .date {
    margin-top: 12px;
    font-size: 8px;
    color: #bdd9d6;
}


.section-title {
    font-size: 14px;
    color: #334c72;
    margin-top: 25px;
    margin-bottom: 13px;
    padding-bottom: 7px;
    border-bottom: 2px solid #e0f6f8;
}

.section-title span {
    color: #0dadc5;
}


/*
   Este espacio evita que las tablas queden
   pegadas visualmente a los bordes.
*/

.table-container {
    margin-left: 8px;
    margin-right: 8px;
}

.summary-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 7px;
    margin: 0;
}

.summary-card {
    background: #ffffff;
    border: 1px solid #eef7f5;
    border-radius: 10px;
    padding: 13px 8px;
    text-align: center;
}

.summary-label {
    color: #5a6b7a;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: .5px;
}

.summary-number {
    color: #0dadc5;
    font-size: 20px;
    font-weight: bold;
    margin-top: 3px;
}

.summary-card.yellow .summary-number {
    color: #dba300;
}

.summary-card.blue .summary-number {
    color: #456597;
}

.summary-card.green .summary-number {
    color: #35a97b;
}


.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    background: #ffffff;
    border: 1px solid #e0f6f8;
}

.data-table th {
    background: #456597;
    color: #ffffff;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: .3px;
    padding: 8px 7px;
    border: none;
}

.data-table td {
    padding: 7px;
    border-bottom: 1px solid #eef7f5;
    color: #2c3a4d;
}

.data-table tr:nth-child(even) td {
    background: #eef7f5;
}

.data-table tr:last-child td {
    border-bottom: none;
}


.highlight {
    background: #e0f6f8;
    border-left: 4px solid #0dadc5;
    padding: 10px 12px;
    margin: 10px 8px;
}

.highlight-yellow {
    background: #fff3cf;
    border-left: 4px solid #ffc92b;
    padding: 10px 12px;
    margin: 10px 8px;
}


.badge {
    display: inline-block;
    padding: 3px 7px;
    border-radius: 10px;
    font-size: 7px;
    font-weight: bold;
}

.badge-blue {
    background: #e4ebf6;
    color: #334c72;
}

.badge-turquoise {
    background: #e0f6f8;
    color: #0a8a9e;
}

.badge-yellow {
    background: #fff3cf;
    color: #dba300;
}

.badge-green {
    background: #e9f7f0;
    color: #35a97b;
}


.comparison-current {
    background: #e0f6f8;
    color: #0a8a9e;
    font-weight: bold;
}

.comparison-previous {
    background: #e4ebf6;
    color: #334c72;
    font-weight: bold;
}


.page-break {
    page-break-before: always;
}

.keep-together {
    page-break-inside: avoid;
}


.footer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #bdd9d6;
    text-align: center;
    font-size: 8px;
    color: #96a3b0;
}

.footer strong {
    color: #0dadc5;
}

</style>

</head>

<body>


<div class="header">

    <div class="eyebrow">
        VESTRA · REPORTE DEL CLUB
    </div>

    <h1>
        ' . escapar($club['Nombre']) . '
    </h1>

    <h2>
        Resumen de actividad y gestión
    </h2>

    <div class="description">
        ' . escapar($club['Descripcion']) . '
    </div>

    <div class="date">
        Generado el ' . date('d/m/Y H:i') . '
    </div>

</div>



<h2 class="section-title">
    <span>●</span> Resumen general
</h2>

<table class="summary-table">

<tr>

<td class="summary-card">
    <div class="summary-label">Miembros</div>
    <div class="summary-number">' . $total_miembros . '</div>
</td>

<td class="summary-card yellow">
    <div class="summary-label">Solicitudes pendientes</div>
    <div class="summary-number">' . $solicitudes_pendientes . '</div>
</td>

<td class="summary-card blue">
    <div class="summary-label">Publicaciones</div>
    <div class="summary-number">' . $total_publicaciones . '</div>
</td>

<td class="summary-card green">
    <div class="summary-label">Eventos</div>
    <div class="summary-number">' . $total_eventos . '</div>
</td>

</tr>

<tr>

<td class="summary-card yellow">
    <div class="summary-label">Likes</div>
    <div class="summary-number">' . $total_likes . '</div>
</td>

<td class="summary-card blue">
    <div class="summary-label">Comentarios</div>
    <div class="summary-number">' . $total_comentarios . '</div>
</td>

<td></td>
<td></td>

</tr>

</table>


<h2 class="section-title">
    <span>●</span> Miembros
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Nombre</th>
    <th>Correo</th>
    <th>Fecha de ingreso</th>
    <th>Año</th>
</tr>
';

while ($miembro = $miembros->fetch_assoc()) {

    $html .= '
    <tr>
        <td>' . escapar($miembro['Nombre']) . '</td>
        <td>' . escapar($miembro['Correo']) . '</td>
        <td>' . escapar($miembro['fecha_ingreso']) . '</td>
        <td>' . escapar($miembro['anio_ingreso']) . '</td>
    </tr>
    ';
}


$html .= '

</table>

</div>



<h2 class="section-title">
    <span>●</span> Solicitudes pendientes
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Nombre</th>
    <th>Carnet</th>
    <th>Correo</th>
    <th>Sección</th>
    <th>Fecha</th>
</tr>
';

while ($solicitud = $solicitudes->fetch_assoc()) {

    $html .= '
    <tr>
        <td>' . escapar($solicitud['Nombre']) . '</td>
        <td>' . escapar($solicitud['carnet']) . '</td>
        <td>' . escapar($solicitud['correo']) . '</td>
        <td>' . escapar($solicitud['seccion']) . '</td>
        <td>' . escapar($solicitud['fecha']) . '</td>
    </tr>
    ';
}


$html .= '

</table>

</div>


<div class="page-break"></div>


<h2 class="section-title">
    <span>●</span> Publicaciones
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Fecha</th>
    <th>Publicación</th>
    <th>Likes</th>
    <th>Comentarios</th>
</tr>
';

while ($publicacion = $publicaciones->fetch_assoc()) {

    $texto = $publicacion['Texto'];

    if (strlen($texto) > 100) {
        $texto = substr($texto, 0, 100) . '...';
    }

    $html .= '
    <tr>
        <td>' . escapar($publicacion['Fecha']) . '</td>
        <td>' . escapar($texto) . '</td>
        <td>' . $publicacion['likes'] . '</td>
        <td>' . $publicacion['comentarios'] . '</td>
    </tr>
    ';
}


$html .= '

</table>

</div>



<h2 class="section-title">
    <span>●</span> Eventos
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Fecha</th>
    <th>Hora</th>
    <th>Evento</th>
    <th>Tipo</th>
</tr>
';

while ($evento = $eventos->fetch_assoc()) {

    $hora = '';

    if (!empty($evento['hora_inicio'])) {

        $hora = $evento['hora_inicio'];

        if (!empty($evento['hora_fin'])) {
            $hora .= ' - ' . $evento['hora_fin'];
        }

    }

    $html .= '
    <tr>
        <td>' . escapar($evento['fecha']) . '</td>
        <td>' . escapar($hora) . '</td>
        <td>' . escapar($evento['titulo']) . '</td>
        <td>' . escapar($evento['tipo']) . '</td>
    </tr>
    ';
}


$html .= '

</table>

</div>



<h2 class="section-title">
    <span>●</span> Asistencia
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Evento</th>
    <th>Fecha</th>
    <th>Registrados</th>
    <th>Presentes</th>
    <th>Ausentes</th>
    <th>Justificados</th>
    <th>% asistencia</th>
</tr>
';

while ($asistencia = $asistencias->fetch_assoc()) {

    $registrados = (int)$asistencia['registrados'];
    $presentes = (int)$asistencia['presentes'];

    $porcentaje = 0;

    if ($registrados > 0) {

        $porcentaje = round(
            ($presentes / $registrados) * 100,
            1
        );

    }

    $html .= '
    <tr>
        <td>' . escapar($asistencia['titulo']) . '</td>
        <td>' . escapar($asistencia['fecha']) . '</td>
        <td>' . $registrados . '</td>
        <td>' . $presentes . '</td>
        <td>' . (int)$asistencia['ausentes'] . '</td>
        <td>' . (int)$asistencia['justificados'] . '</td>
        <td>' . $porcentaje . '%</td>
    </tr>
    ';
}


$html .= '

</table>

</div>


<h2 class="section-title">
    <span>●</span> Crecimiento de miembros
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Mes</th>
    <th>Nuevos miembros</th>
</tr>
';

$total_acumulado = 0;

while ($fila = $crecimiento->fetch_assoc()) {

    $total_acumulado += (int)$fila['nuevos_miembros'];

    $html .= '
    <tr>
        <td>' . escapar($fila['mes']) . '</td>
        <td>' . (int)$fila['nuevos_miembros'] . '</td>
    </tr>
    ';
}


$html .= '

</table>

</div>



<h2 class="section-title">
    <span>●</span> Comparación mensual
</h2>

<div class="table-container">

<table class="data-table">

<tr>
    <th>Indicador</th>
    <th>Mes actual</th>
    <th>Mes anterior</th>
</tr>

<tr>
    <td>Nuevos miembros</td>
    <td class="comparison-current">
        ' . $miembros_mes_actual . '
    </td>
    <td class="comparison-previous">
        —
    </td>
</tr>

<tr>
    <td>Eventos</td>
    <td class="comparison-current">
        ' . $eventos_mes_actual . '
    </td>
    <td class="comparison-previous">
        ' . $eventos_mes_anterior . '
    </td>
</tr>

</table>

</div>



<div class="footer">

    Reporte generado automáticamente por
    <strong>Vestra</strong>.

</div>


</body>
</html>
';


// general el pdf
$options = new Options();

$options->set(
    'defaultFont',
    'DejaVu Sans'
);

$dompdf = new Dompdf($options);

$dompdf->loadHtml($html);

$dompdf->setPaper(
    'A4',
    'portrait'
);

$dompdf->render();


// =descargarlo
$nombre_archivo =
    'reporte_' .
    preg_replace(
        '/[^A-Za-z0-9_-]/',
        '_',
        $club['Nombre']
    ) .
    '.pdf';

$dompdf->stream(
    $nombre_archivo,
    [
        'Attachment' => true
    ]
);

exit;
?>