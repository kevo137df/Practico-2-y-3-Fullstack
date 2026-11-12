# GangleBooks

Tienda de libros: front en HTML/CSS/JS + API en PHP (router + controladores) + MySQL, todo con Docker.
La base de datos es el pasaje a tablas del MER (usuarios —gestiona— libros/articulos).

# Arrancar
```
docker compose up -d --build
```
- Sitio: http://localhost:8080/  (redirige a /front/index.html)
- phpMyAdmin: http://localhost:8081  (servidor `db`, usuario `root`, clave `1234`)

La base `biblioteca_arca` se crea con `database/biblioteca.sql` **solo la primera vez** (volumen vacío).
Si ya tenías un volumen con la base vieja, borralo para que se cree la estructura nueva:
```
docker compose down -v
docker compose up -d --build
```

### Usuarios de prueba
| Usuario | Contraseña | Rol |
|---|---|---|
| admin   | Admin123   | Administrador (entra al panel) |
| usuario | Usuario123 | Comprador |

Las cuentas creadas desde "Registrate acá" quedan siempre como **Comprador**.
Se puede iniciar sesión con el nombre de usuario o con el correo.

## Estructura
```
ganglebooks/
  .htaccess                 / -> front/index.html  y  dashboard.html -> api/guard-dashboard.php
  docker-compose.yml        app (8080) + MySQL (3306) + phpMyAdmin (8081)
  Dockerfile
  database/biblioteca.sql   tablas usuarios y libros_articulos (MER) + datos iniciales (44 libros)
  api/                      backend (solo JSON)
    index.php               punto de entrada: conecta a la BD y ejecuta el router
    routes.php              lista de rutas
    guard-dashboard.php     entrega dashboard.html solo a un Administrador
    .htaccess               manda todo /api/... a index.php y bloquea src/, config/ y .env
    config/database.php     conexión PDO
    src/Controllers/        AuthController, AdminController, LibroController
    src/Models/Auth/        AuthModel
    src/Models/Libro/       LibroModel
    src/Utils/              Router, Sesion, EnvLoader
  front/
    index.html              página principal de GangleBooks
    dist/pages/             login.html, registro.html, dashboard.html, usuario.html
    dist/js/                api.js (común), script.js, login.js, registro.js, dashboard.js, usuario.js
    dist/css/               style.css (página principal), panel.css (login/registro/panel/cuenta)
    dist/assets/            logos/ganglebooks-logo.svg, imagenes/mockup-ganglebooks.png
```

## Base de datos (pasaje del MER)
```
usuarios (1) ---- gestiona ---- (N) libros/articulos
```
- `usuarios` (**id_usuario** PK, nombre, email, contrasena, rol)
- `libros_articulos` (**id_libros_articulos** PK, titulo, genero, autor, precio, anio, portada, *id_usuario* FK)

La relación 1:N "gestiona" pasa como la FK `id_usuario` en `libros_articulos`: cada libro/artículo
lo gestiona un usuario (el administrador que lo cargó) y un usuario gestiona 0..N libros.
En SQL no se puede usar "/" en un nombre, por eso "libros/articulos" queda como `libros_articulos`.
`contrasena` guarda el hash de `password_hash()` de PHP; `rol` es `Administrador` o `Comprador`.

## Endpoints
| Método | Ruta | Quién |
|---|---|---|
| POST | /api/login | todos (`nombre` = usuario o email, `password`) |
| POST | /api/registro | todos |
| POST | /api/logout | todos |
| GET | /api/me | logueado (confirma el usuario en la BD) |
| GET | /api/libros | todos |
| GET | /api/admin/resumen | solo Administrador |
| POST / PUT / DELETE | /api/admin/libros[/id] | solo Administrador |

## Flujo
- Comprador: al iniciar sesión vuelve a la tienda; arriba aparece **Hola! nombre** (lleva a "Mi cuenta") y **Cerrar sesión**.
- Administrador: va al panel (agregar / editar / eliminar libros, contador de libros y usuarios). En la tienda ve además el botón **Panel**.

## Hacer administrador a otro usuario
```
UPDATE usuarios SET rol = 'Administrador' WHERE nombre = 'TU_USUARIO';
```

## Si algo no anda
1. Abrí http://localhost:8080/api/me
   - `{"status":"error","message":"No hay sesión iniciada"}` → la API y la base funcionan.
   - `Error crítico de BD: ...` → ese texto dice qué falla con MySQL (esperá unos segundos si recién arrancó).
   - Página de error de Apache / 404 → rehacé la imagen: `docker compose up -d --build`.
2. Recargá sin caché (Ctrl + F5).
3. Errores de PHP: `docker logs ganglebooks_app`.
