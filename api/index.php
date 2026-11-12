<?php
// api/index.php — punto de entrada único de la API (todo /api/... llega acá por api/.htaccess)

// Los errores de PHP van al log (docker logs <APP_NAME>_app), no a la respuesta:
// si se imprimieran, romperían el JSON que espera el front.
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// 1. Iniciamos buffer para atrapar cualquier error de texto plano o warnings de PHP
ob_start();

// 2. Cabeceras estrictas para API-Driven
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejo de peticiones preflight (CORS) de los navegadores
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/autoload.php';

// 3. Cargar las variables del archivo .env (si existe; con Docker vienen del docker-compose.yml)
\App\Utils\EnvLoader::load(__DIR__ . '/.env');

require_once __DIR__ . '/config/database.php';

$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false;

// 4. Intentar conexión aislada
try {
    $db = (new Database())->getConnection();
} catch (Throwable $e) {
    ob_clean();
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    $clientMsg = $isLocal
        ? ('Error crítico de BD: ' . $e->getMessage())
        : 'Error crítico de BD: no se pudo conectar al servidor de datos';
    echo json_encode([
        'status' => 'error',
        'message' => $clientMsg,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ==============================================================================
// LÓGICA HÍBRIDA DE ENRUTAMIENTO (Local vs Producción)
// ==============================================================================
// Si estamos en local, la URL web contiene la subcarpeta.
// Si estamos en producción (NGINX), la URL web siempre empieza desde /api.
$base = $isLocal ? rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') : '/api';

// Instanciamos el router inyectando el base path correcto y la DB
$router = new \App\Utils\Router($base, $db);

// Cargamos todas las definiciones de rutas
require_once __DIR__ . '/routes.php';

// 5. Limpiamos cualquier echo/espacio en blanco accidental antes de ejecutar
$basura = ob_get_clean();

// 6. Lanzar la aplicación
try {
    $router->run();
} catch (Throwable $e) {
    error_log('API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
}
