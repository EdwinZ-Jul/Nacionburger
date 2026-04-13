const mozo = require('../models/mozoModel');

exports.listarListos = async (req, res) => {
  try {
    const pedidos = await mozo.obtenerPedidosListos();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedidos listos" });
  }
};


exports.procesarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await mozo.obtenerTipoEntregaPedido(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    }

    let nuevoEstado;

    switch (pedido.ID_TIPO_ENTREGA) {
      case 1: // Local
      case 3: // Recojo
        nuevoEstado = 4; // Entregado
        break;

      case 2: // Delivery
        nuevoEstado = 5; // En camino
        break;

      default:
        return res.status(400).json({ mensaje: "Tipo de entrega inválido" });
    }

    await mozo.actualizarEstadoPedidoMozo(id, nuevoEstado);

    res.json({
      success: true,
      nuevo_estado: nuevoEstado
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al procesar pedido" });
  }
};

exports.confirmarEntrega = async (req, res) => {
  try {
    const { id } = req.params;

    await mozo.actualizarEstadoPedidoMozo(id, 4);

    res.json({
      success: true,
      nuevo_estado: 4
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al confirmar entrega" });
  }
};

exports.listarMesas = async (req, res) => {
  const mesas = await mozo.obtenerMesas();
  res.json(mesas);
};

exports.toggleMesa = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const ok = await mozo.cambiarEstadoMesa(id, estado);

  res.json({ success: ok });
};

