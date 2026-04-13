const express = require('express');
const router = express.Router();
const mozo = require('../controllers/mozoController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

router.get('/listos', 
    authenticateJWT, 
    authorizeRoles('mozo'), 
    mozo.listarListos);

router.put('/:id/procesar', 
    authenticateJWT, 
    authorizeRoles('mozo'), 
    mozo.procesarPedido);

    /* */

router.put('/:id/entregado', 
    authenticateJWT, 
    authorizeRoles('mozo'),
     mozo.confirmarEntrega);

// Mesas
router.get('/mesas',
     authenticateJWT,
      authorizeRoles('mozo'), 
      mozo.listarMesas);

router.put('/mesas/:id/toggle', 
    authenticateJWT, 
    authorizeRoles('mozo'), 
    mozo.toggleMesa);

module.exports = router;