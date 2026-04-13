// models/analiticaModel.js
const { poolPromise, sql } = require('../db');
const XLSX = require('xlsx');

async function obtenerProductosMasVendidos() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT TOP 10
      C.NOMBRE AS producto,
      SUM(DP.CANTIDAD) AS total_vendido,
      SUM(DP.SUBTOTAL) AS ingresos_generados,
      CP.DESCRIPCION AS categoria
    FROM Detalle_Pedidos DP
    JOIN Carta C ON DP.ID_PLATILLO = C.ID_PLATILLO
    JOIN Categoria_Productos CP ON C.ID_CATEGORIA = CP.ID_CATEGORIA
    JOIN Pedidos P ON DP.ID_PEDIDO = P.ID_PEDIDO
    WHERE P.ID_ESTADO NOT IN (5)  -- excluir cancelados
    GROUP BY C.NOMBRE, CP.DESCRIPCION
    ORDER BY total_vendido DESC
  `);
  return result.recordset;
}

async function obtenerMetodosPagoMasUsados() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      MP.DESCRIPCION AS metodo_pago,
      COUNT(PG.ID_PAGO) AS cantidad_pagos,
      ISNULL(SUM(PG.MONTO_TOTAL), 0) AS total_recaudado
    FROM Pagos PG
    JOIN Modalidades_Pago MP ON PG.ID_MODALIDAD = MP.ID_MODALIDAD
    WHERE PG.ID_ESTADO_PAGO = 2  -- solo pagados
    GROUP BY MP.DESCRIPCION
    ORDER BY cantidad_pagos DESC
  `);
  return result.recordset;
}

async function obtenerModalidadesEntregaMasUsadas() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      TE.DESCRIPCION AS modalidad_entrega,
      COUNT(P.ID_PEDIDO) AS cantidad_pedidos,
      ISNULL(SUM(PG.MONTO_TOTAL), 0) AS ingresos
    FROM Pedidos P
    JOIN Tipos_Entrega TE ON P.ID_TIPO_ENTREGA = TE.ID_TIPO_ENTREGA
    LEFT JOIN Pagos PG ON P.ID_PEDIDO = PG.ID_PEDIDO AND PG.ID_ESTADO_PAGO = 2
    WHERE P.ID_ESTADO NOT IN (5)
    GROUP BY TE.DESCRIPCION
    ORDER BY cantidad_pedidos DESC
  `);
  return result.recordset;
}

async function obtenerResumenVentas() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      COUNT(DISTINCT P.ID_PEDIDO)                                   AS pedidos_total,
      ISNULL(SUM(PG.MONTO_TOTAL), 0)                               AS ingresos_total,
      COUNT(DISTINCT CASE WHEN CAST(P.FECHA_HORA AS DATE) = CAST(GETDATE() AS DATE) THEN P.ID_PEDIDO END) AS pedidos_hoy,
      ISNULL(SUM(CASE WHEN CAST(P.FECHA_HORA AS DATE) = CAST(GETDATE() AS DATE) THEN PG.MONTO_TOTAL END), 0) AS ingresos_hoy
    FROM Pedidos P
    LEFT JOIN Pagos PG ON P.ID_PEDIDO = PG.ID_PEDIDO AND PG.ID_ESTADO_PAGO = 2
    WHERE P.ID_ESTADO NOT IN (5)
  `);
  return result.recordset[0];
}

