/* =====================================================
   GANGLEBOOKS — Página principal (usa la API: /api/libros, /api/me, /api/logout)
===================================================== */

const estado = {
  genero: "accion",
  orden: "vendido",   // vendido | popular | hits
  anio: "todos",
  autor: "todos"
};

// Variable global para almacenar los libros que vienen de la Base de Datos
let catalogoBD = [];

// ---- Armar tarjeta de libro ----
function tarjetaLibro(libro) {
  const precioNum = Number(libro.precio) || 0;
  const anioNum = Number(libro.anio) || 2024;
  const colorFondo = escapeHtml(libro.color || '#333');
  const titulo = escapeHtml(libro.titulo);
  const autor = escapeHtml(libro.autor);

  if (libro.portada) {
    return `
      <div class="tarjeta-libro">
        <div class="libro-portada" style="position: relative; overflow: hidden; background-color: ${colorFondo};">
          <img src="${escapeHtml(libro.portada)}" alt="${titulo}" class="img-portada" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">
          <span class="libro-anio" style="position: relative; z-index: 2;">${anioNum}</span>
        </div>
        <div class="libro-info">
          <p class="libro-titulo">"${titulo}"</p>
          <p class="libro-autor">${autor}</p>
          <p class="libro-precio">US$ ${precioNum.toFixed(2)}</p>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="tarjeta-libro">
        <div class="libro-portada" style="background-color:${colorFondo}">
          <span class="libro-anio">${anioNum}</span>
          <span class="libro-portada-titulo">${titulo}</span>
        </div>
        <div class="libro-info">
          <p class="libro-titulo">"${titulo}"</p>
          <p class="libro-autor">${autor}</p>
          <p class="libro-precio">US$ ${precioNum.toFixed(2)}</p>
        </div>
      </div>
    `;
  }
}

// ---- Ordenar según pestaña activa ----
function ordenar(libros) {
  const copia = [...libros];
  if (estado.orden === "popular") return copia.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (estado.orden === "hits")    return copia.sort((a, b) => Number(b.anio) - Number(a.anio));
  return copia; // vendido = orden original
}

// ---- Filtrar por género, año y autor ----
function filtrar(libros) {
  return libros.filter(l => {
    const okGenero = !l.genero || l.genero.toLowerCase() === estado.genero.toLowerCase();
    const okAnio   = estado.anio  === "todos" || Number(l.anio) === Number(estado.anio);
    const okAutor  = estado.autor === "todos" || l.autor === estado.autor;
    return okGenero && okAnio && okAutor;
  });
}

// ---- Pintar grilla ----
function pintar() {
  const resultado = filtrar(ordenar(catalogoBD));
  const grilla    = document.getElementById("grilla-libros");
  const subtitulo = document.getElementById("grilla-titulo");

  const nombresOrden = { vendido: "Más Vendidos", popular: "Más Populares", hits: "Hits Mundiales" };
  subtitulo.textContent = `${nombresOrden[estado.orden]} · ${estado.genero.toUpperCase()}`;

  if (resultado.length === 0) {
    grilla.innerHTML = `<p class="sin-resultados">Sin resultados en la base de datos con estos filtros.</p>`;
    return;
  }
  grilla.innerHTML = resultado.map(tarjetaLibro).join("");
}

// ---- Cargar libros desde la API (GET /api/libros) ----
async function cargarLibrosDesdeAPI() {
  const res = await apiFetch('/libros');

  if (res.ok && res.datos.status === 'success') {
    catalogoBD = res.datos.data;
    pintar();
    armarOpcionesAnio();
    armarOpcionesAutor();
  } else {
    console.error("Error al obtener libros:", res.datos.message || res.estado);
    document.getElementById("grilla-libros").innerHTML =
      `<p class="sin-resultados">No se pudieron cargar los libros.</p>`;
  }
}

// ---- Dropdowns de Año ----
function armarOpcionesAnio() {
  const anios = [...new Set(catalogoBD.map(l => l.anio))].filter(Boolean).sort((a, b) => b - a);
  const cuerpo = document.getElementById("lista-anio");
  if (!cuerpo) return;

  let html = `<button class="opcion-dd ${estado.anio === "todos" ? "seleccionada" : ""}" data-val="todos">Todos los años</button>`;
  anios.forEach(a => {
    html += `<button class="opcion-dd ${estado.anio === a ? "seleccionada" : ""}" data-val="${a}">${a}</button>`;
  });
  cuerpo.innerHTML = html;
}

