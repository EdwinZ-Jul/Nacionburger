// routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const authenticateJWT  = require('../middlewares/authMiddleware');
const authorizeRoles   = require('../middlewares/authorizeRoles');

// ─── PÚBLICAS ─────────────────────────────────────────────────────────────────

// Listar mesas disponibles (público: el cliente necesita verlas antes de loguearse)
router.get('/mesas', pedidosController.listarMesas);

// Métodos de pago
router.get('/metodos-pago', pedidosController.listarMetodosPago);

// Webhook de MercadoPago (público para que MP pueda llamarlo)
router.post('/pagos/webhook', pedidosController.webhookMP);

// ─── PROTEGIDAS (solo cliente) ────────────────────────────────────────────────

// Pedido en efectivo — consumo en tienda
router.post(
  '/pedidos/tienda-efectivo',
  authenticateJWT,
  authorizeRoles('cliente'),
  pedidosController.crearPedidoEfectivo
);

// Checkout Pro — tarjeta / yape / plin (redirige a MercadoPago)
router.post(
  '/pedidos/checkout-pro',
  authenticateJWT,
  authorizeRoles('cliente'),
  pedidosController.crearPedidoCheckoutPro
);

// Pedido con delivery
router.post(
  '/pedidos/delivery',
  authenticateJWT,
  authorizeRoles('cliente'),
  pedidosController.crearPedidoDelivery
);

module.exports = router;