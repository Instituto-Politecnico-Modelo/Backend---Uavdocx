import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
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
const tokenMP = process.env.TOKEN_MP;

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

const client = new MercadoPagoConfig({ accessToken: 'APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519' });
const payment = new Payment(client);

app.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await payment.get({ id: paymentId });
    
    res.json({
      status: result.status,
      statusDetail: result.status_detail,
      externalReference: result.external_reference,
      transactionAmount: result.transaction_amount,
      dateApproved: result.date_approved,
      paymentMethod: result.payment_method_id,
      details: result
    });
  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({ error: 'Error al verificar el pago' });
  }
});

app.post('/webhook/mp', async (req, res) => {
  try {
    const body = req.body;
    console.log('--- Webhook recibido ---');
    console.log('Body:', JSON.stringify(body, null, 2));

    const paymentId = body.data?.id || body.payment_id || body.id || body.resource;
    const topic = body.type || body.topic;

    console.log('Payment ID:', paymentId);
    console.log('Topic:', topic);

    if (!['payment', 'payment.created', 'payment.updated'].includes(topic)) {
      console.log('Evento no es de tipo payment, se ignora');
      res.status(200).json({ received: true });
      return;
    }

    if (!paymentId) {
      console.error('No se encontró payment ID en el webhook');
      res.status(400).json({ error: 'Payment ID no encontrado' });
      return;
    }

    const paymentData = await payment.get({ id: paymentId });

    const paymentInfo = {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      external_reference: paymentData.external_reference,
      order: paymentData.order,
      payer: paymentData.payer,
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      payment_type_id: paymentData.payment_type_id,
      date_approved: paymentData.date_approved,
      date_created: paymentData.date_created,
      date_last_updated: paymentData.date_last_updated,
      additional_info: paymentData.additional_info,
      metadata: paymentData.metadata
    };
    console.log('Datos completos del pago:', paymentInfo);

    // Buscar la compra por preference_id (id de la preferencia de MP)
    let reserva = await Compra.findOne({ where: { preference_id: paymentData.id } });
    const paymentStatus = paymentData.status;

    if (paymentStatus !== 'approved') {
      console.log('Pago no aprobado. Estado:', paymentStatus);
      res.status(200).json({
        message: 'Pago registrado pero no aprobado',
        status: paymentStatus
      });
      return;
    }

    // Si no existe la compra, la creamos usando los datos de metadata
    if (!reserva) {
      const meta = paymentData.metadata || {};
      try {
        reserva = await Compra.create({
          productos: meta.productos,
          idUsuario: meta.idUsuario,
          total: meta.total,
          nombre: meta.nombre,
          apellido: meta.apellido,
          direccion: meta.direccion,
          dni: meta.dni,
          telefono: meta.telefono,
          email: meta.email,
          envio: meta.envio,
          estado: 'pagada',
          preference_id: paymentData.id,
          payment_id: paymentId,
          fecha: new Date()
        });
        console.log('Compra creada desde webhook con metadata:', reserva.id);
      } catch (err: any) {
        console.error('Error creando compra desde webhook:', err);
        res.status(500).json({ error: 'Error creando compra desde webhook', detalle: err?.message });
        return;
      }
    } else {
      if (reserva.estado === 'pagada') {
        console.log('Reserva ya fue confirmada previamente');
        res.status(200).json({ message: 'Reserva ya confirmada' });
        return;
      }
      await reserva.update({
        payment_id: paymentId,
        payment_status: paymentStatus,
        fecha_pago: new Date()
      });
      console.log('✅ Reserva confirmada exitosamente:', reserva.id);
    }

    res.status(200).json({
      message: 'Reserva confirmada y stock actualizado',
      reservaId: reserva.id,
      paymentId: paymentId,
      paymentInfo
    });

  } catch (error) {
    console.error('❌ Error en webhook MP:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});


app.post('/create-preference', verificarToken, async (req, res) => {
  try {
    const usuarioId = (req as any).user?.id;
    console.log('[create-preference] Usuario autenticado:', usuarioId);
    if (!usuarioId) {
      console.log('[create-preference] Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
    console.log('[create-preference] Carrito encontrado:', !!carrito);
    if (!carrito) {
      console.log('[create-preference] Carrito no encontrado para usuario:', usuarioId);
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
    console.log('[create-preference] Items del carrito:', items);

    const envio = req.body.envio;
    if (envio && typeof envio === 'number' && envio > 0) {
      items.push({
        title: 'Envío',
        quantity: 1,
        unit_price: envio,
        id: 'envio'
      });
      console.log('[create-preference] Item de envío agregado:', envio);
    }

    if (items.length === 0) {
      console.log('[create-preference] El carrito está vacío');
      res.status(400).json({ error: 'El carrito está vacío' });
      return;
    }

    const preference = new Preference(client);
    console.log('[create-preference] Creando preferencia de MercadoPago...');
    const data = await preference.create({
      body: {
        items,
        notification_url: 'https://uavdocx-back.policloudservices.ipm.edu.ar/webhook/mp?key=...',
        external_reference: String(usuarioId),
        metadata: {
          nombre: req.body.nombre,
          apellido: req.body.apellido,
          direccion: req.body.direccion,
          dni: req.body.dni,
          telefono: req.body.telefono,
          email: req.body.email,
          productos: req.body.productos,
          id_usuario: usuarioId,
          envio: req.body.envio,
          total: req.body.total
        }
      }
    });
    console.log('[create-preference] Preferencia creada. ID:', data.id, 'URL:', data.init_point);


    res.status(200).json({
      preference_id: data.id,
      preference_url: data.init_point,
    });
  } catch (error) {
    console.error('Error en /create-preference:', error);
    res.status(500).json({ error: 'Error al crear la preferencia', detalle: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) });
  }
});