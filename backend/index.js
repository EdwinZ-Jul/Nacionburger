const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const initAdmin = require('./config/initAdmin');
const app = express();

// Middleware JSON (excepto multipart)
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) return next();
  express.json()(req, res, next);
});
app.use(cors());

// ─── ESTÁTICOS ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/sistema', express.static(path.join(__dirname, '../sistema')));

// ─── RUTAS ───────────────────────────────────────────────────────────────────

// Auth (login, registro, Google)
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Productos (cliente — menú, búsqueda, resumen pedido)
const productoRoutes = require('./routes/productoRoutes');
app.use('/api', productoRoutes);

// Promociones activas (público — menú / pedido.html)
const promocionesCtrl = require('./controllers/promocionesController');
app.get('/api/promociones/activas', promocionesCtrl.listarPromocionesActivasPublico);

// Productos Admin (CRUD de carta)
const productoAdminRoutes = require('./routes/productoAdminRoutes');
app.use('/api/admin/productos', productoAdminRoutes);

// Empleados
const empleadosRoutes = require('./routes/empleadosRoutes');
app.use('/api/empleados', empleadosRoutes);

// Pedidos + Pagos + Webhook MP
const pedidosRoutes = require('./routes/pedidosRoutes');
app.use('/api', pedidosRoutes);

// Cocinero
const cocineroRoutes = require('./routes/cocineroRoutes');
app.use('/api/cocinero', cocineroRoutes);

// Mozo
const mozoRoutes = require('./routes/mozoRoutes');
app.use('/api/mozo', mozoRoutes);

// Cajero
const cajeroRoutes = require('./routes/cajeroRoutes');
app.use('/api/cajero', cajeroRoutes);

// ── NUEVAS RUTAS ──────────────────────────────────────────────────────────────

// Ubicación (provincias y distritos)
const ubicacionRoutes = require('./routes/ubicacionRoutes');
app.use('/api', ubicacionRoutes);

// Promociones (CRUD — solo admin)
const promocionesRoutes = require('./routes/promocionesRoutes');
app.use('/api/admin/promociones', promocionesRoutes);

// Analítica + Excel (solo admin)
const analiticaRoutes = require('./routes/analiticaRoutes');
app.use('/api/admin/analitica', analiticaRoutes);
//ruta de prueba
const { poolPromise } = require('./db'); // 👈 ajusta si tu archivo se llama diferente

app.get('/test-db', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT GETDATE() AS fecha");

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error DB");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(config.port, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${config.port}`);
  await initAdmin();
});