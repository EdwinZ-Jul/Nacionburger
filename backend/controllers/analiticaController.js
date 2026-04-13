// controllers/analiticaController.js
const analiticaModel = require('../models/analiticaModel');

async function productosVendidos(req, res) {
  try {
    const data = await analiticaModel.obtenerProductosMasVendidos();
    res.json(data);
  } catch (err) {
    console.error('Error productosVendidos:', err);
    res.status(500).json({ error: 'Error al obtener productos vendidos' });
  }
}

async function metodosPago(req, res) {
  try {
    const data = await analiticaModel.obtenerMetodosPagoMasUsados();
    res.json(data);
  } catch (err) {
    console.error('Error metodosPago:', err);
    res.status(500).json({ error: 'Error al obtener métodos de pago' });
  }
}

async function modalidadesEntrega(req, res) {
  try {
    const data = await analiticaModel.obtenerModalidadesEntregaMasUsadas();
    res.json(data);
  } catch (err) {
    console.error('Error modalidadesEntrega:', err);
    res.status(500).json({ error: 'Error al obtener modalidades de entrega' });
  }
}

async function resumenVentas(req, res) {
  try {
    const data = await analiticaModel.obtenerResumenVentas();
    res.json(data);
  } catch (err) {
    console.error('Error resumenVentas:', err);
    res.status(500).json({ error: 'Error al obtener resumen de ventas' });
  }
}

async function dashboardAdmin(req, res) {
  try {
    const data = await analiticaModel.obtenerDashboardAdmin();
    res.json(data);
  } catch (err) {
    console.error('Error dashboardAdmin:', err);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
}

async function exportarExcel(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const pedidos = await analiticaModel.obtenerPedidosDetallados(fecha_inicio || null, fecha_fin || null);
    const buffer = analiticaModel.generarExcel(pedidos);

    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="pedidos_${fecha}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Error exportarExcel:', err);
    res.status(500).json({ error: 'Error al generar Excel' });
  }
}

module.exports = { productosVendidos, metodosPago, modalidadesEntrega, resumenVentas, dashboardAdmin, exportarExcel };
