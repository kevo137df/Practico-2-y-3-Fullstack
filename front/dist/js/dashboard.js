// Panel de administración: protegido (login + rol Administrador) y con CRUD de libros contra la API.
const GENEROS = {
  accion: 'Acción', aventura: 'Aventura', biografia: 'Biografía', comedia: 'Comedia',
  crimen: 'Crimen', documental: 'Documental', fantasia: 'Fantasía', historia: 'Historia',
  horror: 'Horror / Terror', misterio: 'Misterio', romance: 'Romance'
};

document.addEventListener('DOMContentLoaded', async function () {

  // ---- Protección de la página: hay que estar logueado y ser admin ----
  const sesion = await apiFetch('/me');
  if (!sesion.ok) {
    window.location.href = RUTAS.login;
    return;
  }
  if (!esAdministrador(sesion.datos.usuario)) {
    window.location.href = RUTAS.inicio;
    return;
  }

  document.getElementById('panel-nombre').textContent = sesion.datos.usuario.nombre;
  document.getElementById('panel-contenido').classList.remove('d-none');
  document.getElementById('btn-logout').addEventListener('click', function () {
    cerrarSesion(RUTAS.login);
  });

  // ---- Referencias ----
  const alerta = document.getElementById('panel-alerta');
  const form = document.getElementById('form-libro');
  const tabla = document.getElementById('tabla-libros');
  const selGenero = document.getElementById('libro-genero');
  const campo = {
    id: document.getElementById('libro-id'),
    titulo: document.getElementById('libro-titulo'),
    autor: document.getElementById('libro-autor'),
    genero: selGenero,
    precio: document.getElementById('libro-precio'),
    anio: document.getElementById('libro-anio'),
    portada: document.getElementById('libro-portada')
  };
  const btnGuardar = document.getElementById('btn-guardar');
  const btnCancelar = document.getElementById('btn-cancelar');
  let libros = [];

  function avisar(mensaje, tipo) {
    alerta.textContent = mensaje;
    alerta.className = 'alerta ' + tipo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Si la sesión venció o ya no es admin, la API responde 401/403
  function sesionInvalida(res) {
    if (res.estado === 401) { window.location.href = RUTAS.login; return true; }
    if (res.estado === 403) { window.location.href = RUTAS.inicio; return true; }
    return false;
  }

  function llenarGeneros(generoActual) {
    let html = '';
    Object.keys(GENEROS).forEach(function (clave) {
      html += '<option value="' + clave + '">' + GENEROS[clave] + '</option>';
    });
    // Si el libro tiene un género que no está en la lista, se agrega para no perderlo
    if (generoActual && !GENEROS[generoActual]) {
      html += '<option value="' + escapeHtml(generoActual) + '">' + escapeHtml(generoActual) + '</option>';
    }
    selGenero.innerHTML = html;
    selGenero.value = generoActual || 'accion';
  }

  function modoAgregar() {
    form.reset();
    campo.id.value = '';
    llenarGeneros('accion');
    document.getElementById('form-titulo').textContent = 'Agregar Nuevo Libro';
    btnGuardar.textContent = 'Agregar al Catálogo';
    btnGuardar.classList.remove('editando');
    btnCancelar.classList.add('d-none');
  }

  function modoEditar(libro) {
    campo.id.value = libro.id_libros_articulos;
    campo.titulo.value = libro.titulo;
    campo.autor.value = libro.autor;
    llenarGeneros(libro.genero);
    campo.precio.value = libro.precio;
    campo.anio.value = libro.anio;
    campo.portada.value = libro.portada || '';
    document.getElementById('form-titulo').textContent = 'Modificar Libro';
    btnGuardar.textContent = 'Guardar Cambios';
    btnGuardar.classList.add('editando');
    btnCancelar.classList.remove('d-none');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Datos ----
  function pintarTabla() {
    if (libros.length === 0) {
      tabla.innerHTML = '<tr><td colspan="7" class="sin-libros">No hay libros registrados en la base de datos.</td></tr>';
      return;
    }
    // Los más nuevos primero
    tabla.innerHTML = libros.slice().reverse().map(function (l) {
      return '<tr>' +
        '<td>' + escapeHtml(l.id_libros_articulos) + '</td>' +
        '<td class="titulo">' + escapeHtml(l.titulo) + '</td>' +
        '<td>' + escapeHtml(l.autor) + '</td>' +
        '<td>' + escapeHtml(GENEROS[l.genero] || l.genero) + '</td>' +
        '<td class="precio">US$ ' + (Number(l.precio) || 0).toFixed(2) + '</td>' +
        '<td>' + escapeHtml(l.anio) + '</td>' +
        '<td><div class="acciones">' +
          '<button type="button" class="btn-editar" data-editar="' + escapeHtml(l.id_libros_articulos) + '" title="Modificar">Editar</button>' +
          '<button type="button" class="btn-eliminar" data-eliminar="' + escapeHtml(l.id_libros_articulos) + '" title="Eliminar">Eliminar</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  async function cargarLibros() {
    const res = await apiFetch('/libros');
    if (res.ok) {
      libros = res.datos.data || [];
      pintarTabla();
    } else {
      avisar(res.datos.message || 'No se pudieron cargar los libros', 'error');
    }
  }

  async function cargarResumen() {
    const res = await apiFetch('/admin/resumen');
    if (sesionInvalida(res)) return;
    if (res.ok) {
      document.getElementById('stat-libros').textContent = res.datos.libros;
      document.getElementById('stat-usuarios').textContent = res.datos.usuarios;
    }
  }

  // ---- Acciones ----
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    alerta.classList.add('d-none');
    btnGuardar.disabled = true;

    const id = campo.id.value;
    const cuerpo = {
      titulo: campo.titulo.value,
      autor: campo.autor.value,
      genero: campo.genero.value,
      precio: campo.precio.value,
      anio: campo.anio.value,
      portada: campo.portada.value
    };

    const res = id
      ? await apiFetch('/admin/libros/' + encodeURIComponent(id), { method: 'PUT', body: cuerpo })
      : await apiFetch('/admin/libros', { method: 'POST', body: cuerpo });

    btnGuardar.disabled = false;
    if (sesionInvalida(res)) return;

    if (res.ok) {
      avisar(res.datos.message, 'exito');
      modoAgregar();
      await cargarLibros();
      await cargarResumen();
    } else {
      avisar(res.datos.message || 'No se pudo guardar el libro', 'error');
    }
  });

  btnCancelar.addEventListener('click', modoAgregar);

  tabla.addEventListener('click', async function (e) {
    const btnEditar = e.target.closest('[data-editar]');
    const btnEliminar = e.target.closest('[data-eliminar]');

    if (btnEditar) {
      const libro = libros.find(function (l) { return String(l.id_libros_articulos) === btnEditar.dataset.editar; });
      if (libro) modoEditar(libro);
    }

    if (btnEliminar) {
      if (!confirm('¿Estás seguro de que deseas eliminar este libro?')) return;
      const res = await apiFetch('/admin/libros/' + encodeURIComponent(btnEliminar.dataset.eliminar), { method: 'DELETE' });
      if (sesionInvalida(res)) return;
      if (res.ok) {
        avisar(res.datos.message || 'Libro eliminado', 'exito');
        if (campo.id.value === btnEliminar.dataset.eliminar) modoAgregar();
        await cargarLibros();
        await cargarResumen();
      } else {
        avisar(res.datos.message || 'No se pudo eliminar el libro', 'error');
      }
    }
  });

  // ---- Inicio ----
  modoAgregar();
  await cargarLibros();
  await cargarResumen();
});
