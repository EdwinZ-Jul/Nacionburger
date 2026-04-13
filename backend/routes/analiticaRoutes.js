// routes/analiticaRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analiticaController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

const esAdmin = [authenticateJWT, authorizeRoles('admin')];

// GET /api/admin/analitica/dashboard — KPIs + pedidos recientes (panel inicio)
router.get('/dashboard',            esAdmin, ctrl.dashboardAdmin);

// GET /api/admin/analitica/resumen
router.get('/resumen',              esAdmin, ctrl.resumenVentas);

// GET /api/admin/analitica/productos-vendidos
router.get('/productos-vendidos',   esAdmin, ctrl.productosVendidos);

// GET /api/admin/analitica/metodos-pago
router.get('/metodos-pago',         esAdmin, ctrl.metodosPago);

// GET /api/admin/analitica/modalidades-entrega
router.get('/modalidades-entrega',  esAdmin, ctrl.modalidadesEntrega);

// GET /api/admin/analitica/exportar-excel?fecha_inicio=2025-01-01&fecha_fin=2025-12-31
router.get('/exportar-excel',       esAdmin, ctrl.exportarExcel);

module.exports = router;
