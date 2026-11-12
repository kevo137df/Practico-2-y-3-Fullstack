<?php
namespace App\Models\Auth;
use PDO;

/**
 * Consultas sobre la entidad "usuarios" del MER:
 * id_usuario (PK), nombre, email, contrasena, rol
 */
class AuthModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Busca un usuario por su nombre O por su email.
     * Devuelve el registro o false si no hay exactamente uno.
     */
    public function buscarPorNombreOEmail($valor) {
        $sql = "SELECT id_usuario, nombre, email, contrasena, rol
                FROM usuarios
                WHERE nombre = :nombre OR email = :email
                LIMIT 2";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':nombre' => $valor, ':email' => $valor]);
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return count($filas) === 1 ? $filas[0] : false;
    }

    /** Busca un usuario por su id (para confirmar la sesión contra la BD). */
    public function buscarPorId($id) {
        $sql = "SELECT id_usuario, nombre, email, rol
                FROM usuarios
                WHERE id_usuario = :id
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /** true si ya existe un usuario con ese nombre o ese email. */
    public function existe($nombre, $email) {
        $stmt = $this->db->prepare(
            'SELECT id_usuario FROM usuarios WHERE nombre = :nombre OR email = :email LIMIT 1'
        );
        $stmt->execute([':nombre' => $nombre, ':email' => $email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    /** Crea un usuario. $contrasenaHash viene de password_hash(). Devuelve el id nuevo. */
    public function crear($nombre, $email, $contrasenaHash, $rol = 'Comprador') {
        $sql = "INSERT INTO usuarios (nombre, email, contrasena, rol)
                VALUES (:nombre, :email, :contrasena, :rol)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'     => $nombre,
            ':email'      => $email,
            ':contrasena' => $contrasenaHash,
            ':rol'        => $rol
        ]);
        return (int) $this->db->lastInsertId();
    }
}
