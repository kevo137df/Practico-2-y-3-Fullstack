<?php
namespace App\Controllers;

use App\Models\Auth\AuthModel;
use App\Utils\Sesion;

class AuthController {
    private $db;
    private $model;

    public function __construct($db) {
        $this->db = $db;
        $this->model = new AuthModel($db);
    }

    private function responder($codigo, $datos) {
        http_response_code($codigo);
        echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    }

    /** Cuerpo JSON de la petición como array (vacío si no vino o está roto). */
    private function entrada() {
        $datos = json_decode(file_get_contents('php://input'), true);
        return is_array($datos) ? $datos : [];
    }

    // POST /login  { "nombre": "usuario o email", "password": "..." }
    public function login() {
        $entrada  = $this->entrada();
        $nombre   = trim((string) ($entrada['nombre'] ?? ''));
        $password = (string) ($entrada['password'] ?? '');

        if ($nombre === '' || $password === '') {
            return $this->responder(400, [
                'status'  => 'error',
                'message' => 'Ingresá tu usuario y contraseña'
            ]);
        }

        $usuario = $this->model->buscarPorNombreOEmail($nombre);

        // Mismo mensaje si falla el usuario o la contraseña (no se revela cuál)
        if (!$usuario || !password_verify($password, $usuario['contrasena'])) {
            return $this->responder(401, [
                'status'  => 'error',
                'message' => 'Usuario o contraseña incorrectos'
            ]);
        }

        Sesion::iniciar();
        session_regenerate_id(true);
        $_SESSION['usuario'] = [
            'id'     => (int) $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'rol'    => $usuario['rol']
        ];

        return $this->responder(200, [
            'status'  => 'success',
            'message' => 'Sesión iniciada',
            'usuario' => $_SESSION['usuario']
        ]);
    }

    // POST /registro  { "nombre", "email", "password", "confirm_password" }
    public function registro() {
        $entrada  = $this->entrada();
        $nombre   = trim((string) ($entrada['nombre'] ?? ''));
        $email    = trim((string) ($entrada['email'] ?? ''));
        $password = (string) ($entrada['password'] ?? '');
        $confirm  = (string) ($entrada['confirm_password'] ?? '');

        if ($nombre === '' || $email === '' || $password === '') {
            return $this->responder(400, ['status' => 'error', 'message' => 'Completá todos los campos']);
        }
        if (mb_strlen($nombre) > 60) {
            return $this->responder(400, ['status' => 'error', 'message' => 'El nombre de usuario es demasiado largo (máximo 60 caracteres)']);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 120) {
            return $this->responder(400, ['status' => 'error', 'message' => 'El correo electrónico no es válido']);
        }
        if ($password !== $confirm) {
            return $this->responder(400, ['status' => 'error', 'message' => 'Las contraseñas no coinciden']);
        }
        if (strlen($password) < 6) {
            return $this->responder(400, ['status' => 'error', 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        }
        if ($this->model->existe($nombre, $email)) {
            return $this->responder(409, ['status' => 'error', 'message' => 'El correo electrónico o el usuario ya están registrados']);
        }

        try {
            // Rol fijo para cuentas nuevas: nunca se recibe desde el cliente
            $this->model->crear($nombre, $email, password_hash($password, PASSWORD_DEFAULT), 'Comprador');
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') { // clave duplicada (dos registros a la vez)
                return $this->responder(409, ['status' => 'error', 'message' => 'El correo electrónico o el usuario ya están registrados']);
            }
            throw $e;
        }

        return $this->responder(201, ['status' => 'success', 'message' => '¡Registro exitoso! Ya podés iniciar sesión.']);
    }

    // GET /me  -> devuelve el usuario de la sesión, confirmado contra la base de datos (o 401)
    public function me() {
        $sesion = Sesion::usuario();
        if (!$sesion) {
            return $this->responder(401, [
                'status'  => 'error',
                'message' => 'No hay sesión iniciada'
            ]);
        }

        $usuario = $this->model->buscarPorId((int) $sesion['id']);
        if (!$usuario) {
            // El usuario ya no existe en la base de datos
            Sesion::cerrar();
            return $this->responder(401, [
                'status'  => 'error',
                'message' => 'No hay sesión iniciada'
            ]);
        }

        // Refrescamos nombre y rol desde la BD por si cambiaron
        $_SESSION['usuario'] = [
            'id'     => (int) $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'rol'    => $usuario['rol']
        ];

        return $this->responder(200, [
            'status'  => 'success',
            'usuario' => $_SESSION['usuario'] + ['email' => $usuario['email']]
        ]);
    }

    // POST /logout
    public function logout() {
        Sesion::cerrar();
        return $this->responder(200, [
            'status'  => 'success',
            'message' => 'Sesión cerrada'
        ]);
    }
}
