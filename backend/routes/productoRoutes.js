const express = require('express');
const router = express.Router();
const cliente = require('../controllers/productoController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

//URL Padre = /api

router.get('/productos', cliente.listarProductos);

router.get('/productos/buscar', cliente.buscarProductos);

router.post('/pedido/resumen',
    authenticateJWT,
    authorizeRoles('cliente'),
    cliente.calcularPedido
);

router.get('/cliente/perfil',
    authenticateJWT,
    authorizeRoles('cliente'),
    cliente.obtenerPerfil
);

router.get(
  '/cliente/pedidos',
  authenticateJWT,
  authorizeRoles('cliente'),
  cliente.listarPedidosCliente
);

router.get(
  '/cliente/pedidos/:id',
  authenticateJWT,
  authorizeRoles('cliente'),
  cliente.detallePedidoCliente
);

module.exports = router;