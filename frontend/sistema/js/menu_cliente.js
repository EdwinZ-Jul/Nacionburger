// js/menu_cliente.js
import { fetchApi } from './authGuard.js';

// ─── Variables de estado de accesibilidad ─────────────────────────────────────
let altoContrasteActivo = false;
let vozActiva           = false;
let sintesisVoz         = null;

/** Map<ID_PLATILLO, fila de /api/promociones/activas> — promos vigentes hoy */
let mapaPromos = new Map();

function promoDeProducto(idPlatillo) {
  return mapaPromos.get(idPlatillo);
}

function precioAMostrar(producto) {
  const p = promoDeProducto(producto.ID_PLATILLO);
  return p ? Number(p.PRECIO_PROMO) : Number(producto.PRECIO);
}

function htmlPrecioEnTarjeta(producto) {
  const p = promoDeProducto(producto.ID_PLATILLO);
  if (p) {
    return `<span class="precio-promo-linea"><del>S/. ${producto.PRECIO}</del> <strong>S/. ${p.PRECIO_PROMO}</strong></span><small class="promo-etiqueta">−${p.DESCUENTO}% · ${p.PROMO_DESCRIPCION || 'Promo'}</small>`;
  }
  return `<span>S/. ${producto.PRECIO}</span>`;
}

function clasesTarjeta(producto) {
  const cats = [producto.CATEGORIA.toLowerCase()];
  if (promoDeProducto(producto.ID_PLATILLO)) cats.push('promos');
  return `producto-card ${cats.join(' ')}`;
}

function abrirModalProducto(producto) {
  const promo = promoDeProducto(producto.ID_PLATILLO);
  const precio = precioAMostrar(producto);
  document.getElementById('modalProducto').dataset.idActual = producto.ID_PLATILLO;
  document.getElementById('modalImagen').src = `/images/${producto.CARPETA}/${producto.IMAGEN}`;
  document.getElementById('modalNombre').textContent = producto.NOMBRE;
  document.getElementById('modalDescripcion').textContent = producto.DESCRIPCION;
  const precioEl = document.getElementById('modalPrecio');
  const anteriorEl = document.getElementById('modalPrecioAnterior');
  if (promo) {
    if (anteriorEl) {
      anteriorEl.style.display = 'block';
      anteriorEl.innerHTML = `<del>Antes S/. ${producto.PRECIO}</del>`;
    }
    precioEl.textContent = String(promo.PRECIO_PROMO);
  } else {
    if (anteriorEl) {
      anteriorEl.style.display = 'none';
      anteriorEl.textContent = '';
    }
    precioEl.textContent = String(producto.PRECIO);
  }
  document.getElementById('modalCantidad').value = 1;
  document.getElementById('modalProducto').style.display = 'flex';

  if (vozActiva) {
    leerProducto({
      NOMBRE: producto.NOMBRE,
      DESCRIPCION: producto.DESCRIPCION,
      PRECIO: precio
    });
  }
}

function crearTarjetaProducto(producto) {
  const card = document.createElement('div');
  card.className = clasesTarjeta(producto);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `${producto.NOMBRE}, precio S/. ${precioAMostrar(producto)}`);
  card.innerHTML = `
    <img src="/images/${producto.CARPETA}/${producto.IMAGEN}" alt="${producto.NOMBRE}" />
    <h3>${producto.NOMBRE}</h3>
    <p>${producto.DESCRIPCION}</p>
    ${htmlPrecioEnTarjeta(producto)}
  `;
  const abrir = () => abrirModalProducto(producto);
  card.addEventListener('click', abrir);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrir();
    }
  });
  return card;
}

// ─── INICIO SESIÓN ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('token');
  let userData = null;

  if (token) {
    try {
      userData = JSON.parse(atob(token.split('.')[1]));
    } catch (err) {
      console.error('Error al decodificar token:', err);
      sessionStorage.removeItem('token');
    }
  }

  const btnLogin          = document.getElementById('btn-login');
  const contenedorUsuario = document.getElementById('usuario-logueado');
  const spanNombre        = document.getElementById('nombre-usuario');
  const btnCerrar         = document.getElementById('cerrar-sesion');
  const submenu           = document.getElementById('submenu-usuario');

  if (userData) {
    if (btnLogin)          btnLogin.style.display = 'none';
    if (contenedorUsuario) { contenedorUsuario.style.display = 'flex'; spanNombre.textContent = userData.usuario; }
    if (btnCerrar) btnCerrar.addEventListener('click', () => { sessionStorage.removeItem('token'); window.location.reload(); });

    history.pushState(null, null, location.href);
    window.addEventListener('popstate', () => { history.pushState(null, null, location.href); location.reload(); });
  } else {
    if (btnLogin)          btnLogin.style.display = 'block';
    if (contenedorUsuario) contenedorUsuario.style.display = 'none';
    window.addEventListener('popstate', () => { window.location.href = '../index.html'; });
  }

  if (contenedorUsuario && submenu) {
    contenedorUsuario.addEventListener('click', e => { e.stopPropagation(); submenu.classList.toggle('active'); });
    document.addEventListener('click', () => submenu.classList.remove('active'));
  }

  // Inicializar accesibilidad
  inicializarAccesibilidad();
});

