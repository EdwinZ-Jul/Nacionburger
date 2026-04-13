// models/promocionesModel.js
const { poolPromise, sql } = require('../db');

async function obtenerPromociones() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      P.ID_PROMOCION,
      P.DESCRIPCION,
      P.DESCUENTO,
      P.FECHA_INICIO,
      P.FECHA_FIN,
      CASE
        WHEN GETDATE() BETWEEN P.FECHA_INICIO AND P.FECHA_FIN THEN 'Activa'
        WHEN GETDATE() < P.FECHA_INICIO THEN 'Próxima'
        ELSE 'Expirada'
      END AS ESTADO,
      STRING_AGG(C.NOMBRE, ', ') AS PRODUCTOS
    FROM Promociones P
    LEFT JOIN Producto_Promocion PP ON P.ID_PROMOCION = PP.ID_PROMOCION
    LEFT JOIN Carta C ON PP.ID_PLATILLO = C.ID_PLATILLO
    GROUP BY P.ID_PROMOCION, P.DESCRIPCION, P.DESCUENTO, P.FECHA_INICIO, P.FECHA_FIN
    ORDER BY P.FECHA_INICIO DESC
  `);
  return result.recordset;
}

async function obtenerPromocionPorId(id_promocion) {
  const pool = await poolPromise;

  const promoResult = await pool.request()
    .input('id', sql.Int, id_promocion)
    .query(`SELECT * FROM Promociones WHERE ID_PROMOCION = @id`);

  const productosResult = await pool.request()
    .input('id', sql.Int, id_promocion)
    .query(`
      SELECT C.ID_PLATILLO, C.NOMBRE, C.PRECIO
      FROM Producto_Promocion PP
      JOIN Carta C ON PP.ID_PLATILLO = C.ID_PLATILLO
      WHERE PP.ID_PROMOCION = @id
    `);

  return {
    promocion: promoResult.recordset[0],
    productos: productosResult.recordset
  };
}

async function crearPromocion({ descripcion, descuento, fecha_inicio, fecha_fin, productos }) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = new sql.Request(transaction);
    const result = await req
      .input('desc', sql.VarChar(100), descripcion)
      .input('dto',  sql.Decimal(5,2), descuento)
      .input('fi',   sql.Date, fecha_inicio)
      .input('ff',   sql.Date, fecha_fin)
      .query(`
        INSERT INTO Promociones (DESCRIPCION, DESCUENTO, FECHA_INICIO, FECHA_FIN)
        OUTPUT INSERTED.ID_PROMOCION
        VALUES (@desc, @dto, @fi, @ff)
      `);

    const id_promocion = result.recordset[0].ID_PROMOCION;

    for (const id_platillo of (productos || [])) {
      const r2 = new sql.Request(transaction);
      await r2
        .input('id_platillo',  sql.Int, id_platillo)
        .input('id_promocion', sql.Int, id_promocion)
        .query(`
          INSERT INTO Producto_Promocion (ID_PLATILLO, ID_PROMOCION)
          VALUES (@id_platillo, @id_promocion)
        `);
    }

    await transaction.commit();
    return { id_promocion };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function actualizarPromocion(id_promocion, { descripcion, descuento, fecha_inicio, fecha_fin, productos }) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = new sql.Request(transaction);
    await req
      .input('id',   sql.Int, id_promocion)
      .input('desc', sql.VarChar(100), descripcion)
      .input('dto',  sql.Decimal(5,2), descuento)
      .input('fi',   sql.Date, fecha_inicio)
      .input('ff',   sql.Date, fecha_fin)
      .query(`
        UPDATE Promociones
        SET DESCRIPCION=@desc, DESCUENTO=@dto, FECHA_INICIO=@fi, FECHA_FIN=@ff
        WHERE ID_PROMOCION=@id
      `);

    // Borrar relaciones anteriores
    const r2 = new sql.Request(transaction);
    await r2.input('id', sql.Int, id_promocion)
      .query(`DELETE FROM Producto_Promocion WHERE ID_PROMOCION=@id`);

    // Insertar nuevas relaciones
    for (const id_platillo of (productos || [])) {
      const r3 = new sql.Request(transaction);
      await r3
        .input('id_platillo',  sql.Int, id_platillo)
        .input('id_promocion', sql.Int, id_promocion)
        .query(`
          INSERT INTO Producto_Promocion (ID_PLATILLO, ID_PROMOCION)
          VALUES (@id_platillo, @id_promocion)
        `);
    }

    await transaction.commit();
    return { updated: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function eliminarPromocion(id_promocion) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const r1 = new sql.Request(transaction);
    await r1.input('id', sql.Int, id_promocion)
      .query(`DELETE FROM Producto_Promocion WHERE ID_PROMOCION=@id`);

    const r2 = new sql.Request(transaction);
    await r2.input('id', sql.Int, id_promocion)
      .query(`DELETE FROM Promociones WHERE ID_PROMOCION=@id`);

    await transaction.commit();
    return { deleted: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function obtenerProductosActivos() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT C.ID_PLATILLO, C.NOMBRE, C.PRECIO,
           CP.DESCRIPCION AS CATEGORIA
    FROM Carta C
    JOIN Categoria_Productos CP ON C.ID_CATEGORIA = CP.ID_CATEGORIA
    WHERE C.ID_ESTADO = 1
    ORDER BY CP.DESCRIPCION, C.NOMBRE
  `);
  return result.recordset;
}

/** Platillos con promoción vigente hoy (un registro por platillo: mayor descuento). */
async function obtenerPlatillosConPromocionActiva() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    WITH Ranked AS (
      SELECT
        C.ID_PLATILLO,
        C.PRECIO AS PRECIO_LISTA,
        P.ID_PROMOCION,
        P.DESCRIPCION AS PROMO_DESCRIPCION,
        P.DESCUENTO,
        CAST(
          ROUND(
            CAST(C.PRECIO AS DECIMAL(12, 2)) * (100.0 - CAST(P.DESCUENTO AS FLOAT)) / 100.0,
            2
          ) AS DECIMAL(12, 2)
        ) AS PRECIO_PROMO,
        ROW_NUMBER() OVER (
          PARTITION BY C.ID_PLATILLO
          ORDER BY P.DESCUENTO DESC, P.ID_PROMOCION DESC
        ) AS rn
      FROM Carta C
      INNER JOIN Producto_Promocion PP ON C.ID_PLATILLO = PP.ID_PLATILLO
      INNER JOIN Promociones P ON PP.ID_PROMOCION = P.ID_PROMOCION
      WHERE C.ID_ESTADO = 1
        AND CONVERT(date, GETDATE()) BETWEEN CONVERT(date, P.FECHA_INICIO) AND CONVERT(date, P.FECHA_FIN)
    )
    SELECT ID_PLATILLO, PRECIO_LISTA, ID_PROMOCION, PROMO_DESCRIPCION, DESCUENTO, PRECIO_PROMO
    FROM Ranked
    WHERE rn = 1
    ORDER BY ID_PLATILLO
  `);
  return result.recordset;
}

module.exports = {
  obtenerPromociones,
  obtenerPromocionPorId,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  obtenerProductosActivos,
  obtenerPlatillosConPromocionActiva
};
