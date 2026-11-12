<?php
// Sirve dashboard.html SOLO si hay una sesión de Administrador.
// El .htaccess de la raíz manda acá cada pedido a /front/dist/pages/dashboard.html.
// Si no hay permiso, redirige (sin sesión -> login; con sesión de otro rol -> página principal).
require_once __DIR__ . '/autoload.php';

$uri   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pos   = strpos($uri, '/front/');
$front = ($pos !== false ? substr($uri, 0, $pos) : '') . '/front';

$usuario = \App\Utils\Sesion::usuario();

if (!$usuario) {
    header('Location: ' . $front . '/dist/pages/login.html');
    exit;
}
if (!\App\Utils\Sesion::esAdmin($usuario)) {
    header('Location: ' . $front . '/index.html');
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store');
readfile(__DIR__ . '/../front/dist/pages/dashboard.html');
