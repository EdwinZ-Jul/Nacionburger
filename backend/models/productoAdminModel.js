const { poolPromise, sql } = require('../db');  // ✅ importa poolPromise y sql correctamente

// Función para obtener todos los productos (admin)
async function obtenerProductosAdmin() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT 
            C.ID_PLATILLO, 
            C.NOMBRE, 
            C.PRECIO, 
            C.DESCRIPCION, 
            C.IMAGEN, 
            CP.DESCRIPCION AS CATEGORIA,
            CP.CARPETA
        FROM Carta C
        JOIN Categoria_Productos CP 
            ON C.ID_CATEGORIA = CP.ID_CATEGORIA
    `);
    return result.recordset;
}

async function obtenerCategoriasAdmin() {
    try {
        const pool = await poolPromise;
        const resultado = await pool.request()
            .input('promoId', sql.Int, 8)
            .query(`
                SELECT ID_CATEGORIA, DESCRIPCION, CARPETA 
                FROM Categoria_Productos
                WHERE ID_CATEGORIA <> @promoId
            `);
        return resultado.recordset;
    } catch (error) {
        console.error('Error en obtenerCategoriasAdmin:', error);
        throw error;
    }
}

// ✅ BUG 1 CORREGIDO: usaba `db` (indefinido) en vez de `poolPromise`
async function insertarProducto({ nombre, precio, descripcion, imagen, idCategoria }) {
    try {
        const pool = await poolPromise;  // ← era `await db` → crash garantizado
        const result = await pool.request()
            .input('nombre',      sql.VarChar(100),    nombre)
            .input('precio',      sql.Decimal(10, 2),  precio)
            .input('descripcion', sql.VarChar(255),     descripcion)
            .input('imagen',      sql.VarChar(255),     imagen)
            .input('idCategoria', sql.Int,              idCategoria)
            .query(`
                INSERT INTO Carta (NOMBRE, PRECIO, DESCRIPCION, IMAGEN, ID_CATEGORIA)
                VALUES (@nombre, @precio, @descripcion, @imagen, @idCategoria)
            `);
        return result;
    } catch (error) {
        console.error('Error al insertar producto:', error);
        throw error;
    }
}

async function actualizarProducto({ id, nombre, precio, descripcion, imagen, idCategoria }) {
    const pool = await poolPromise;
    // Si no se sube nueva imagen, no actualizamos ese campo
    const query = imagen
        ? `UPDATE Carta SET NOMBRE=@nombre, PRECIO=@precio, DESCRIPCION=@descripcion, IMAGEN=@imagen, ID_CATEGORIA=@idCategoria WHERE ID_PLATILLO=@id`
        : `UPDATE Carta SET NOMBRE=@nombre, PRECIO=@precio, DESCRIPCION=@descripcion, ID_CATEGORIA=@idCategoria WHERE ID_PLATILLO=@id`;

    const request = pool.request()
        .input('id',          sql.Int,            id)
        .input('nombre',      sql.VarChar(100),    nombre)
        .input('precio',      sql.Decimal(10, 2),  precio)
        .input('descripcion', sql.VarChar(255),     descripcion)
        .input('idCategoria', sql.Int,              idCategoria);

    if (imagen) request.input('imagen', sql.VarChar(255), imagen);

    return await request.query(query);
}

async function eliminarProducto(id) {
    const pool = await poolPromise;
    // Obtener imagen y carpeta antes de eliminar (para borrar del disco)
    const info = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT C.IMAGEN, CP.CARPETA FROM Carta C JOIN Categoria_Productos CP ON C.ID_CATEGORIA = CP.ID_CATEGORIA WHERE C.ID_PLATILLO = @id');

    await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Carta WHERE ID_PLATILLO = @id');

    return info.recordset[0]; // { IMAGEN, CARPETA } para borrar del disco
}

module.exports = {
    obtenerProductosAdmin,
    obtenerCategoriasAdmin,
    insertarProducto,
    actualizarProducto,
    eliminarProducto
};