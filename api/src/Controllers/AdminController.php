<?php
namespace App\Controllers;

use App\Models\Libro\LibroModel;
use App\Utils\Sesion;

class AdminController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // GET /admin/resumen  -> solo Administrador (401 sin sesión, 403 si no es admin)
    public function resumen() {
        Sesion::exigirAdmin();

        $usuarios = (int) $this->db->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();
        $libros   = (new LibroModel($this->db))->contar();

        echo json_encode([
            'status'   => 'success',
            'usuarios' => $usuarios,
            'libros'   => $libros
        ]);
    }
}
