import { MercadoPagoConfig, Preference } from 'mercadopago';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { sequelize, sequelizePromise } from './config/db';
import { defineUsuarioModel } from './models/usuarios';
import { defineCarritoModel } from './models/carrito';
import { definePrendaModel } from './models/prendas';
import { defineCompraModel } from './models/compra';
import { defineOpinionModel } from './models/opinion';
import { defineReclamoModel } from './models/reclamo';
import { confirmarCompra } from './controllers/compraController';

export let Usuario: any, Carrito: any, Prenda: any, Compra: any, Opinion: any, Reclamo: any;

sequelizePromise.then(async (sequelize) => {
  Usuario = defineUsuarioModel(sequelize);
  Carrito = defineCarritoModel(sequelize);
  Prenda = definePrendaModel(sequelize);
  Compra = defineCompraModel(sequelize);
  Opinion = defineOpinionModel(sequelize);
  Reclamo = defineReclamoModel(sequelize);

  try {
    await sequelize.authenticate();
    console.log('Conectado a MySQL');
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error de conexión o sincronización:', error);
  }
});
import usuariosRoutes from './routes/usuariosRoutes';
import prendaRoutes from './routes/prendaRoutes';  
import carritoRoutes from './routes/carritoRoutes';  
import { verificarToken } from './middleware/usuarios';
import reclamoRoutes from './routes/reclamoRoutes';
import compraRoutes from './routes/compraRoutes';
import opinionRoutes from './routes/opinionRoutes';

const app = express();

const PORT = process.env.PORT;
app.use(cors());
app.use(bodyParser.json());

