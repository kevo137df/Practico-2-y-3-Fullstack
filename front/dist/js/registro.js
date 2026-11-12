document.addEventListener('DOMContentLoaded', function () {
  const formulario = document.getElementById('form-registro');
  const alerta = document.getElementById('registro-alerta');
  const boton = document.getElementById('registro-btn');

  function mostrar(mensaje, tipo) {
    alerta.textContent = mensaje;
    alerta.className = 'alerta ' + tipo;
  }

  formulario.addEventListener('submit', async function (e) {
    e.preventDefault();
    alerta.classList.add('d-none');
    boton.disabled = true;

    const resultado = await apiFetch('/registro', {
      method: 'POST',
      body: {
        nombre: document.getElementById('reg-nombre').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        confirm_password: document.getElementById('reg-confirm').value
      }
    });

    if (resultado.ok) {
      mostrar(resultado.datos.message || '¡Registro exitoso!', 'exito');
      setTimeout(function () { window.location.href = RUTAS.login; }, 1500);
    } else {
      mostrar(resultado.datos.message || 'No se pudo completar el registro', 'error');
      boton.disabled = false;
    }
  });
});
