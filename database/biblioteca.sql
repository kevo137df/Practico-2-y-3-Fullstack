-- ============================================================
-- GangleBooks - Base de datos
-- Pasaje a tablas del MER:
--
--   usuarios (1) ---- gestiona ---- (N) libros/articulos
--
--   usuarios          : id_usuario (PK), nombre, email, contrasena, rol
--   libros/articulos  : id_libros/articulos (PK), titulo, genero, autor,
--                       precio, anio, portada
--   gestiona (1:N)    : la PK de usuarios pasa como FK (id_usuario) a
--                       libros_articulos. Un usuario gestiona 0..N libros;
--                       cada libro/artículo lo gestiona exactamente 1 usuario.
--
-- En SQL no se puede usar "/" en un nombre, por eso
-- "libros/articulos" queda como libros_articulos.
--
-- Docker ejecuta este archivo solo la PRIMERA vez (volumen vacío).
-- ============================================================
CREATE DATABASE IF NOT EXISTS biblioteca_arca
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biblioteca_arca;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS libros_articulos;
DROP TABLE IF EXISTS usuarios;

-- ------------------------------------------------------------
-- Entidad: usuarios
-- contrasena guarda el hash de password_hash() de PHP (nunca texto plano).
-- rol: 'Administrador' (gestiona el catálogo) o 'Comprador'.
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(60)  NOT NULL,
  email       VARCHAR(120) NOT NULL,
  contrasena  VARCHAR(255) NOT NULL,
  rol         VARCHAR(20)  NOT NULL DEFAULT 'Comprador',
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_nombre (nombre),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Entidad: libros/articulos  (+ FK de la relación "gestiona")
-- portada: URL de la imagen de tapa.
-- ------------------------------------------------------------
CREATE TABLE libros_articulos (
  id_libros_articulos INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo      VARCHAR(150) NOT NULL,
  genero      VARCHAR(60)  NOT NULL,
  autor       VARCHAR(100) NOT NULL,
  precio      DECIMAL(8,2) NOT NULL DEFAULT 0,
  anio        SMALLINT UNSIGNED NOT NULL,
  portada     VARCHAR(500) NOT NULL DEFAULT '',
  id_usuario  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_libros_articulos),
  KEY idx_libros_articulos_usuario (id_usuario),
  CONSTRAINT fk_gestiona_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

-- ============================================================
-- Datos iniciales
-- ============================================================

-- Contraseñas de prueba:
--   admin   -> Admin123    (rol Administrador)
--   usuario -> Usuario123  (rol Comprador)
-- Las cuentas que se registran desde la web quedan siempre como Comprador.
INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES
  ('admin',   'admin@ganglebooks.com',   '$2y$10$VB02o69A12vAp5zNAshaH.QMar/jT7Xt9VQtvYvsbeQ11Jfe4DRI2', 'Administrador'),
  ('usuario', 'usuario@ganglebooks.com', '$2y$10$CTOT9CtFZT6PrVCgNVVf2exBidXBVoTEzkGOtP2cWVghdwZAvBS8.', 'Comprador');

-- Catálogo inicial: todos los gestiona el admin
SET @id_admin = (SELECT id_usuario FROM usuarios WHERE nombre = 'admin');

