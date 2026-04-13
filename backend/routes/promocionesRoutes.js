// routes/promocionesRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/promocionesController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

const esAdmin = [authenticateJWT, authorizeRoles('admin')];

// GET  /api/admin/promociones           — listar todas
router.get('/',         esAdmin, ctrl.listarPromociones);

// GET  /api/admin/promociones/productos  — lista de productos activos (para el selector)
router.get('/productos', esAdmin, ctrl.listarProductosActivos);

// GET  /api/admin/promociones/:id       — ver una
router.get('/:id',      esAdmin, ctrl.obtenerPromocion);

// POST /api/admin/promociones           — crear
router.post('/',        esAdmin, ctrl.crearPromocion);

// PUT  /api/admin/promociones/:id       — actualizar
router.put('/:id',      esAdmin, ctrl.actualizarPromocion);

// DELETE /api/admin/promociones/:id     — eliminar
router.delete('/:id',   esAdmin, ctrl.eliminarPromocion);

module.exports = router;
