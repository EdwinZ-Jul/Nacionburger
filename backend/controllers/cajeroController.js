const {obtenerPagosPendientesEfectivo,pagarEfectivo, obtenerPagosRealizados} = require('../models/cajeroModel');

exports.listarPendientesEfectivo = async (req, res) => {
  try {
    const pagos = await obtenerPagosPendientesEfectivo();
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pagos pendientes" });
  }
};

exports.cobrar = async (req, res) => {
  try {
    const { id } = req.params;

    const ok = await pagarEfectivo(id);

    if (!ok) {
      return res.status(400).json({
        mensaje: "El pago ya fue procesado o no existe"
      });
    }

    res.json({
      success: true,
      mensaje: "Pago en efectivo registrado correctamente"
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al procesar pago" });
  }
};

exports.listarPagosRealizados = async (req, res) => {
  try {
    const pagos = await obtenerPagosRealizados();
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pagos realizados" });
  }
};