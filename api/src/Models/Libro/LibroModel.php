<?php
namespace App\Models\Libro;
use PDO;

/**
 * Consultas sobre la entidad "libros/articulos" del MER (tabla libros_articulos):
 * id_libros_articulos (PK), titulo, genero, autor, precio, anio, portada
 * + id_usuario (FK de la relación "gestiona": el usuario que lo gestiona)
 */
class LibroModel {
    private $db;

    private const COLUMNAS = 'id_libros_articulos, titulo, genero, autor, precio, anio, portada, id_usuario';

    public function __construct($db) {
        $this->db = $db;
    }

    /** Todos los libros/artículos (en el orden en que se cargaron). */
    public function listar() {
        return $this->db
            ->query('SELECT ' . self::COLUMNAS . ' FROM libros_articulos ORDER BY id_libros_articulos ASC')
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $stmt = $this->db->prepare(
            'SELECT ' . self::COLUMNAS . ' FROM libros_articulos WHERE id_libros_articulos = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function contar() {
        return (int) $this->db->query('SELECT COUNT(*) FROM libros_articulos')->fetchColumn();
    }

    /** Crea un libro/artículo. $idUsuario = usuario que lo gestiona (relación "gestiona"). */
    public function crear(array $d, $idUsuario) {
        $sql = "INSERT INTO libros_articulos (titulo, genero, autor, precio, anio, portada, id_usuario)
                VALUES (:titulo, :genero, :autor, :precio, :anio, :portada, :id_usuario)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':titulo'     => $d['titulo'],
            ':genero'     => $d['genero'],
            ':autor'      => $d['autor'],
            ':precio'     => $d['precio'],
            ':anio'       => $d['anio'],
            ':portada'    => $d['portada'],
            ':id_usuario' => $idUsuario
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** Modifica los datos de un libro/artículo (no cambia quién lo gestiona). */
    public function actualizar($id, array $d) {
        $sql = "UPDATE libros_articulos
                SET titulo = :titulo, genero = :genero, autor = :autor,
                    precio = :precio, anio = :anio, portada = :portada
                WHERE id_libros_articulos = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':titulo'     => $d['titulo'],
            ':genero'     => $d['genero'],
            ':autor'      => $d['autor'],
            ':precio'     => $d['precio'],
            ':anio'       => $d['anio'],
            ':portada'    => $d['portada'],
            ':id'         => $id
        ]);
    }

    public function eliminar($id) {
        $stmt = $this->db->prepare('DELETE FROM libros_articulos WHERE id_libros_articulos = :id');
        $stmt->execute([':id' => $id]);
    }
}