app.use('/opinion', opinionRoutes);
app.use('/compras', compraRoutes);
app.use('/reclamos', reclamoRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/prendas', prendaRoutes);
app.use('/carrito', carritoRoutes);

app.get('/perfil', verificarToken, (req, res) => {
  res.json({ message: 'Bienvenido al perfil', user: (req as any).user });
});

import axios from 'axios';

app.post('/webhook/mp', async (req, res) => {
  try {
  const body = req.body;
  try {
    const body = req.body;
    console.log('--- Webhook recibido ---');
    console.log('Body:', JSON.stringify(body, null, 2));
    const paymentId = body.data && body.data.id ? body.data.id : body.payment_id || body.id;
    const topic = body.type || body.topic;
    let preferenceId: string | undefined = undefined;
    let paymentStatus: string | undefined = undefined;
    let orderId: string | undefined = undefined;
    let externalReference: string | undefined = undefined;
    console.log('Intentando extraer paymentId y topic del body...');

    if ((topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') && paymentId) {
      try {
        console.log(`[Webhook] Consultando pago en MercadoPago con paymentId: ${paymentId}`);
        const mpResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519`
          }
        });
        console.log('[Webhook] Respuesta de MercadoPago:', JSON.stringify(mpResponse.data, null, 2));
        if (mpResponse.data && mpResponse.data.order && mpResponse.data.order.id) {
          orderId = String(mpResponse.data.order.id);
          console.log(`[Webhook] orderId extraído: ${orderId}`);
        }
        if (mpResponse.data && mpResponse.data.external_reference) {
          externalReference = mpResponse.data.external_reference;
          console.log(`[Webhook] external_reference extraído: ${externalReference}`);
        }
        if (mpResponse.data && mpResponse.data.additional_info && mpResponse.data.additional_info.external_reference) {
          preferenceId = mpResponse.data.additional_info.external_reference;
          console.log(`[Webhook] preferenceId extraído de additional_info.external_reference: ${preferenceId}`);
        } else if (mpResponse.data && mpResponse.data.metadata && mpResponse.data.metadata.preference_id) {
          preferenceId = mpResponse.data.metadata.preference_id;
          console.log(`[Webhook] preferenceId extraído de metadata.preference_id: ${preferenceId}`);
        } else if (mpResponse.data && mpResponse.data.order && mpResponse.data.order.id) {
          preferenceId = String(mpResponse.data.order.id);
          console.log(`[Webhook] preferenceId fallback de order.id: ${preferenceId}`);
        }
        paymentStatus = mpResponse.data.status;
        console.log(`[Webhook] paymentStatus extraído: ${paymentStatus}`);
      } catch (err) {
        if (err && typeof err === 'object' && err !== null) {
          const anyErr = err as any;
          if (anyErr.response && anyErr.response.data) {
            console.error('Error consultando pago en MP:', anyErr.response.data);
          } else {
            console.error('Error consultando pago en MP:', err);
          }
        } else {
          console.error('Error consultando pago en MP:', err);
        }
      }
    }

    console.log('--- Datos extraídos del webhook ---');
    console.log('paymentId:', paymentId);
    console.log('topic:', topic);
    console.log('preference_id:', preferenceId);
    console.log('order_id:', orderId);
    console.log('external_reference:', externalReference);
    console.log('payment_status:', paymentStatus);

    if (topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') {
      if (!orderId && !preferenceId && !externalReference) {
        console.log('[Webhook] No se encontró order_id, preference_id ni external_reference para buscar la compra.');
        res.status(400).json({ error: 'No se encontró order_id, preference_id ni external_reference' });
        return;
      }
      if (paymentStatus !== 'approved') {
        console.log(`[Webhook] Pago recibido pero NO aprobado (${paymentStatus}), no se descuenta stock ni se cambia estado.`);
        res.status(200).json({ message: 'Pago no aprobado, sin acción' });
        return;
      }
      let compra = null;
      if (externalReference) {
        console.log(`[Webhook] Buscando compra por external_reference (preference_id real): ${externalReference}`);
        compra = await Compra.findOne({ where: { preference_id: externalReference } });
      }
      if (!compra && orderId) {
        console.log(`[Webhook] No se encontró compra por external_reference. Buscando por order_id: ${orderId}`);
        compra = await Compra.findOne({ where: { order_id: orderId } });
      }
      if (!compra && preferenceId) {
        console.log(`[Webhook] No se encontró compra por order_id. Buscando por preference_id fallback: ${preferenceId}`);
        compra = await Compra.findOne({ where: { preference_id: preferenceId } });
      }
      if (!compra) {
        console.log(`[Webhook] No se encontró compra para external_reference/order_id/preference_id:`, externalReference, orderId, preferenceId);
        res.status(404).json({ error: 'Compra no encontrada para external_reference/order_id/preference_id' });
        return;
      }
      console.log('[Webhook] Compra encontrada:', compra.toJSON());
      if (compra.estado === 'pagada') {
        console.log('[Webhook] La compra ya estaba confirmada/pagada.');
        res.status(200).json({ message: 'Compra confirmadisima' });
        return;
      }
      console.log('[Webhook] Confirmando compra y actualizando estado...');
      await confirmarCompra(compra.id);
      await compra.update({ payment_id: paymentId, order_id: orderId });
      console.log('[Webhook] Compra confirmada y stock actualizado.');
      res.status(200).json({ message: 'Compra confirmada y stock actualizado' });
      return;
    }
    console.log('[Webhook] Webhook recibido de tipo no relevante, sin acción.');
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error en webhook MP:', err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }

const client = new MercadoPagoConfig({ accessToken: 'APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519' });

app.post('/create-preference', verificarToken, async (req, res) => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
    if (!carrito) {
      res.status(404).json({ error: 'Carrito no encontrado' });
      return;
    }

    const productos = (carrito.get('productos') || {});
    const items = Object.values(productos).map((prod: any) => ({
      title: prod.nombre || `Producto ${prod.id}`,
      quantity: prod.cantidad,
      unit_price: prod.precio,
      id: String(prod.id),
    }));

    const envio = req.body.envio;
    if (envio && typeof envio === 'number' && envio > 0) {
      items.push({
        title: 'Envío',
        quantity: 1,
        unit_price: envio,
        id: 'envio'
      });
    }

    if (items.length === 0) {
      res.status(400).json({ error: 'El carrito está vacío' });
      return;
    }

    const preference = new Preference(client);
    const data = await preference.create({
      body: {
        items,
        notification_url: 'https://uavdocx-back.policloudservices.ipm.edu.ar/webhook/mp?key=d86f69ff80e1888d3ea4a654b2655886f527149a021d80d2b02c78cd458f0480',
        external_reference: JSON.stringify({
          usuarioId,
          envio,
          total: req.body.total
        })
      }
    });

    await Compra.update(
      { preference_id: data.id },
      { where: { idUsuario: usuarioId, estado: 'pendiente' } }
    );

    res.status(200).json({
      preference_id: data.id,
      preference_url: data.init_point,
    });
  } catch (error) {
    console.error('Error en /create-preference:', error);
    res.status(500).json({ error: 'Error al crear la preferencia', detalle: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) });
  }
});
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});