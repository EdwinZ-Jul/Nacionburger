const express = require('express');
const router = express.Router();
const cajero = require('../controllers/cajeroController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

//URL base /api/cajero
router.get(
  '/pagos/pendientes/efectivo',
  authenticateJWT,
  authorizeRoles('cajero'),
  cajero.listarPendientesEfectivo
);

router.put(
  '/pagos/:id/cobrar',
  authenticateJWT,
  authorizeRoles('cajero'),
  cajero.cobrar
);

router.get(
  '/pagos/realizados',
  authenticateJWT,
  authorizeRoles('cajero'),
  cajero.listarPagosRealizados
);

module.exports = router;