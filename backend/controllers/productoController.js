const client = require('../models/productoModel');
const { obtenerPerfilCliente, obtenerDetallePedidoCliente,obtenerPedidosCliente } = require('../models/clienteModel');

async function listarProductos(req, res) {
  try {
    const productos = await client.obtenerProductos();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}


//funcion para la busqueda de productos 
async function buscarProductos(req, res) {
  try {
    const nombre = req.query.nombre;
    if (!nombre) {
      return res.status(400).json({ mensaje: 'Se requiere el nombre para buscar.' });
    }

    const resultados = await client.buscarProductosPorNombre(nombre);
    res.json(resultados);
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

async function calcularPedido(req, res) {

  try {

    const { productos } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        mensaje: "El carrito está vacío"
      });
    }

    const resumen = await client.calcularResumenPedido(productos);

    res.json(resumen);
  } catch (error) {

    console.error(error);

    res.status(500).json({
      mensaje: "Error al calcular el resumen del pedido"
    });
    console.log("Error al calcular el resumen del pedido:", error);
  }
}

//Funcion ya exportada para obtener el perfil del cliente 
async function obtenerPerfil(req, res) {
  try {
    const idUsuario = req.user.id; //🔥viene del JWT

    const perfil = await obtenerPerfilCliente(idUsuario);

    if (!perfil) {
      return res.status(404).json({ mensaje: "Perfil no encontrado" });
    }

    res.json(perfil);

  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener perfil" });
  }
};


// 1. LISTAR HISTORIAL DE PEDIDOS
// GET /api/cliente/pedidos
async function listarPedidosCliente(req, res) {
  try {
    const idUsuario = req.user.id; // 🔥 viene del JWT

    const pedidos = await obtenerPedidosCliente(idUsuario);

    res.json(pedidos);

  } catch (error) {
    console.error("Error en listarPedidosCliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedidos"
    });
  }
}



// 2. DETALLE DE PEDIDO
// GET /api/cliente/pedidos/:id
async function detallePedidoCliente(req, res) {
  try {
    const idUsuario = req.user.cliente;
    const idPedido = parseInt(req.params.id);

    if (isNaN(idPedido)) {
      return res.status(400).json({
        success: false,
        message: "ID de pedido inválido"
      });
    }

    console.log(`Obteniendo detalle para pedido ID ${idPedido} del usuario ID ${idUsuario}`);
    const detalle = await obtenerDetallePedidoCliente(idPedido, idUsuario);

    if (!detalle || !detalle.pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    res.json(detalle);

  } catch (error) {
    console.error("Error en detallePedidoCliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle del pedido"
    });
  }
}


module.exports = {
  listarProductos,
  buscarProductos,
  calcularPedido,
  obtenerPerfil,
  listarPedidosCliente,
  detallePedidoCliente
};