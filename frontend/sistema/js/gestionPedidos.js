// js/gestionPedidos.js  — Analítica + Exportar Excel para Admin
import { fetchWithAuth } from './authGuard.js';

export function cargarGestionPedidos() {
  const contenido = document.getElementById('admin-contenido');
  document.getElementById('admin-page-title').textContent = 'Análisis de Pedidos';

  contenido.innerHTML = `
    <div class="analitica-modulo">

      <!-- FILTROS DE FECHA -->
      <div class="analitica-toolbar">
        <div class="analitica-filtros">
          <div class="analitica-fecha-group">
            <label>Desde</label>
            <input type="date" id="an-fecha-inicio" class="analitica-input">
          </div>
          <div class="analitica-fecha-group">
            <label>Hasta</label>
            <input type="date" id="an-fecha-fin" class="analitica-input">
          </div>
          <button class="analitica-btn analitica-btn-primary" onclick="aplicarFiltros()">
            🔍 Filtrar
          </button>
        </div>
        <button class="analitica-btn analitica-btn-excel" onclick="exportarExcel()">
          📥 Exportar Excel
        </button>
      </div>

      <!-- KPI CARDS -->
      <div class="analitica-kpis" id="an-kpis">
        <div class="an-kpi-card an-kpi-orange">
          <div class="an-kpi-icon">💰</div>
          <div class="an-kpi-data">
            <span class="an-kpi-label">Ingresos Totales</span>
            <span class="an-kpi-valor" id="kpi-ingresos">—</span>
          </div>
        </div>
        <div class="an-kpi-card an-kpi-green">
          <div class="an-kpi-icon">📋</div>
          <div class="an-kpi-data">
            <span class="an-kpi-label">Pedidos Totales</span>
            <span class="an-kpi-valor" id="kpi-pedidos">—</span>
          </div>
        </div>
        <div class="an-kpi-card an-kpi-blue">
          <div class="an-kpi-icon">📅</div>
          <div class="an-kpi-data">
            <span class="an-kpi-label">Ingresos Hoy</span>
            <span class="an-kpi-valor" id="kpi-ingresos-hoy">—</span>
          </div>
        </div>
        <div class="an-kpi-card an-kpi-red">
          <div class="an-kpi-icon">🍔</div>
          <div class="an-kpi-data">
            <span class="an-kpi-label">Pedidos Hoy</span>
            <span class="an-kpi-valor" id="kpi-pedidos-hoy">—</span>
          </div>
        </div>
      </div>

      <!-- GRID DE GRAFICOS -->
      <div class="analitica-grid">

        <!-- PRODUCTOS MÁS VENDIDOS -->
        <div class="an-card an-card-wide">
          <div class="an-card-header">
            <h3>🍔 Productos Más Vendidos</h3>
          </div>
          <div id="an-productos" class="an-barras-container">
            <div class="an-loading">⏳ Cargando...</div>
          </div>
        </div>

        <!-- MÉTODOS DE PAGO -->
        <div class="an-card">
          <div class="an-card-header">
            <h3>💳 Métodos de Pago</h3>
          </div>
          <div id="an-metodos" class="an-donut-container">
            <div class="an-loading">⏳ Cargando...</div>
          </div>
        </div>

        <!-- MODALIDADES DE ENTREGA -->
        <div class="an-card">
          <div class="an-card-header">
            <h3>🚚 Modalidades de Entrega</h3>
          </div>
          <div id="an-modalidades" class="an-donut-container">
            <div class="an-loading">⏳ Cargando...</div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Cargar todos los datos
  cargarKPIs();
  cargarProductosVendidos();
  cargarMetodosPago();
  cargarModalidades();

  window.aplicarFiltros = aplicarFiltros;
  window.exportarExcel  = exportarExcel;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
async function cargarKPIs() {
  try {
    const res  = await fetchWithAuth('/api/admin/analitica/resumen');
    const data = await res.json();
    document.getElementById('kpi-ingresos').textContent     = `S/. ${Number(data.ingresos_total || 0).toFixed(2)}`;
    document.getElementById('kpi-pedidos').textContent      = data.pedidos_total  || 0;
    document.getElementById('kpi-ingresos-hoy').textContent = `S/. ${Number(data.ingresos_hoy || 0).toFixed(2)}`;
    document.getElementById('kpi-pedidos-hoy').textContent  = data.pedidos_hoy   || 0;
  } catch (err) {
    console.error('Error cargarKPIs:', err);
  }
}

// ─── PRODUCTOS MÁS VENDIDOS ───────────────────────────────────────────────────
async function cargarProductosVendidos() {
  const container = document.getElementById('an-productos');
  try {
    const res  = await fetchWithAuth('/api/admin/analitica/productos-vendidos');
    const data = await res.json();
    if (!data.length) { container.innerHTML = '<p class="an-empty">Sin datos suficientes</p>'; return; }

    const maxVal = Math.max(...data.map(d => d.total_vendido));
    container.innerHTML = data.map((d, i) => `
      <div class="an-barra-item">
        <div class="an-barra-label" title="${d.producto}">${d.producto}</div>
        <div class="an-barra-wrap">
          <div class="an-barra-fill" style="width:${(d.total_vendido/maxVal*100).toFixed(1)}%; animation-delay:${i*0.1}s">
            <span class="an-barra-val">${d.total_vendido}</span>
          </div>
        </div>
        <div class="an-barra-ingresos">S/. ${Number(d.ingresos_generados||0).toFixed(2)}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p style="color:red">Error al cargar</p>';
  }
}