/** KPIs del panel admin + pedidos recientes (una fila de pago por pedido vía subconsulta). */
async function obtenerDashboardAdmin() {
  const pool = await poolPromise;

  const hoyAyer = await pool.request().query(`
    SELECT
      ISNULL((
        SELECT SUM(PG.MONTO_TOTAL)
        FROM Pedidos P
        INNER JOIN Pagos PG ON P.ID_PEDIDO = PG.ID_PEDIDO AND PG.ID_ESTADO_PAGO = 2
        WHERE P.ID_ESTADO NOT IN (5)
          AND CAST(P.FECHA_HORA AS DATE) = CAST(GETDATE() AS DATE)
      ), 0) AS ventas_hoy,
      ISNULL((
        SELECT SUM(PG.MONTO_TOTAL)
        FROM Pedidos P
        INNER JOIN Pagos PG ON P.ID_PEDIDO = PG.ID_PEDIDO AND PG.ID_ESTADO_PAGO = 2
        WHERE P.ID_ESTADO NOT IN (5)
          AND CAST(P.FECHA_HORA AS DATE) = DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
      ), 0) AS ventas_ayer,
      ISNULL((
        SELECT COUNT(*)
        FROM Pedidos P
        WHERE P.ID_ESTADO NOT IN (5)
          AND CAST(P.FECHA_HORA AS DATE) = CAST(GETDATE() AS DATE)
      ), 0) AS pedidos_hoy,
      ISNULL((
        SELECT COUNT(*)
        FROM Pedidos P
        WHERE P.ID_ESTADO NOT IN (5)
          AND CAST(P.FECHA_HORA AS DATE) = DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
      ), 0) AS pedidos_ayer
  `);

  const empleados = await pool.request().query(`
    SELECT COUNT(*) AS n FROM Trabajadores
  `);

  const productos = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Carta WHERE ID_ESTADO = 1) AS activos,
      (SELECT COUNT(*) FROM Carta WHERE ID_ESTADO <> 1) AS inactivos
  `);

  const recientes = await pool.request().query(`
    SELECT TOP 8
      P.ID_PEDIDO,
      ISNULL(LTRIM(RTRIM(CL.NOMBRES)) + ' ' + LTRIM(RTRIM(CL.APELLIDOS)), 'Sin cliente') AS cliente,
      ISNULL((
        SELECT TOP 1 PG2.MONTO_TOTAL
        FROM Pagos PG2
        WHERE PG2.ID_PEDIDO = P.ID_PEDIDO
        ORDER BY PG2.ID_PAGO DESC
      ), 0) AS total,
      EP.DESCRIPCION AS estado
    FROM Pedidos P
    LEFT JOIN Clientes CL ON P.ID_CLIENTE = CL.ID_CLIENTE
    INNER JOIN Estados_Pedido EP ON P.ID_ESTADO = EP.ID_ESTADO
    WHERE P.ID_ESTADO NOT IN (5)
    ORDER BY P.FECHA_HORA DESC
  `);

  const row = hoyAyer.recordset[0] || {};
  const prodRow = productos.recordset[0] || {};

  return {
    ventas_hoy: Number(row.ventas_hoy) || 0,
    ventas_ayer: Number(row.ventas_ayer) || 0,
    pedidos_hoy: Number(row.pedidos_hoy) || 0,
    pedidos_ayer: Number(row.pedidos_ayer) || 0,
    empleados: Number(empleados.recordset[0]?.n) || 0,
    productos_activos: Number(prodRow.activos) || 0,
    productos_inactivos: Number(prodRow.inactivos) || 0,
    pedidos_recientes: recientes.recordset
  };
}

async function obtenerPedidosDetallados(fecha_inicio, fecha_fin) {
  const pool = await poolPromise;

  let query = `
    SELECT
      P.ID_PEDIDO,
      FORMAT(P.FECHA_HORA, 'dd/MM/yyyy HH:mm') AS fecha_hora,
      ISNULL(CL.NOMBRES + ' ' + CL.APELLIDOS, 'Sin cliente') AS cliente,
      EP.DESCRIPCION AS estado_pedido,
      TE.DESCRIPCION AS tipo_entrega,
      MP.DESCRIPCION AS metodo_pago,
      EP2.DESCRIPCION AS estado_pago,
      ISNULL(PG.MONTO_TOTAL, 0) AS total
    FROM Pedidos P
    LEFT JOIN Clientes CL ON P.ID_CLIENTE = CL.ID_CLIENTE
    JOIN Estados_Pedido EP ON P.ID_ESTADO = EP.ID_ESTADO
    JOIN Tipos_Entrega TE ON P.ID_TIPO_ENTREGA = TE.ID_TIPO_ENTREGA
    LEFT JOIN Pagos PG ON P.ID_PEDIDO = PG.ID_PEDIDO
    LEFT JOIN Modalidades_Pago MP ON PG.ID_MODALIDAD = MP.ID_MODALIDAD
    LEFT JOIN Estados_Pago EP2 ON PG.ID_ESTADO_PAGO = EP2.ID_ESTADO_PAGO
    WHERE 1=1
  `;

  const req = pool.request();

  if (fecha_inicio) {
    req.input('fi', sql.Date, fecha_inicio);
    query += ` AND CAST(P.FECHA_HORA AS DATE) >= @fi`;
  }
  if (fecha_fin) {
    req.input('ff', sql.Date, fecha_fin);
    query += ` AND CAST(P.FECHA_HORA AS DATE) <= @ff`;
  }

  query += ` ORDER BY P.ID_PEDIDO DESC`;

  const result = await req.query(query);
  return result.recordset;
}

function generarExcel(pedidos) {
  const ws = XLSX.utils.json_to_sheet(pedidos.map(p => ({
    'ID Pedido':       p.ID_PEDIDO,
    'Fecha y Hora':    p.fecha_hora,
    'Cliente':         p.cliente,
    'Estado Pedido':   p.estado_pedido,
    'Tipo Entrega':    p.tipo_entrega,
    'Método de Pago':  p.metodo_pago,
    'Estado Pago':     p.estado_pago,
    'Total (S/.)':     Number(p.total).toFixed(2)
  })));

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  obtenerProductosMasVendidos,
  obtenerMetodosPagoMasUsados,
  obtenerModalidadesEntregaMasUsadas,
  obtenerResumenVentas,
  obtenerDashboardAdmin,
  obtenerPedidosDetallados,
  generarExcel
};
