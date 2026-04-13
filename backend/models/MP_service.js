// models/MP_service.js
// Servicio de Mercado Pago — Checkout Pro (redirección) + pago directo
// Usa CommonJS (require/module.exports) igual que el resto del proyecto

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

// Configuración del cliente MP
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preference = new Preference(client);
const payment = new Payment(client);

/**
 * Crea una preferencia de Checkout Pro (redirige a MercadoPago)
 * Válido para Tarjeta, Yape, Plin y cualquier método que soporte MP
 * 
 * @param {Object} data
 * @param {Array}  data.items        - Productos del pedido [{title, quantity, unit_price}]
 * @param {string} data.email        - Email del pagador
 * @param {string} data.external_ref - Referencia externa (ej: "pedido_123")
 * @param {string} data.back_urls    - URLs de retorno {success, failure, pending}
 * @param {Array}  [data.payment_methods] - ["yape", "plin"] para filtrar métodos
 * @returns {{ init_point, preference_id }}
 */
async function crearPreferenciaCheckoutPro(data) {
  try {
    const body = {
      items: data.items.map(item => ({
        id: String(item.id),
        title: item.title || item.nombre,
        quantity: Number(item.quantity || item.cantidad),
        unit_price: Number(item.unit_price || item.precio),
        currency_id: 'PEN'
      })),
      payer: {
        email: (data.email && data.email.includes('@')) ? data.email : 'test@testuser.com'
      },
      external_reference: data.external_ref || '',
      back_urls: {
        success: "http://localhost:3000/sistema/pago-exitoso.html",
        failure: "http://localhost:3000/sistema/pago-fallido.html",
        pending: "http://localhost:3000/sistema/pago-pendiente.html"
      },
      // NOTA: Mercado Pago frecuentemente bloquea el uso de 'auto_return' cuando las back_urls apuntan 
      // a 'localhost' (HTTP), arrojando el error "invalid_auto_return / back_url.success must be defined". 
      // Para probar en entorno local (localhost), comentamos auto_return. Cuando pases a producción con HTTPS, 
      // puedes descomentarlo.
      // auto_return: 'approved',
      // MP rechaza HTTP localhost en notification_url a veces, usamos un placeholder en webhooks si es localhost
      notification_url: "https://hookb.in/placeholder-webhooks",
      statement_descriptor: 'Nacion Burger'
    };

    // Quitamos 'included_payment_methods' porque la API Checkout Pro V2 de MP no lo soporta de esta forma 
    // y puede causar que la API corrompa la lectura del body (lanzando el error back_url.success).
    
    console.log('Creando preferencia MP Checkout Pro:', JSON.stringify(body, null, 2));
    const response = await preference.create({ body });

    return {
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      preference_id: response.id
    };

  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    if (error.cause) console.error('Cause:', JSON.stringify(error.cause));
    throw new Error('Error al crear preferencia de pago: ' + error.message);
  }
}

/**
 * Verifica el estado de un pago por su ID de pago MP
 */
async function verificarPagoMP(paymentId) {
  try {
    const response = await payment.get({ id: paymentId });
    return {
      status: response.status,
      status_detail: response.status_detail,
      external_reference: response.external_reference,
      transaction_amount: response.transaction_amount
    };
  } catch (error) {
    console.error('Error verificando pago MP:', error);
    throw new Error('Error al verificar estado del pago');
  }
}

module.exports = {
  crearPreferenciaCheckoutPro,
  verificarPagoMP
};