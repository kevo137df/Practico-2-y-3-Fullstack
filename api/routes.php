<?php
// api/routes.php — todas las rutas de la API (se escriben SIN el prefijo /api)

// ============================================================
// SECCIÓN: Autenticación
// ============================================================
$router->post('/login', 'AuthController@login');
$router->post('/registro', 'AuthController@registro');
$router->post('/logout', 'AuthController@logout');
$router->get('/me', 'AuthController@me');

// ============================================================
// SECCIÓN: Libros (público: catálogo de la página principal)
// ============================================================
$router->get('/libros', 'LibroController@index');

// ============================================================
// SECCIÓN: Administración (protegida: solo rol Administrador)
// ============================================================
$router->get('/admin/resumen', 'AdminController@resumen');
$router->post('/admin/libros', 'LibroController@store');
$router->put('/admin/libros/:id', 'LibroController@update');
$router->delete('/admin/libros/:id', 'LibroController@destroy');
