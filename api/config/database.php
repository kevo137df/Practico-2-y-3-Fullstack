<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Leemos las variables del docker-compose.yml o del api/.env
        // (los valores por defecto coinciden con el docker-compose.yml)
        $this->host = getenv('DB_HOST') ?: 'db';
        $this->db_name = getenv('DB_NAME') ?: 'biblioteca_arca';
        $this->username = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS');
        $this->password = $pass === false ? '1234' : $pass;
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            // Este mensaje lo captura el try-catch de index.php
            throw new Exception($e->getMessage());
        }
        return $this->conn;
    }
}
