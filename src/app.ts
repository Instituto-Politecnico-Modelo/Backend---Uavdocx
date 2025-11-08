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
    const paymentId = body.data && body.data.id ? body.data.id : body.payment_id || body.id;
    const topic = body.type || body.topic;
    let preferenceId: string | undefined = undefined;
    let paymentStatus: string | undefined = undefined;

    if ((topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') && paymentId) {
      try {
        const mpResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519`
          }
        });
        if (mpResponse.data && mpResponse.data.order && mpResponse.data.order.id) {
          preferenceId = mpResponse.data.order.id;
        } else if (mpResponse.data && mpResponse.data.id) {
          preferenceId = mpResponse.data.id;
        }
        paymentStatus = mpResponse.data.status;
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

    console.log('Webhook MP recibido:', {
      body,
      paymentId,
      topic,
      preference_id: preferenceId,
      payment_status: paymentStatus
    });

    if (topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') {
      if (!preferenceId) {
        res.status(400).json({ error: 'No se encontró preference_id' });
        return;
      }
      if (paymentStatus !== 'approved') {
        console.log('Pago recibido pero NO aprobado, no se descuenta stock ni se cambia estado:', paymentStatus);
        res.status(200).json({ message: 'Pago no aprobado, sin acción' });
        return;
      }
      const compra = await Compra.findOne({ where: { preference_id: preferenceId } });
      if (!compra) {
        res.status(404).json({ error: 'Compra no encontrada para ese preference_id' });
        return;
      }
      console.log('Compraaa:', compra.toJSON());
      if (compra.estado === 'pagada') {
        res.status(200).json({ message: 'Compra confirmadisima' });
        return;
      }
      const { confirmarCompra } = require('./controllers/compraController');
      await confirmarCompra(compra.id);
      await compra.update({ payment_id: paymentId });
      res.status(200).json({ message: 'Compra confirmada y stock actualizado' });
      return;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error en webhook MP:', err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { crearCompra } from './controllers/compraController';

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