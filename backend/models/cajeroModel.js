const { poolPromise, sql } = require('../db');

async function obtenerPagosPendientesEfectivo() {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        P.ID_PAGO,
        P.ID_PEDIDO,
        P.MONTO_TOTAL,
        P.FECHA_PAGO,
        MP.DESCRIPCION AS METODO_PAGO

      FROM Pagos P
      INNER JOIN Modalidades_Pago MP 
        ON P.ID_MODALIDAD = MP.ID_MODALIDAD

      WHERE 
        P.ID_ESTADO_PAGO = 1 -- pendiente
        AND MP.DESCRIPCION = 'Efectivo' -- 🔥 CLAVE

      ORDER BY P.ID_PAGO DESC
    `);

    return result.recordset;

  } catch (error) {
    console.error("Error obtenerPagosPendientesEfectivo:", error);
    throw error;
  }
}

async function pagarEfectivo(idPago) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idPago", sql.Int, idPago)
      .query(`
        UPDATE Pagos
        SET 
          ID_ESTADO_PAGO = 2, -- pagado
          FECHA_PAGO = GETDATE(),
          NUMERO_PAGO = (
            SELECT ISNULL(MAX(NUMERO_PAGO), 0) + 1 FROM Pagos
          )
        WHERE 
          ID_PAGO = @idPago
          AND ID_ESTADO_PAGO = 1 -- 🔥 evita doble pago
      `);

    return result.rowsAffected[0] > 0;

  } catch (error) {
    console.error("Error pagarEfectivo:", error);
    throw error;
  }
}

async function obtenerPagosRealizados() {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        P.ID_PAGO,
        P.ID_PEDIDO,
        P.MONTO_TOTAL,
        P.FECHA_PAGO,
        P.NUMERO_PAGO,
        MP.DESCRIPCION AS METODO_PAGO

      FROM Pagos P
      INNER JOIN Modalidades_Pago MP 
        ON P.ID_MODALIDAD = MP.ID_MODALIDAD

      WHERE P.ID_ESTADO_PAGO = 2 -- 🔥 pagado

      ORDER BY P.FECHA_PAGO DESC
    `);

    return result.recordset;

  } catch (error) {
    console.error("Error obtenerPagosRealizados:", error);
    throw error;
  }
}

module.exports = {
  obtenerPagosPendientesEfectivo,
  pagarEfectivo,
  obtenerPagosRealizados
};