INSERT INTO libros_articulos (titulo, genero, autor, precio, anio, portada, id_usuario) VALUES
  ('El Código Da Vinci', 'accion', 'Dan Brown', 9.99, 2024, 'https://covers.openlibrary.org/b/isbn/9780307474278-M.jpg', @id_admin),
  ('Saga de Bourne', 'accion', 'Robert Ludlum', 50.67, 2023, 'https://covers.openlibrary.org/b/isbn/9780345538208-M.jpg', @id_admin),
  ('Ángeles y Demonios', 'accion', 'Dan Brown', 9.23, 2022, 'https://covers.openlibrary.org/b/isbn/9780307474261-M.jpg', @id_admin),
  ('Saga de Jack Reacher', 'accion', 'Lee Child', 40.99, 2021, 'https://covers.openlibrary.org/b/isbn/9780345543509-M.jpg', @id_admin),
  ('Cazadores de Sombras', 'accion', 'Cassandra Clare', 8.99, 2020, 'https://covers.openlibrary.org/b/isbn/9781481444408-M.jpg', @id_admin),
  ('El Padrino', 'accion', 'Mario Puzo', 12.00, 2019, 'https://covers.openlibrary.org/b/isbn/9780451205766-M.jpg', @id_admin),
  ('Divergente', 'accion', 'Veronica Roth', 8.99, 2018, 'https://covers.openlibrary.org/b/isbn/9780062024039-M.jpg', @id_admin),
  ('Troya', 'accion', 'David Gemmell', 11.00, 2016, 'https://covers.openlibrary.org/b/isbn/9780345477049-M.jpg', @id_admin),
  ('Los Juegos del Hambre', 'accion', 'Suzanne Collins', 12.00, 2014, 'https://covers.openlibrary.org/b/isbn/9780439023528-M.jpg', @id_admin),
  ('El Señor de los Anillos', 'aventura', 'J.R.R. Tolkien', 14.50, 2024, 'https://covers.openlibrary.org/b/isbn/9780618640157-M.jpg', @id_admin),
  ('Harry Potter y la Piedra Filosofal', 'aventura', 'J.K. Rowling', 11.20, 2023, 'https://covers.openlibrary.org/b/isbn/9780747532699-M.jpg', @id_admin),
  ('Las Crónicas de Narnia', 'aventura', 'C.S. Lewis', 13.10, 2021, 'https://covers.openlibrary.org/b/isbn/9780066238500-M.jpg', @id_admin),
  ('Percy Jackson', 'aventura', 'Rick Riordan', 9.50, 2020, 'https://covers.openlibrary.org/b/isbn/9780786856299-M.jpg', @id_admin),
  ('La Isla del Tesoro', 'aventura', 'Robert Louis Stevenson', 6.99, 2018, 'https://covers.openlibrary.org/b/isbn/9780141321004-M.jpg', @id_admin),
  ('Don Quijote', 'aventura', 'Miguel de Cervantes', 10.00, 2015, 'https://covers.openlibrary.org/b/isbn/9780060934347-M.jpg', @id_admin),
  ('Moby Dick', 'aventura', 'Herman Melville', 8.50, 2010, 'https://covers.openlibrary.org/b/isbn/9780142437247-M.jpg', @id_admin),
  ('Steve Jobs', 'biografia', 'Walter Isaacson', 15.99, 2024, 'https://covers.openlibrary.org/b/isbn/9781451648539-M.jpg', @id_admin),
  ('El Diario de Ana Frank', 'biografia', 'Ana Frank', 7.50, 2023, 'https://covers.openlibrary.org/b/isbn/9780307275615-M.jpg', @id_admin),
  ('Una Tierra Prometida', 'biografia', 'Barack Obama', 18.00, 2022, 'https://covers.openlibrary.org/b/isbn/9781524763169-M.jpg', @id_admin),
  ('Elon Musk', 'biografia', 'Walter Isaacson', 16.50, 2021, 'https://covers.openlibrary.org/b/isbn/9781982181284-M.jpg', @id_admin),
  ('Yo soy Malala', 'biografia', 'Malala Yousafzai', 9.20, 2019, 'https://covers.openlibrary.org/b/isbn/9780316322409-M.jpg', @id_admin),
  ('Open (Memorias)', 'biografia', 'Andre Agassi', 11.40, 2014, 'https://covers.openlibrary.org/b/isbn/9780307268198-M.jpg', @id_admin),
  ('Guía del Autoestopista Galáctico', 'comedia', 'Douglas Adams', 9.99, 2024, 'https://covers.openlibrary.org/b/isbn/9780345391803-M.jpg', @id_admin),
  ('Buenos Presagios', 'comedia', 'Neil Gaiman & Terry Pratchett', 11.00, 2023, 'https://covers.openlibrary.org/b/isbn/9780060853969-M.jpg', @id_admin),
  ('La Innombrable Saga de Mundodisco', 'comedia', 'Terry Pratchett', 12.50, 2022, 'https://covers.openlibrary.org/b/isbn/9780061020643-M.jpg', @id_admin),
  ('Sin Noticias de Gurb', 'comedia', 'Eduardo Mendoza', 8.00, 2020, 'https://covers.openlibrary.org/b/isbn/9788432206412-M.jpg', @id_admin),
  ('La Conjura de los Necios', 'comedia', 'John Kennedy Toole', 10.50, 2017, 'https://covers.openlibrary.org/b/isbn/9780802130204-M.jpg', @id_admin),
  ('Tres hombres en una barca', 'comedia', 'Jerome K. Jerome', 7.20, 2012, 'https://covers.openlibrary.org/b/isbn/9780140437508-M.jpg', @id_admin),
  ('It', 'horror', 'Stephen King', 13.99, 2005, 'https://covers.openlibrary.org/b/isbn/9781501142970-M.jpg', @id_admin),
  ('El Resplandor', 'horror', 'Stephen King', 11.50, 2001, 'https://covers.openlibrary.org/b/isbn/9780345806789-M.jpg', @id_admin),
  ('Drácula', 'horror', 'Bram Stoker', 8.90, 1998, 'https://covers.openlibrary.org/b/isbn/9780486411095-M.jpg', @id_admin),
  ('Frankenstein', 'horror', 'Mary Shelley', 7.60, 2024, 'https://covers.openlibrary.org/b/isbn/9780143131847-M.jpg', @id_admin),
  ('El Exorcista', 'horror', 'William Peter Blatty', 9.40, 2023, 'https://covers.openlibrary.org/b/isbn/9780062094360-M.jpg', @id_admin),
  ('La Casa Embrujada', 'horror', 'Shirley Jackson', 8.20, 2022, 'https://covers.openlibrary.org/b/isbn/9780143039983-M.jpg', @id_admin),
  ('Cementerio de Animales', 'horror', 'Stephen King', 12.10, 2021, 'https://covers.openlibrary.org/b/isbn/9781982112394-M.jpg', @id_admin),
  ('El Hombre de Las Tinieblas', 'horror', 'Clive Barker', 9.00, 2020, 'https://covers.openlibrary.org/b/isbn/9780425164136-M.jpg', @id_admin),
  ('House of Leaves', 'horror', 'Mark Z. Danielewski', 14.30, 2019, 'https://covers.openlibrary.org/b/isbn/9780375703768-M.jpg', @id_admin),
  ('Orgullo y Prejuicio', 'romance', 'Jane Austen', 8.99, 2024, 'https://covers.openlibrary.org/b/isbn/9780141439517-M.jpg', @id_admin),
  ('Bodas y Prejuicios', 'romance', 'Sophie Kinsella', 7.60, 2023, 'https://covers.openlibrary.org/b/isbn/9780345528698-M.jpg', @id_admin),
  ('Bajo la Misma Estrella', 'romance', 'John Green', 9.40, 2022, 'https://covers.openlibrary.org/b/isbn/9780525478812-M.jpg', @id_admin),
  ('Outlander', 'romance', 'Diana Gabaldon', 12.20, 2021, 'https://covers.openlibrary.org/b/isbn/9780385303545-M.jpg', @id_admin),
  ('Me Before You', 'romance', 'Jojo Moyes', 9.90, 2020, 'https://covers.openlibrary.org/b/isbn/9780525426585-M.jpg', @id_admin),
  ('El Diario de Noa', 'romance', 'Nicholas Sparks', 8.30, 2019, 'https://covers.openlibrary.org/b/isbn/9780446605236-M.jpg', @id_admin),
  ('Romeo y Julieta', 'romance', 'William Shakespeare', 6.50, 2001, 'https://covers.openlibrary.org/b/isbn/9780743477116-M.jpg', @id_admin);

-- Para hacer administrador a otro usuario:
--   UPDATE usuarios SET rol = 'Administrador' WHERE nombre = 'TU_USUARIO';
