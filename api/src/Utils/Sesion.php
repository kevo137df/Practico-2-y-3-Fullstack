<?php
namespace App\Utils;

/**
 * Manejo centralizado de la sesión y de los permisos por rol.
 * Toda la seguridad se valida acá, en el servidor (el JS del front es solo comodidad).
 */
class Sesion {
    public static function iniciar() {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_start();
        }
    }

    /** Devuelve el usuario autenticado ['id','nombre','rol'] o null. */
    public static function usuario() {
        self::iniciar();
        return $_SESSION['usuario'] ?? null;
    }

    public static function esAdmin($usuario = null) {
        $usuario = $usuario ?? self::usuario();
        return !empty($usuario) && strtolower((string) $usuario['rol']) === 'administrador';
    }

    /** Destruye la sesión y borra la cookie. */
    public static function cerrar() {
        self::iniciar();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    /**
     * Corta la petición si no hay sesión (401) o si el rol no es Administrador (403).
     * Se usa al principio de cada endpoint administrativo.
     */
    public static function exigirAdmin() {
        $usuario = self::usuario();
        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Debés iniciar sesión'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if (!self::esAdmin($usuario)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No tenés permisos de administrador'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        return $usuario;
    }
}
