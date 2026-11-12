<?php
namespace App\Controllers;

use App\Models\Libro\LibroModel;
use App\Utils\Sesion;

class LibroController {
    private $db;
    private $model;


    public function __construct($db) {
        $this->db = $db;
        $this->model = new LibroModel($db);
    }

    private function responder($codigo, $datos) {
        http_response_code($codigo);
        echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    }

    private function entrada() {
        $datos = json_decode(file_get_contents('php://input'), true);
        return is_array($datos) ? $datos : [];
    }

    // GET /libros  (público) -> catálogo para la página principal
    public function index() {
        return $this->responder(200, ['status' => 'success', 'data' => $this->model->listar()]);
    }

    // POST /admin/libros  (solo Administrador)
    public function store() {
        $admin = Sesion::exigirAdmin();

        list($error, $datos) = $this->validar($this->entrada());
        if ($error) {
            return $this->responder(400, ['status' => 'error', 'message' => $error]);
        }

        $id = $this->model->crear($datos, (int) $admin['id']);
        return $this->responder(201, [
            'status'  => 'success',
            'message' => '¡Libro agregado exitosamente al catálogo!',
            'data'    => $this->model->obtener($id)
        ]);
    }

    // PUT /admin/libros/:id  (solo Administrador)
    public function update($id) {
        Sesion::exigirAdmin();

        $id = (int) $id;
        if ($id <= 0 || !$this->model->obtener($id)) {
            return $this->responder(404, ['status' => 'error', 'message' => 'El libro no existe']);
        }

        list($error, $datos) = $this->validar($this->entrada());
        if ($error) {
            return $this->responder(400, ['status' => 'error', 'message' => $error]);
        }

        $this->model->actualizar($id, $datos);
        return $this->responder(200, [
            'status'  => 'success',
            'message' => '¡Libro modificado exitosamente!',
            'data'    => $this->model->obtener($id)
        ]);
    }

    // DELETE /admin/libros/:id  (solo Administrador)
    public function destroy($id) {
        Sesion::exigirAdmin();

        $id = (int) $id;
        if ($id <= 0 || !$this->model->obtener($id)) {
            return $this->responder(404, ['status' => 'error', 'message' => 'El libro no existe']);
        }

        $this->model->eliminar($id);
        return $this->responder(200, ['status' => 'success', 'message' => 'Libro eliminado']);
    }

    /** Valida y limpia los datos del libro/artículo. Devuelve [mensajeDeError|null, datos|null]. */
    private function validar(array $e) {
        $titulo  = trim((string) ($e['titulo'] ?? ''));
        $genero  = $this->normalizarGenero((string) ($e['genero'] ?? ''));
        $autor   = trim((string) ($e['autor'] ?? ''));
        $precio  = $e['precio'] ?? null;
        $anio    = $e['anio'] ?? null;
        $portada = trim((string) ($e['portada'] ?? ''));

        if ($titulo === '' || $autor === '' || $genero === '') {
            return ['Completá título, autor y género', null];
        }
        if (mb_strlen($titulo) > 150 || mb_strlen($autor) > 100) {
            return ['El título o el autor son demasiado largos', null];
        }
        if (mb_strlen($genero) > 60) {
            return ['El género es demasiado largo', null];
        }
        if (!is_numeric($precio) || (float) $precio < 0 || (float) $precio > 99999) {
            return ['El precio no es válido', null];
        }
        if (!is_numeric($anio) || (int) $anio < 1000 || (int) $anio > 2100) {
            return ['El año no es válido', null];
        }
        if ($portada !== '' && (!preg_match('#^https?://#i', $portada) || strlen($portada) > 500)) {
            return ['La portada debe ser una URL que empiece con http:// o https://', null];
        }

        return [null, [
            'titulo'  => $titulo,
            'genero'  => $genero,
            'autor'   => $autor,
            'precio'  => round((float) $precio, 2),
            'anio'    => (int) $anio,
            'portada' => $portada
        ]];
    }

    /** "Fantasía" -> "fantasia": así coincide con las categorías del front. */
    private function normalizarGenero($genero) {
        $mapa = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u',
            'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u'
        ];
        return strtolower(strtr(trim($genero), $mapa));
    }
}