// ---- Dropdowns de Autor ----
function armarOpcionesAutor() {
  const autores = [...new Set(catalogoBD.map(l => l.autor))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const cuerpo = document.getElementById("lista-autor");
  if (!cuerpo) return;

  let html = `<button class="opcion-dd ${estado.autor === "todos" ? "seleccionada" : ""}" data-val="todos">Todos los autores</button>`;
  autores.forEach(a => {
    html += `<button class="opcion-dd ${estado.autor === a ? "seleccionada" : ""}" data-val="${escapeHtml(a)}">${escapeHtml(a)}</button>`;
  });
  cuerpo.innerHTML = html;
}

function cerrarDropdowns() {
  document.querySelectorAll(".dropdown-lista").forEach(d => d.classList.remove("abierto"));
}

// ======================================================
// SESIÓN DE USUARIO (esquina superior derecha)
// ======================================================

// Dibuja "Hola! USUARIO" + "Cerrar sesión" (+ "Panel" si es admin), o "Iniciar sesión" si no hay sesión.
// usuario = { usuario, rol } o null
function pintarUsuario(usuario) {
  const cont = document.getElementById("contenedor-usuario");
  if (!cont) return;
  cont.innerHTML = "";

  if (usuario) {
    // Comprador: el saludo lleva a "Mi cuenta". Administrador: tiene el botón "Panel".
    let saludo;
    if (esAdministrador(usuario)) {
      saludo = document.createElement("button");
      saludo.type = "button";
    } else {
      saludo = document.createElement("a");
      saludo.href = RUTAS.usuario;
      saludo.title = "Mi cuenta";
    }
    saludo.className = "btn-usuario";
    saludo.textContent = `Hola! ${usuario.nombre}`;   // textContent evita inyección de HTML

    cont.append(saludo);

    if (esAdministrador(usuario)) {
      const panel = document.createElement("a");
      panel.className = "btn-panel";
      panel.href = RUTAS.dashboard;
      panel.textContent = "Panel";
      cont.append(panel);
    }

    const salir = document.createElement("button");
    salir.type = "button";
    salir.className = "btn-logout";
    salir.textContent = "Cerrar sesión";
    salir.addEventListener("click", cerrarSesionHeader);
    cont.append(salir);
  } else {
    const entrar = document.createElement("a");
    entrar.className = "btn-login";
    entrar.href = RUTAS.login;
    entrar.textContent = "Iniciar sesión";
    cont.append(entrar);
  }
}

// Pregunta a la API (que consulta la base de datos) quién está logueado: GET /api/me
async function cargarSesion() {
  const res = await apiFetch("/me");
  if (res.ok && res.datos.usuario) {
    pintarUsuario(res.datos.usuario);
  } else {
    pintarUsuario(null);
  }
}

// Cierra la sesión en el servidor (POST /api/logout) y actualiza la barra
async function cerrarSesionHeader() {
  await cerrarSesion();
  pintarUsuario(null);
}

// ======================================================
// INIT
// ======================================================
document.addEventListener("DOMContentLoaded", () => {

  // Cargamos los datos de la BD al iniciar la página
  cargarLibrosDesdeAPI();

  // Comprobación de sesión de usuario
  cargarSesion();

  // Scroll suave al hacer click en logo o botón hero
  document.querySelectorAll(".ir-a-libros").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      document.getElementById("seccion-libros").scrollIntoView({ behavior: "smooth" });
    });
  });

  // Pestañas Más Vendido / Más Popular / Hits Mundiales
  document.querySelectorAll(".pestana").forEach(p => {
    p.addEventListener("click", () => {
      document.querySelectorAll(".pestana").forEach(x => x.classList.remove("activa"));
      p.classList.add("activa");
      estado.orden = p.dataset.orden;
      pintar();
    });
  });

  // Géneros del sidebar
  document.querySelectorAll(".btn-categoria").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-categoria").forEach(x => x.classList.remove("cat-activa"));
      btn.classList.add("cat-activa");
      estado.genero = btn.dataset.genero;
      estado.anio   = "todos";
      estado.autor  = "todos";
      document.getElementById("btn-anio").textContent  = "Año ▾";
      document.getElementById("btn-autor").textContent = "Autor ▾";
      pintar();
      if (window.innerWidth < 768) {
        document.getElementById("grilla-libros").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Botón Año
  const btnAnio = document.getElementById("btn-anio");
  const ddAnio  = document.getElementById("dd-anio");
  if (btnAnio && ddAnio) {
    btnAnio.addEventListener("click", e => {
      e.stopPropagation();
      const estabaAbierto = ddAnio.classList.contains("abierto");
      cerrarDropdowns();
      if (!estabaAbierto) { armarOpcionesAnio(); ddAnio.classList.add("abierto"); }
    });

    document.getElementById("lista-anio").addEventListener("click", e => {
      if (!e.target.classList.contains("opcion-dd")) return;
      const val = e.target.dataset.val;
      estado.anio = val === "todos" ? "todos" : Number(val);
      btnAnio.textContent = val === "todos" ? "Año ▾" : `Año: ${val} ▾`;
      cerrarDropdowns();
      pintar();
    });
  }

  // Botón Autor
  const btnAutor = document.getElementById("btn-autor");
  const ddAutor  = document.getElementById("dd-autor");
  if (btnAutor && ddAutor) {
    btnAutor.addEventListener("click", e => {
      e.stopPropagation();
      const estabaAbierto = ddAutor.classList.contains("abierto");
      cerrarDropdowns();
      if (!estabaAbierto) { armarOpcionesAutor(); ddAutor.classList.add("abierto"); }
    });

    document.getElementById("lista-autor").addEventListener("click", e => {
      if (!e.target.classList.contains("opcion-dd")) return;
      const val = e.target.dataset.val;
      estado.autor = val;
      btnAutor.textContent = val === "todos" ? "Autor ▾" : `${val.split(" ")[0]} ▾`;
      cerrarDropdowns();
      pintar();
    });
  }

  document.addEventListener("click", cerrarDropdowns);

  // Flechas del carrusel Libros Populares
  const riel = document.getElementById("riel-populares");
  if (riel) {
    document.getElementById("flecha-izq").addEventListener("click", () => riel.scrollBy({ left: -220, behavior: "smooth" }));
    document.getElementById("flecha-der").addEventListener("click", () => riel.scrollBy({ left:  220, behavior: "smooth" }));
  }

});
