// models/ubicacionModel.js
const { poolPromise, sql } = require('../db');

async function obtenerProvincias() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT ID_PROVINCIA, NOMBRE FROM Provincias ORDER BY NOMBRE
  `);
  return result.recordset;
}

async function obtenerDistritosPorProvincia(id_provincia) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id_provincia', sql.Int, id_provincia)
    .query(`
      SELECT ID_DISTRITO, NOMBRE, ID_PROVINCIA
      FROM Distritos
      WHERE ID_PROVINCIA = @id_provincia
      ORDER BY NOMBRE
    `);
  return result.recordset;
}

module.exports = { obtenerProvincias, obtenerDistritosPorProvincia };