// ─── MÉTODOS DE PAGO ──────────────────────────────────────────────────────────
const COLORES = ['#D92626','#FFB800','#4CAF50','#2196F3','#9C27B0','#FF5722'];

async function cargarMetodosPago() {
  const container = document.getElementById('an-metodos');
  try {
    const res  = await fetchWithAuth('/api/admin/analitica/metodos-pago');
    const data = await res.json();
    if (!data.length) { container.innerHTML = '<p class="an-empty">Sin datos suficientes</p>'; return; }
    container.innerHTML = renderDonut(data, 'metodo_pago', 'cantidad_pagos', 'total_recaudado');
  } catch (err) {
    container.innerHTML = '<p style="color:red">Error al cargar</p>';
  }
}

async function cargarModalidades() {
  const container = document.getElementById('an-modalidades');
  try {
    const res  = await fetchWithAuth('/api/admin/analitica/modalidades-entrega');
    const data = await res.json();
    if (!data.length) { container.innerHTML = '<p class="an-empty">Sin datos suficientes</p>'; return; }
    container.innerHTML = renderDonut(data, 'modalidad_entrega', 'cantidad_pedidos', 'ingresos');
  } catch (err) {
    container.innerHTML = '<p style="color:red">Error al cargar</p>';
  }
}

function renderDonut(data, labelKey, valKey, montoKey) {
  const total = data.reduce((s, d) => s + Number(d[valKey]), 0);
  let startAngle = -Math.PI / 2;
  const r = 70; const cx = 90; const cy = 90;

  const paths = data.map((d, i) => {
    const pct   = total ? Number(d[valKey]) / total : 0;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + r * Math.cos(startAngle);
    const y2 = cy + r * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${COLORES[i % COLORES.length]}" opacity="0.9"/>`;
  }).join('');

  const leyenda = data.map((d, i) => `
    <div class="an-leyenda-item">
      <span class="an-leyenda-color" style="background:${COLORES[i % COLORES.length]}"></span>
      <span class="an-leyenda-texto">${d[labelKey]}</span>
      <span class="an-leyenda-val">${d[valKey]} (S/.${Number(d[montoKey]||0).toFixed(0)})</span>
    </div>
  `).join('');

  return `
    <div class="an-donut-wrap">
      <svg viewBox="0 0 180 180" class="an-donut-svg">
        ${paths}
        <circle cx="${cx}" cy="${cy}" r="40" fill="#1e1e2e"/>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="14" font-weight="bold">${total}</text>
      </svg>
      <div class="an-leyenda">${leyenda}</div>
    </div>
  `;
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
function aplicarFiltros() {
  cargarKPIs();
  cargarProductosVendidos();
  cargarMetodosPago();
  cargarModalidades();
}

// ─── EXPORTAR EXCEL ───────────────────────────────────────────────────────────
async function exportarExcel() {
  const fi = document.getElementById('an-fecha-inicio')?.value || '';
  const ff = document.getElementById('an-fecha-fin')?.value   || '';
  const token = sessionStorage.getItem('token');

  let url = '/api/admin/analitica/exportar-excel';
  const params = [];
  if (fi) params.push(`fecha_inicio=${fi}`);
  if (ff) params.push(`fecha_fin=${ff}`);
  if (params.length) url += '?' + params.join('&');

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Error al generar el archivo');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pedidos_nacionburger_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert('❌ Error al exportar: ' + err.message);
  }
}
