const { poolPromise, sql } = require('../db');
const promocionesModel = require('./promocionesModel');

//Función para obtener todos los productos de la tabla Carta
async function obtenerProductos() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT 
            C.ID_PLATILLO, 
            C.NOMBRE, 
            C.PRECIO, 
            C.DESCRIPCION, 
            C.IMAGEN, 
            CP.DESCRIPCION AS CATEGORIA,
            CP.CARPETA,
            EP.DESCRIPCION AS ESTADO
        FROM Carta C
        JOIN Categoria_Productos CP 
            ON C.ID_CATEGORIA = CP.ID_CATEGORIA
        JOIN Estados_Producto EP
            ON C.ID_ESTADO = EP.ID_ESTADO
        WHERE EP.ID_ESTADO = 1
    `);
    return result.recordset;
}


//Función para buscar productos desde la búsqueda del menú
async function buscarProductosPorNombre(nombre) {
    const pool = await poolPromise;

    const result = await pool.request()
    .input('nombre', sql.VarChar(100), nombre)
    .query(`
        SELECT TOP 5 
            c.ID_PLATILLO,
            c.NOMBRE,
            c.PRECIO,
            c.DESCRIPCION,
            c.IMAGEN,
            cp.DESCRIPCION AS CATEGORIA,
            cp.CARPETA
        FROM Carta c
        INNER JOIN Categoria_Productos cp 
            ON c.ID_CATEGORIA = cp.ID_CATEGORIA
        WHERE LOWER(c.NOMBRE) LIKE '%' + LOWER(@nombre) + '%'
        AND c.ID_ESTADO = 1
    `);
    return result.recordset;
}

async function calcularResumenPedido(productos) {

  const pool = await poolPromise;

  let total = 0;

  const detalle = [];

  const promosActivas = await promocionesModel.obtenerPlatillosConPromocionActiva();
  const precioPromoPorId = new Map(
    promosActivas.map((row) => [row.ID_PLATILLO, row])
  );

  for (const item of productos) {

    // Validar cantidad e ID
    if (!item.id_producto || isNaN(item.id_producto)) {
      throw new Error(`ID de producto inválido: ${item.id_producto}`);
    }
    if (item.cantidad <= 0) {
      throw new Error("Cantidad inválida");
    }

    const result = await pool.request()
      .input("id", sql.Int, item.id_producto)
      .query(`
        SELECT 
            ID_PLATILLO,
            NOMBRE,
            PRECIO
        FROM Carta
        WHERE ID_PLATILLO = @id
        AND ID_ESTADO = 1
      `);

    if (result.recordset.length === 0) {
      throw new Error("Producto no disponible");
    }

    const producto = result.recordset[0];

    const promo = precioPromoPorId.get(producto.ID_PLATILLO);
    const precioUnitario = promo
      ? Number(promo.PRECIO_PROMO)
      : Number(producto.PRECIO);

    const subtotal = precioUnitario * item.cantidad;

    total += subtotal;

    detalle.push({
      id: producto.ID_PLATILLO,
      nombre: producto.NOMBRE,
      precio: precioUnitario,
      cantidad: item.cantidad,
      subtotal: subtotal,
    });

  }

  return {
    productos: detalle,
    total: total
  };
}



module.exports = {
    obtenerProductos,
    buscarProductosPorNombre,
    calcularResumenPedido
};