// ─── CARGA DE PRODUCTOS ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [resProd, resPromo] = await Promise.all([
      fetchApi('/api/productos'),
      fetchApi('/api/promociones/activas')
    ]);
    const productos = await resProd.json();
    try {
      const listaPromos = await resPromo.json();
      mapaPromos = new Map(
        Array.isArray(listaPromos) ? listaPromos.map((row) => [row.ID_PLATILLO, row]) : []
      );
    } catch {
      mapaPromos = new Map();
    }

    const contenedor = document.getElementById('productos');
    if (!contenedor) return;

    productos.forEach((producto) => {
      contenedor.appendChild(crearTarjetaProducto(producto));
    });

    document.getElementById('cerrarModalBtn')?.addEventListener('click', () => { document.getElementById('modalProducto').style.display = 'none'; });
    document.querySelector('.cerrar-modal')?.addEventListener('click', () => { document.getElementById('modalProducto').style.display = 'none'; });

  } catch (error) {
    console.error('Error cargando productos:', error);
  }
});

// ─── FILTROS POR CATEGORÍA ────────────────────────────────────────────────────
document.querySelectorAll('.categoria-btn').forEach(boton => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');
    const cats = boton.dataset.categoria.toLowerCase().split(',');
    document.querySelectorAll('.producto-card').forEach(card => {
      card.style.display = cats.some(c => card.classList.contains(c)) ? 'block' : 'none';
    });
  });
});

// ─── BÚSQUEDA ────────────────────────────────────────────────────────────────
const inputBusqueda = document.getElementById('inputBusqueda');
const sugerencias   = document.getElementById('sugerencias');

if (inputBusqueda) {
  inputBusqueda.addEventListener('input', async () => {
    const nombre = inputBusqueda.value.trim().toLowerCase();
    if (nombre === '') {
      const [r, rPromo] = await Promise.all([
        fetchApi('/api/productos'),
        fetchApi('/api/promociones/activas')
      ]);
      try {
        const listaPromos = await rPromo.json();
        mapaPromos = new Map(
          Array.isArray(listaPromos) ? listaPromos.map((row) => [row.ID_PLATILLO, row]) : []
        );
      } catch {
        mapaPromos = new Map();
      }
      renderizarProductos(await r.json());
      sugerencias.innerHTML = '';
      sugerencias.classList.remove('activo');
      return;
    }
    try {
      const r = await fetchApi(`/api/productos/buscar?nombre=${encodeURIComponent(nombre)}`);
      const productos = await r.json();
      sugerencias.innerHTML = '';
      if (!productos.length) {
        sugerencias.innerHTML = '<li>No se encontraron productos</li>';
        sugerencias.classList.add('activo');
        renderizarProductos([]);
        return;
      }
      productos.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.NOMBRE;
        li.addEventListener('click', () => {
          inputBusqueda.value = p.NOMBRE;
          sugerencias.innerHTML = '';
          sugerencias.classList.remove('activo');
          renderizarProductos([p]);
        });
        sugerencias.appendChild(li);
      });
      sugerencias.classList.add('activo');
      renderizarProductos(productos);
    } catch (err) {
      console.error('Error búsqueda:', err);
    }
  });
}

function renderizarProductos(productos) {
  const contenedor = document.getElementById('productos');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  productos.forEach((p) => {
    contenedor.appendChild(crearTarjetaProducto(p));
  });
  document.getElementById('cerrarModalBtn')?.addEventListener('click', () => { document.getElementById('modalProducto').style.display = 'none'; });
  document.querySelector('.cerrar-modal')?.addEventListener('click', () => { document.getElementById('modalProducto').style.display = 'none'; });
}

