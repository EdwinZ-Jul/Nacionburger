const {obtenerPedidosPorEstado, obtenerPedidoConDetalles, actualizarEstadoPedido, obtenerProductos, cambiarEstadoProducto} = require('../models/cocineroModel');

// Listar pedidos pendientes
exports.listarPendientes = async (req, res) => {
  try {
    const pedidos = await obtenerPedidosPorEstado(1);
    res.json(pedidos);
  } catch (error) {
    console.error("Error al listar pendientes:", error);
    res.status(500).json({ mensaje: "Error al obtener pedidos pendientes" });
  }
};

// Listar pedidos en preparación
exports.listarEnPreparacion = async (req, res) => {
  try {
    const pedidos = await obtenerPedidosPorEstado(2);
    res.json(pedidos);
  } catch (error) {
    console.error("Error al listar en preparación:", error);
    res.status(500).json({ mensaje: "Error al obtener pedidos en preparación" });
  }
};

// Marcar pedido como en preparación
exports.marcarEnPreparacion = async (req, res) => {
  try {
    const { id } = req.params;
    await actualizarEstadoPedido(id, 2);
    res.json({ mensaje: `Pedido ${id} está en preparación.` });
  } catch (error) {
    console.error("Error al cambiar a en preparación:", error);
    res.status(500).json({ mensaje: "Error al actualizar estado" });
  }
};

// Marcar pedido como listo
exports.marcarListo = async (req, res) => {
  try {
    const { id } = req.params;
    await actualizarEstadoPedido(id, 3);
    res.json({ mensaje: `Pedido ${id} está listo.` });
  } catch (error) {
    console.error("Error al marcar listo:", error);
    res.status(500).json({ mensaje: "Error al actualizar estado" });
  }
};

//Obtener detalles de un pedido
exports.obtenerDetallesPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const detalles = await obtenerPedidoConDetalles(id);
    if (!detalles.length) {
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    }
    res.json(detalles);
  } catch (error) {
    console.error("Error al obtener detalles:", error);
    res.status(500).json({ mensaje: "Error al obtener detalles del pedido" });
  }
};

// Listar pedidos listos
exports.listarListos = async (req, res) => {
  try {
    const pedidos = await obtenerPedidosPorEstado(3);
    res.json(pedidos);
  } catch (error) {
    console.error("Error al listar listos:", error);
    res.status(500).json({ mensaje: "Error al obtener pedidos listos" });
  }
};

exports.listarProductos = async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json(productos);
  } catch (error) {
    console.error("Error al listar productos:", error);
    res.status(500).json({ mensaje: "Error al obtener productos" });
  }
};

exports.toggleProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (![1, 2].includes(estado)) {
      return res.status(400).json({ mensaje: "Estado inválido" });
    }

    const actualizado = await cambiarEstadoProducto(id, estado);

    if (!actualizado) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json({
      success: true,
      nuevo_estado: estado
    });

  } catch (error) {
    console.error("Error al cambiar estado producto:", error);
    res.status(500).json({ mensaje: "Error al actualizar producto" });
  }
};
