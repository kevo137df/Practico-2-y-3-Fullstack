document.addEventListener('DOMContentLoaded', async function () {
  const formulario = document.getElementById('form-login');
  const alerta = document.getElementById('login-alerta');
  const boton = document.getElementById('login-btn');

  // Si ya hay sesión iniciada, redirigir directamente según el rol
  const actual = await apiFetch('/me');
  if (actual.ok && actual.datos.usuario) {
    window.location.href = rutaSegunRol(actual.datos.usuario);
    return;
  }

  formulario.addEventListener('submit', async function (e) {
    e.preventDefault();
    alerta.classList.add('d-none');
    boton.disabled = true;

    const resultado = await apiFetch('/login', {
      method: 'POST',
      body: {
        nombre: document.getElementById('login-nombre').value,
        password: document.getElementById('login-password').value
      }
    });

    if (resultado.ok) {
      // Administrador -> panel de administración; Comprador -> página principal
      window.location.href = rutaSegunRol(resultado.datos.usuario);
    } else {
      alerta.textContent = resultado.datos.message || 'No se pudo iniciar sesión';
      alerta.classList.remove('d-none');
      boton.disabled = false;
    }
  });
});
