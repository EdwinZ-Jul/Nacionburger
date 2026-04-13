//routes/cocineroRoutes.js
const express = require('express');
const router = express.Router();
const cocinero = require('../controllers/cocineroController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

//Listar pedidos pendientes
router.get(
    '/pendientes',
    authenticateJWT,
    authorizeRoles('cocinero'),
    cocinero.listarPendientes
);

//Listar pedidos en preparación
router.get(
    '/en-preparacion',
    authenticateJWT,
    authorizeRoles('cocinero'),
    cocinero.listarEnPreparacion
);

router.get(
    '/listos',
    authenticateJWT,
    authorizeRoles('cocinero'),
    cocinero.listarListos
);

//Actualizar estado
router.put(
    '/:id/en-preparacion',
    authenticateJWT,
    authorizeRoles('cocinero'),
    cocinero.marcarEnPreparacion
);

//Marcar como listo
router.put(
    '/:id/listo',
    authenticateJWT,
    authorizeRoles('cocinero'),
    cocinero.marcarListo
);

// Detalles de un pedido
router.get(
    '/:id/detalles',
    authenticateJWT,
    authorizeRoles('cocinero'),
    cocinero.obtenerDetallesPedido
);

// Obtener productos
router.get(
  '/productos',
  authenticateJWT,
  authorizeRoles('cocinero'),
  cocinero.listarProductos
);

// Toggle producto
router.put(
  '/productos/:id/toggle',
  authenticateJWT,
  authorizeRoles('cocinero'),
  cocinero.toggleProducto
);

module.exports = router;
