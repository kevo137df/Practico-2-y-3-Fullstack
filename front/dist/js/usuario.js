document.addEventListener('DOMContentLoaded', async function () {
  const sesion = await apiFetch('/me');

  if (!sesion.ok || !sesion.datos.usuario) {
    window.location.href = RUTAS.login;
    return;
  }
  // Un administrador que entre acá vuelve a su dashboard
  if (esAdministrador(sesion.datos.usuario)) {
    window.location.href = RUTAS.dashboard;
    return;
  }

  const usuario = sesion.datos.usuario;
  document.getElementById('usuario-nombre').textContent = usuario.nombre;
  document.getElementById('usuario-dato-nombre').textContent = usuario.nombre;
  document.getElementById('usuario-email').textContent = usuario.email || '—';
  document.getElementById('usuario-rol').textContent = usuario.rol;
  document.getElementById('usuario-contenido').classList.remove('d-none');

  document.getElementById('usuario-logout').addEventListener('click', function () {
    cerrarSesion(RUTAS.inicio);
  });
});
