import { protectRoute, fetchWithAuth } from './authGuard.js';
import { cargarGestionProductos } from './gestionProductos.js';
import { cargarGestionEmpleados } from './gestionEmpleados.js';
import { cargarGestionPromociones } from './gestionPromociones.js';
import { cargarGestionPedidos } from './gestionPedidos.js';

/** Copia del HTML inicial del dashboard (para volver desde el menú). */
let dashboardHTML = '';

function setPageTitle(title) {
  const el = document.getElementById('admin-page-title');
  if (el) el.textContent = title;
}

function setActiveNav(navBtnId) {
  document.querySelectorAll('.admin-nav a').forEach((a) => a.classList.remove('active'));
  const link = document.getElementById(navBtnId);
  if (link) link.classList.add('active');
}

function formatoSoles(n) {
  const x = Number(n) || 0;
  return `S/ ${x.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatoPctVsAyer(hoy, ayer) {
  if (ayer <= 0 && hoy <= 0) return 'Sin ventas hoy ni ayer';
  if (ayer <= 0) return hoy > 0 ? '+100% vs ayer' : '— vs ayer';
  const p = ((hoy - ayer) / ayer) * 100;
  return `${(p >= 0 ? '+' : '') + p.toFixed(1)}% vs ayer`;
}

function textoPedidosVsAyer(hoy, ayer) {
  const d = hoy - ayer;
  if (d === 0) return 'Igual que ayer';
  return `${d > 0 ? '+' : ''}${d} vs ayer`;
}

function estiloEstadoBadge(estado) {
  const e = String(estado || '').toLowerCase();
  if (e.includes('entreg')) return { bg: 'rgba(76,175,119,0.15)', color: '#4caf77' };
  if (e.includes('pend')) return { bg: 'rgba(89,165,255,0.15)', color: '#59a5ff' };
  if (e.includes('cancel')) return { bg: 'rgba(244,67,54,0.15)', color: '#f44336' };
  return { bg: 'rgba(255,107,0,0.15)', color: '#FF6B00' };
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

async function cargarDashboardDatos() {
  const res = await fetchWithAuth('/api/admin/analitica/dashboard');
  if (!res || !res.ok) {
    const tbody = document.getElementById('dash-pedidos-recientes-body');
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="padding:14px 20px;opacity:.65;">No se pudieron cargar los datos</td></tr>';
    }
    return;
  }

  const data = await res.json();
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('dash-ventas', formatoSoles(data.ventas_hoy));
  setText('dash-ventas-sub', formatoPctVsAyer(data.ventas_hoy, data.ventas_ayer));
  setText('dash-pedidos-cant', String(data.pedidos_hoy ?? 0));
  setText('dash-pedidos-sub', textoPedidosVsAyer(data.pedidos_hoy ?? 0, data.pedidos_ayer ?? 0));
  setText('dash-empleados', String(data.empleados ?? 0));
  setText('dash-productos', String(data.productos_activos ?? 0));
  setText('dash-productos-sub', `${data.productos_inactivos ?? 0} no disponibles / inactivos`);

  const tbody = document.getElementById('dash-pedidos-recientes-body');
  if (!tbody) return;

  const lista = data.pedidos_recientes || [];
  if (!lista.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="padding:14px 20px;opacity:.65;">Sin pedidos recientes</td></tr>';
    return;
  }

  tbody.innerHTML = lista
    .map((row) => {
      const { bg, color } = estiloEstadoBadge(row.estado);
      return `<tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
      <td style="padding: 14px 20px; font-family: 'Epilogue', sans-serif;">#${row.ID_PEDIDO}</td>
      <td style="padding: 14px 20px;">${escapeHtml(row.cliente)}</td>
      <td style="padding: 14px 20px; font-weight: 600;">${formatoSoles(row.total)}</td>
      <td style="padding: 14px 20px;"><span style="background: ${bg}; color: ${color}; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${escapeHtml(row.estado)}</span></td>
    </tr>`;
    })
    .join('');
}

function mostrarDashboard(e) {
  if (e) e.preventDefault();
  const contenido = document.getElementById('admin-contenido');
  if (!contenido || !dashboardHTML) return;
  contenido.innerHTML = dashboardHTML;
  setPageTitle('Dashboard');
  setActiveNav('btn-dashboard');
  void cargarDashboardDatos();
}

document.addEventListener('DOMContentLoaded', () => {
  const userData = protectRoute('admin');
  if (!userData) return;

  const contenido = document.getElementById('admin-contenido');
  if (contenido) {
    dashboardHTML = contenido.innerHTML;
  }

  const adminNombreEl = document.getElementById('admin-nombre');
  if (adminNombreEl) {
    adminNombreEl.textContent = userData.usuario;
  }

  // Delegación: accesos del dashboard (siguen funcionando tras restaurar innerHTML)
  const main = document.querySelector('.admin-main');
  if (main) {
    main.addEventListener('click', (e) => {
      const link = e.target.closest(
        'a#shortcut-productos, a#shortcut-empleados, a#shortcut-pedidos, a#shortcut-promociones, a#shortcut-pedidos-link'
      );
      if (!link || !link.id) return;
      const shortcuts = {
        'shortcut-productos': 'btn-productos',
        'shortcut-empleados': 'btn-usuarios',
        'shortcut-pedidos': 'btn-pedidos',
        'shortcut-promociones': 'btn-promociones',
        'shortcut-pedidos-link': 'btn-pedidos'
      };
      const navId = shortcuts[link.id];
      if (!navId) return;
      e.preventDefault();
      document.getElementById(navId)?.click();
    });
  }

  document.getElementById('btn-dashboard')?.addEventListener('click', mostrarDashboard);

  document.getElementById('btn-productos')?.addEventListener('click', async (e) => {
    e.preventDefault();
    setPageTitle('Gestión de productos');
    setActiveNav('btn-productos');
    await cargarGestionProductos();
  });

  document.getElementById('btn-usuarios')?.addEventListener('click', async (e) => {
    e.preventDefault();
    setPageTitle('Gestión de empleados');
    setActiveNav('btn-usuarios');
    await cargarGestionEmpleados();
  });

  document.getElementById('btn-promociones')?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('btn-promociones');
    cargarGestionPromociones();
  });

  document.getElementById('btn-pedidos')?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('btn-pedidos');
    cargarGestionPedidos();
  });

  document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
  });

  setActiveNav('btn-dashboard');
  void cargarDashboardDatos();
});
