// controllers/ubicacionController.js
const ubicacionModel = require('../models/ubicacionModel');

async function listarProvincias(req, res) {
  try {
    const provincias = await ubicacionModel.obtenerProvincias();
    res.json(provincias);
  } catch (error) {
    console.error('Error listarProvincias:', error);
    res.status(500).json({ error: 'Error al obtener provincias' });
  }
}

async function listarDistritos(req, res) {
  try {
    const { id_provincia } = req.params;
    if (!id_provincia || isNaN(id_provincia)) {
      return res.status(400).json({ error: 'ID de provincia inválido' });
    }
    const distritos = await ubicacionModel.obtenerDistritosPorProvincia(Number(id_provincia));
    res.json(distritos);
  } catch (error) {
    console.error('Error listarDistritos:', error);
    res.status(500).json({ error: 'Error al obtener distritos' });
  }
}

module.exports = { listarProvincias, listarDistritos };