// ─── ACCESIBILIDAD ────────────────────────────────────────────────────────────

function inicializarAccesibilidad() {
  // Restaurar estado guardado
  if (localStorage.getItem('acc-contraste') === '1') activarContraste(true);
  if (localStorage.getItem('acc-voz') === '1')       activarVoz(true);

  // Agregar barra al DOM
  const barra = document.createElement('div');
  barra.className = 'barra-accesibilidad';
  barra.setAttribute('role', 'region');
  barra.setAttribute('aria-label', 'Opciones de accesibilidad');
  barra.innerHTML = `
    <div class="acc-panel" id="acc-panel" role="menu">
      <div class="acc-panel-titulo">♿ Accesibilidad</div>
      <button class="acc-btn" id="btn-contraste" onclick="toggleContraste()" role="menuitem"
              aria-pressed="${altoContrasteActivo}" title="Alto contraste">
        <span class="acc-icon">🔲</span>
        <span>Alto Contraste</span>
      </button>
      <button class="acc-btn" id="btn-voz" onclick="toggleVoz()" role="menuitem"
              aria-pressed="${vozActiva}" title="Leer producto al seleccionar">
        <span class="acc-icon">🔊</span>
        <span>Leer Producto</span>
      </button>
    </div>
    <button class="acc-toggle-btn" id="acc-toggle" onclick="toggleAccPanel()"
            aria-expanded="false" aria-controls="acc-panel"
            title="Opciones de accesibilidad">
      ♿
    </button>
  `;
  document.body.appendChild(barra);
  actualizarBotonesAcc();
}

function toggleAccPanel() {
  const panel  = document.getElementById('acc-panel');
  const toggle = document.getElementById('acc-toggle');
  const abierto = panel.classList.toggle('acc-abierto');
  toggle.setAttribute('aria-expanded', String(abierto));
}

// ─── CONTRASTE ALTO ───────────────────────────────────────────────────────────
function toggleContraste() {
  altoContrasteActivo = !altoContrasteActivo;
  activarContraste(altoContrasteActivo);
}

function activarContraste(estado) {
  altoContrasteActivo = estado;
  document.body.classList.toggle('alto-contraste', estado);
  localStorage.setItem('acc-contraste', estado ? '1' : '0');
  actualizarBotonesAcc();
  anunciarVoz(estado ? 'Modo alto contraste activado' : 'Modo alto contraste desactivado');
}

// ─── LECTURA DE PRODUCTOS (Web Speech API) ────────────────────────────────────
function toggleVoz() {
  vozActiva = !vozActiva;
  activarVoz(vozActiva);
}

function activarVoz(estado) {
  vozActiva = estado;
  if (!estado && sintesisVoz) window.speechSynthesis?.cancel();
  localStorage.setItem('acc-voz', estado ? '1' : '0');
  actualizarBotonesAcc();
  anunciarVoz(estado ? 'Lectura de productos activada. Selecciona un producto para escuchar su descripción.' : 'Lectura de productos desactivada.');
}

function leerProducto(producto) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API no disponible');
    return;
  }

  window.speechSynthesis.cancel(); // Cancelar lectura anterior

  const texto = `${producto.NOMBRE || producto.nombre}. ${producto.DESCRIPCION || producto.descripcion || ''}. Precio: ${producto.PRECIO || producto.precio} soles.`;
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang   = 'es-PE';
  utterance.rate   = 0.95;
  utterance.pitch  = 1;
  utterance.volume = 1;

  // Indicador visual de que se está hablando
  const btnVoz = document.getElementById('btn-voz');
  utterance.onstart = () => btnVoz?.classList.add('acc-hablando');
  utterance.onend   = () => btnVoz?.classList.remove('acc-hablando');

  window.speechSynthesis.speak(utterance);
}

function anunciarVoz(mensaje) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(mensaje);
  u.lang = 'es-PE'; u.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function actualizarBotonesAcc() {
  const btnC = document.getElementById('btn-contraste');
  const btnV = document.getElementById('btn-voz');
  if (btnC) { btnC.setAttribute('aria-pressed', String(altoContrasteActivo)); btnC.classList.toggle('acc-activo', altoContrasteActivo); }
  if (btnV) { btnV.setAttribute('aria-pressed', String(vozActiva));           btnV.classList.toggle('acc-activo', vozActiva); }
}

// Exponer al scope global
window.toggleContraste   = toggleContraste;
window.toggleVoz         = toggleVoz;
window.toggleAccPanel    = toggleAccPanel;