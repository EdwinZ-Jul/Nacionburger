// routes/ubicacionRoutes.js
const express = require('express');
const router = express.Router();
const { listarProvincias, listarDistritos } = require('../controllers/ubicacionController');

// GET /api/provincias
router.get('/provincias', listarProvincias);

// GET /api/provincias/:id_provincia/distritos
router.get('/provincias/:id_provincia/distritos', listarDistritos);

module.exports = router;
