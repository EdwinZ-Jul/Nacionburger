// controllers/productoAdminController.js
const path = require('path');
const fs   = require('fs');
const {
    obtenerProductosAdmin,
    obtenerCategoriasAdmin,
    insertarProducto,
    actualizarProducto,
    eliminarProducto
} = require('../models/productoAdminModel');
const { poolPromise, sql } = require('../db');
const upload = require('../middlewares/multerCategoria');

// ── Helpers reutilizables ──────────────────────────────────────────────────
const PUBLIC_IMAGES = path.join(__dirname, '..', '..', 'public', 'images');

async function getCarpeta(idCategoria) {
    const pool = await poolPromise;
    const r = await pool.request()
        .input('idCategoria', sql.Int, parseInt(idCategoria))
        .query('SELECT CARPETA FROM Categoria_Productos WHERE ID_CATEGORIA = @idCategoria');
    if (r.recordset.length === 0) throw new Error('Categoría no encontrada');
    return r.recordset[0].CARPETA;
}

function saveFile(buffer, originalName, carpeta) {
    const uploadDir = path.join(PUBLIC_IMAGES, carpeta);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const ext          = path.extname(originalName).toLowerCase();
    const baseName     = path.basename(originalName, ext).replace(/\s+/g, '_');
    const nombreImagen = `${baseName}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, nombreImagen), buffer);
    return nombreImagen;
}

function deleteFile(carpeta, imagen) {
    try {
        const filePath = path.join(PUBLIC_IMAGES, carpeta, imagen);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
        console.warn('No se pudo borrar el archivo:', e.message);
    }
}

// ── Controladores ──────────────────────────────────────────────────────────

async function listarProductosAdmin(req, res) {
    try {
        const productos = await obtenerProductosAdmin();
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos (admin):', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
}

async function listarCategoriasAdmin(req, res) {
    try {
        const categorias = await obtenerCategoriasAdmin();
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
}

// POST / — registrar nuevo producto
const registrarProducto = [
    upload.single('imagen'),
    async (req, res) => {
        try {
            const { nombre, precio, descripcion, idCategoria } = req.body;
            if (!nombre || !precio || !descripcion || !idCategoria)
                return res.status(400).json({ error: 'Faltan campos del producto' });
            if (!req.file)
                return res.status(400).json({ error: 'La imagen es obligatoria' });

            const carpeta     = await getCarpeta(idCategoria);
            const nombreImagen = saveFile(req.file.buffer, req.file.originalname, carpeta);

            await insertarProducto({
                nombre, precio: parseFloat(precio), descripcion,
                imagen: nombreImagen, idCategoria: parseInt(idCategoria)
            });

            res.status(200).json({ mensaje: 'Producto registrado correctamente' });
        } catch (error) {
            console.error('Error al registrar producto:', error);
            res.status(500).json({ error: error.message || 'Error interno al registrar producto' });
        }
    }
];

// PUT /:id — actualizar producto (imagen opcional)
const editarProducto = [
    upload.single('imagen'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, precio, descripcion, idCategoria } = req.body;

            if (!nombre || !precio || !descripcion || !idCategoria)
                return res.status(400).json({ error: 'Faltan campos del producto' });

            let nombreImagen = null;

            if (req.file) {
                // Si hay nueva imagen: buscar carpeta y guardar
                const carpeta = await getCarpeta(idCategoria);
                nombreImagen  = saveFile(req.file.buffer, req.file.originalname, carpeta);
            }

            await actualizarProducto({
                id: parseInt(id), nombre,
                precio: parseFloat(precio), descripcion,
                imagen: nombreImagen,           // null → no actualiza la imagen en BD
                idCategoria: parseInt(idCategoria)
            });

            res.status(200).json({ mensaje: 'Producto actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            res.status(500).json({ error: error.message || 'Error interno al actualizar producto' });
        }
    }
];

// DELETE /:id — eliminar producto + imagen del disco
async function borrarProducto(req, res) {
    try {
        const { id } = req.params;
        const info = await eliminarProducto(parseInt(id));

        // Borrar imagen del disco si existe
        if (info && info.CARPETA && info.IMAGEN) {
            deleteFile(info.CARPETA, info.IMAGEN);
        }

        res.status(200).json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: error.message || 'Error interno al eliminar producto' });
    }
}

module.exports = {
    listarProductosAdmin,
    listarCategoriasAdmin,
    registrarProducto,
    editarProducto,
    borrarProducto,
};