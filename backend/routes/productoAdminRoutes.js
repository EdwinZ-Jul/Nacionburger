//routes/productoAdminRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('../controllers/productoAdminController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

//Ruta para listar productos (solo admin)
router.get(
  '/listar-productos',
  authenticateJWT,
  authorizeRoles('admin'),
  admin.listarProductosAdmin
);

//Ruta para listar categorías (solo admin)
router.get(
  '/categorias',
  authenticateJWT,
  authorizeRoles('admin'),
  admin.listarCategoriasAdmin
);

//Registrar producto (solo admin) — ruta '/api/admin/productos' usada por el frontend
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('admin'),
  admin.registrarProducto
);

//Alias alternativo: '/api/admin/productos/registrar-producto'
router.post(
  '/registrar-producto',
  authenticateJWT,
  authorizeRoles('admin'),
  admin.registrarProducto
);

// Actualizar producto (solo admin)
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles('admin'),
  admin.editarProducto
);

// Eliminar producto (solo admin)
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('admin'),
  admin.borrarProducto
);

module.exports = router;