const { poolPromise, sql } = require('../db');

//Obtener perfil del cliente
async function obtenerPerfilCliente(idUsuario) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          C.NOMBRES,
          C.APELLIDOS,
          C.DNI,
          C.TELEFONO,
          C.EMAIL
        FROM Usuarios U
        INNER JOIN Clientes C 
          ON U.ID_CLIENTE = C.ID_CLIENTE
        WHERE U.ID_USUARIO = @idUsuario
      `);

    return result.recordset[0];

  } catch (error) {
    console.error("Error obtenerPerfilCliente:", error);
    throw error;
  }
}

//Funcion para obtener el historial de pedidos del cliente
async function obtenerPedidosCliente(idUsuario) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          P.ID_PEDIDO,
          P.FECHA_HORA,
          EP.DESCRIPCION AS ESTADO,
          TE.DESCRIPCION AS TIPO_ENTREGA,
          ISNULL(PG.MONTO_TOTAL, 0) AS TOTAL,
          SUM(DP.CANTIDAD) AS TOTAL_PRODUCTOS
        FROM Pedidos P
        INNER JOIN Usuarios U ON U.ID_CLIENTE = P.ID_CLIENTE
        JOIN Estados_Pedido EP ON P.ID_ESTADO = EP.ID_ESTADO
        JOIN Tipos_Entrega TE ON P.ID_TIPO_ENTREGA = TE.ID_TIPO_ENTREGA
        LEFT JOIN Pagos PG 
          ON PG.ID_PEDIDO = P.ID_PEDIDO 
          AND PG.ID_ESTADO_PAGO = 2 -- 🔥 solo pagados
        JOIN Detalle_Pedidos DP ON DP.ID_PEDIDO = P.ID_PEDIDO
        WHERE U.ID_USUARIO = @idUsuario
        GROUP BY 
          P.ID_PEDIDO,
          P.FECHA_HORA,
          EP.DESCRIPCION,
          TE.DESCRIPCION,
          PG.MONTO_TOTAL
        ORDER BY P.ID_PEDIDO DESC
      `);

    return result.recordset;

  } catch (error) {
    console.error("Error obtenerPedidosCliente:", error);
    throw error;
  }
}


//Funcion para obtener los detalles de un pedidos de un cliente
async function obtenerDetallePedidoCliente(idPedido, idUsuario) {
  try {
    const pool = await poolPromise;

    // 🔹 1. INFO DEL PEDIDO
    const pedidoResult = await pool.request()
      .input("idPedido", sql.Int, idPedido)
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          P.ID_PEDIDO,
          P.FECHA_HORA,
          EP.DESCRIPCION AS ESTADO,
          TE.DESCRIPCION AS TIPO_ENTREGA,
          ISNULL(PG.MONTO_TOTAL, 0) AS TOTAL
        FROM Pedidos P
        INNER JOIN Usuarios U ON U.ID_CLIENTE = P.ID_CLIENTE
        JOIN Estados_Pedido EP ON P.ID_ESTADO = EP.ID_ESTADO
        JOIN Tipos_Entrega TE ON P.ID_TIPO_ENTREGA = TE.ID_TIPO_ENTREGA
        LEFT JOIN Pagos PG 
          ON PG.ID_PEDIDO = P.ID_PEDIDO 
          AND PG.ID_ESTADO_PAGO = 2
        WHERE 
          P.ID_PEDIDO = @idPedido
          AND U.ID_CLIENTE = @idUsuario
      `);

    // 🔹 2. PRODUCTOS
    const productosResult = await pool.request()
      .input("idPedido", sql.Int, idPedido)
      .query(`
        SELECT 
          PL.NOMBRE AS PRODUCTO,
          DP.CANTIDAD,
          DP.PRECIO_UNITARIO,
          DP.TOTAL AS SUBTOTAL
        FROM Detalle_Pedidos DP
        INNER JOIN Carta PL ON DP.ID_PLATILLO = PL.ID_PLATILLO
        WHERE DP.ID_PEDIDO = @idPedido
      `);
      console.log("Resultado detalle pedido:", {
        pedido: pedidoResult.recordset[0],
        productos: productosResult.recordset
      });

    return {
      pedido: pedidoResult.recordset[0],
      productos: productosResult.recordset
    };

  } catch (error) {
    console.error("Error obtenerDetallePedidoCliente:", error);
    throw error;
  }
}

module.exports = {
  obtenerPerfilCliente,
  obtenerPedidosCliente,
  obtenerDetallePedidoCliente
};