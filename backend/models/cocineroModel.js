const { poolPromise, sql } = require('../db');

//Obtener pedidos por estado
async function obtenerPedidosPorEstado(idEstado) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idEstado", sql.Int, idEstado)
      .query(`
        SELECT 
        P.ID_PEDIDO, 
        P.FECHA_HORA, 
        P.ID_ESTADO,
        E.DESCRIPCION AS ESTADO,
        M.NUMERO AS NUMERO_MESA
        FROM Pedidos P
        LEFT JOIN Mesas M ON P.ID_MESA = M.ID_MESA
        INNER JOIN Estados_Pedido E ON P.ID_ESTADO = E.ID_ESTADO
        WHERE P.ID_ESTADO = @idEstado
        ORDER BY P.FECHA_HORA ASC
      `);

    return result.recordset;

  } catch (error) {
    console.error("Error en obtenerPedidosPorEstado:", error);
    throw error;
  }
}



//Cambiar estado del pedido
async function actualizarEstadoPedido(idPedido, idEstado) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idEstado", sql.Int, idEstado)
      .input("idPedido", sql.Int, idPedido)
      .query(`
        UPDATE Pedidos
        SET ID_ESTADO = @idEstado
        WHERE ID_PEDIDO = @idPedido
      `);

    return result.rowsAffected[0] > 0;

  } catch (error) {
    console.error("Error en actualizarEstadoPedido:", error);
    throw error;
  }
}

//Obtener detalles de un pedido específico
async function obtenerPedidoConDetalles(idPedido) {
  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("idPedido", sql.Int, idPedido)
      .query(`
        SELECT 
    P.ID_PEDIDO, 
    P.FECHA_HORA, 
    P.ID_ESTADO,
    E.DESCRIPCION AS ESTADO,
    M.NUMERO AS NUMERO_MESA,
    PL.NOMBRE AS NOMBRE_PLATILLO,
    DP.CANTIDAD, 
    DP.PRECIO_UNITARIO
    FROM Pedidos P
    LEFT JOIN Mesas M ON P.ID_MESA = M.ID_MESA
    INNER JOIN Detalle_Pedidos DP ON P.ID_PEDIDO = DP.ID_PEDIDO
    INNER JOIN Carta PL ON DP.ID_PLATILLO = PL.ID_PLATILLO
    INNER JOIN Estados_Pedido E ON P.ID_ESTADO = E.ID_ESTADO 
    WHERE P.ID_PEDIDO = @idPedido
      `);

    return result.recordset;

  } catch (error) {
    console.error("Error en obtenerPedidoConDetalles:", error);
    throw error;
  }
}

// Obtener todos los productos
async function obtenerProductos() {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT 
          C.ID_PLATILLO,
          C.NOMBRE AS NOMBRE_PLATILLO,
          C.DESCRIPCION,
          C.PRECIO,
          C.ID_ESTADO AS ESTADO,
          C.IMAGEN,
          CAT.CARPETA,
          CAT.DESCRIPCION AS CATEGORIA

        FROM Carta C
        LEFT JOIN Categoria_Productos CAT 
          ON C.ID_CATEGORIA = CAT.ID_CATEGORIA

        ORDER BY C.ID_PLATILLO DESC
      `);

    return result.recordset;

  } catch (error) {
    console.error("Error en obtenerProductos:", error);
    throw error;
  }
}

// Cambiar estado del producto
async function cambiarEstadoProducto(idProducto, estado) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idProducto", sql.Int, idProducto)
      .input("estado", sql.Int, estado)
      .query(`
        UPDATE Carta
        SET ID_ESTADO = @estado
        WHERE ID_PLATILLO = @idProducto
      `);

    return result.rowsAffected[0] > 0;

  } catch (error) {
    console.error("Error en cambiarEstadoProducto:", error);
    throw error;
  }
}


module.exports = {
  obtenerPedidosPorEstado,
  actualizarEstadoPedido,
  obtenerPedidoConDetalles,
  cambiarEstadoProducto,
  obtenerProductos
};
