// controllers/promocionesController.js
const promocionesModel = require('../models/promocionesModel');

async function listarPromociones(req, res) {
  try {
    const promociones = await promocionesModel.obtenerPromociones();
    res.json(promociones);
  } catch (err) {
    console.error('Error listarPromociones:', err);
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
}

async function obtenerPromocion(req, res) {
  try {
    const data = await promocionesModel.obtenerPromocionPorId(Number(req.params.id));
    if (!data.promocion) return res.status(404).json({ error: 'Promoción no encontrada' });
    res.json(data);
  } catch (err) {
    console.error('Error obtenerPromocion:', err);
    res.status(500).json({ error: 'Error al obtener promoción' });
  }
}

async function crearPromocion(req, res) {
  try {
    const { descripcion, descuento, fecha_inicio, fecha_fin, productos } = req.body;
    if (!descripcion || !descuento || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (descuento < 0 || descuento > 100) {
      return res.status(400).json({ error: 'Descuento debe estar entre 0 y 100' });
    }
    if (new Date(fecha_fin) < new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' });
    }
    const result = await promocionesModel.crearPromocion({ descripcion, descuento, fecha_inicio, fecha_fin, productos });
    res.status(201).json({ message: 'Promoción creada correctamente', ...result });
  } catch (err) {
    console.error('Error crearPromocion:', err);
    res.status(500).json({ error: 'Error al crear promoción' });
  }
}

async function actualizarPromocion(req, res) {
  try {
    const { descripcion, descuento, fecha_inicio, fecha_fin, productos } = req.body;
    if (!descripcion || !descuento || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    await promocionesModel.actualizarPromocion(Number(req.params.id), { descripcion, descuento, fecha_inicio, fecha_fin, productos });
    res.json({ message: 'Promoción actualizada correctamente' });
  } catch (err) {
    console.error('Error actualizarPromocion:', err);
    res.status(500).json({ error: 'Error al actualizar promoción' });
  }
}

async function eliminarPromocion(req, res) {
  try {
    await promocionesModel.eliminarPromocion(Number(req.params.id));
    res.json({ message: 'Promoción eliminada correctamente' });
  } catch (err) {
    console.error('Error eliminarPromocion:', err);
    res.status(500).json({ error: 'Error al eliminar promoción' });
  }
}

async function listarProductosActivos(req, res) {
  try {
    const productos = await promocionesModel.obtenerProductosActivos();
    res.json(productos);
  } catch (err) {
    console.error('Error listarProductosActivos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

/** Público: platillos con promo vigente (menú cliente / pedido.html). */
async function listarPromocionesActivasPublico(req, res) {
  try {
    const data = await promocionesModel.obtenerPlatillosConPromocionActiva();
    res.json(data);
  } catch (err) {
    console.error('Error listarPromocionesActivasPublico:', err);
    res.status(500).json({ error: 'Error al obtener promociones activas' });
  }
}

module.exports = {
  listarPromociones,
  obtenerPromocion,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  listarProductosActivos,
  listarPromocionesActivasPublico
};
