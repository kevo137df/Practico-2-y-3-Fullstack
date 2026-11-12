// Configuración común para llamar a la API y redirigir según el rol
// Si el front está en .../front/..., la API está en .../api
(function () {
  const idx = location.pathname.indexOf('/front/');
  const base = idx !== -1 ? location.pathname.slice(0, idx) : '';
  const raizFront = base + '/front';

  window.API_URL = base + '/api';

  // Rutas del front (relativas a la raíz del front)
  window.RUTAS = {
    inicio:    raizFront + '/index.html',
    login:     raizFront + '/dist/pages/login.html',
    registro:  raizFront + '/dist/pages/registro.html',
    dashboard: raizFront + '/dist/pages/dashboard.html',
    usuario:   raizFront + '/dist/pages/usuario.html'
  };

  window.esAdministrador = function (usuario) {
    return !!usuario && String(usuario.rol).toLowerCase() === 'administrador';
  };

  // A qué página va cada rol después de iniciar sesión:
  // Administrador -> panel; Comprador -> tienda (página principal)
  window.rutaSegunRol = function (usuario) {
    return window.esAdministrador(usuario) ? window.RUTAS.dashboard : window.RUTAS.inicio;
  };

  // Evita que un texto de la base de datos se interprete como HTML
  window.escapeHtml = function (texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // Llama a la API. Siempre devuelve { ok, estado, datos } (nunca lanza error).
  // estado 0 = no se pudo conectar con el servidor.
  window.apiFetch = async function (ruta, opciones) {
    const config = Object.assign({ credentials: 'same-origin' }, opciones || {});
    if (config.body && typeof config.body !== 'string') {
      config.headers = Object.assign({ 'Content-Type': 'application/json' }, config.headers);
      config.body = JSON.stringify(config.body);
    }
    try {
      const respuesta = await fetch(window.API_URL + ruta, config);
      let datos = {};
      try {
        datos = await respuesta.json();
      } catch (e) {
        console.error('La API no devolvió JSON en ' + ruta + ' (estado ' + respuesta.status + '). ¿Está bien configurado /api?');
      }
      return { ok: respuesta.ok, estado: respuesta.status, datos: datos };
    } catch (e) {
      console.error('No se pudo conectar con la API (' + window.API_URL + ruta + '):', e);
      return { ok: false, estado: 0, datos: { message: 'No se pudo conectar con el servidor' } };
    }
  };

  // Cierra la sesión en el servidor; si se indica un destino, redirige ahí.
  window.cerrarSesion = async function (destino) {
    await window.apiFetch('/logout', { method: 'POST' });
    if (destino) window.location.href = destino;
  };
})();
