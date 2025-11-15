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


const client = new MercadoPagoConfig({ accessToken: tokenMP || '' });
const payment = new Payment(client);

app.post('/create-preference', verificarToken, async (req, res) => {
  try {
    console.log('\n========== INICIO CREATE PREFERENCE ==========');
    const usuarioId = (req as any).user?.id;
    console.log('[create-preference] Usuario autenticado:', usuarioId);
    console.log('[create-preference] Body recibido:', JSON.stringify(req.body, null, 2));
    
    if (!usuarioId) {
      console.log('❌ [create-preference] Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    console.log('[create-preference] Buscando carrito para usuario:', usuarioId);
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
    console.log('[create-preference] Carrito encontrado:', !!carrito);
    
    if (!carrito) {
      console.log('❌ [create-preference] Carrito no encontrado para usuario:', usuarioId);
      res.status(404).json({ error: 'Carrito no encontrado' });
      return;
    }

    const productos = (carrito.get('productos') || {});
    console.log('[create-preference] Productos en carrito:', JSON.stringify(productos, null, 2));
    
    const items = Object.values(productos).map((prod: any) => ({
      title: prod.nombre || `Producto ${prod.id}`,
      quantity: prod.cantidad,
      unit_price: prod.precio,
      id: String(prod.id),
    }));
    console.log('[create-preference] Items mapeados:', JSON.stringify(items, null, 2));

    const envio = req.body.envio;
    if (envio && typeof envio === 'number' && envio > 0) {
      items.push({
        title: 'Envío',
        quantity: 1,
        unit_price: envio,
        id: 'envio'
      });
      console.log('[create-preference] ✅ Item de envío agregado:', envio);
    }

    if (items.length === 0) {
      console.log('❌ [create-preference] El carrito está vacío');
      res.status(400).json({ error: 'El carrito está vacío' });
      return;
    }

    // Validar datos del destinatario
    const { nombre, apellido, direccion, dni, telefono, email, productos: productosBody } = req.body;
    console.log('[create-preference] Validando datos del destinatario...');
    console.log('  - nombre:', nombre);
    console.log('  - apellido:', apellido);
    console.log('  - direccion:', direccion);
    console.log('  - dni:', dni);
    console.log('  - telefono:', telefono);
    console.log('  - email:', email);
    console.log('  - productos:', productosBody ? 'OK' : 'FALTA');
    
    if (!nombre || !apellido || !direccion || !dni || !telefono || !email || !productosBody) {
      console.log('❌ [create-preference] Faltan datos del destinatario');
      res.status(400).json({ error: 'Todos los datos del destinatario son requeridos' });
      return;
    }

    // Crear la compra en estado pendiente antes de la preferencia
    console.log('[create-preference] ✅ Todos los datos presentes. Creando compra pendiente...');
    const compraPendiente = await Compra.create({
      idUsuario: usuarioId,
      productos: productosBody,
      total: req.body.total,
      nombre: nombre,
      apellido: apellido,
      direccion: direccion,
      dni: dni,
      telefono: telefono,
      email: email,
      envio: req.body.envio,
      estado: 'pendiente',
    });
    console.log('[create-preference] ✅ Compra pendiente creada. ID:', compraPendiente.id);

    const preference = new Preference(client);
    console.log('[create-preference] Creando preferencia de MercadoPago...');
    console.log('  - external_reference:', compraPendiente.id);
    console.log('  - items:', items.length);
    
    const data = await preference.create({
      body: {
        items,
        notification_url: 'https://uavdocx-back.policloudservices.ipm.edu.ar/webhook/mp?key=d86f69ff80e1888d3ea4a654b2655886f527149a021d80d2b02c78cd458f0480',
        external_reference: String(compraPendiente.id)
      }
    });
    console.log('[create-preference] ✅ Preferencia creada. ID:', data.id);
    console.log('[create-preference] URL de pago:', data.init_point);

    await compraPendiente.update({ preference_id: data.id });
    console.log('[create-preference] ✅ Compra actualizada con preference_id:', data.id);
    console.log('========== FIN CREATE PREFERENCE (ÉXITO) ==========\n');

    res.status(200).json({
      preference_id: data.id,
      preference_url: data.init_point,
    });
  } catch (error) {
    console.error('❌ ========== ERROR EN CREATE PREFERENCE ==========');
    console.error('Tipo de error:', error?.constructor?.name);
    console.error('Mensaje:', error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error));
    console.error('Stack:', error && typeof error === 'object' && 'stack' in error ? (error as any).stack : 'No stack');
    console.error('Error completo:', error);
    console.error('========== FIN ERROR ==========\n');
    res.status(500).json({ 
      error: 'Error al crear la preferencia', 
      detalle: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) 
    });
  }
});
 

 
app.post('/webhook/mp', async (req, res) => {
  try {
    console.log('\n========== WEBHOOK MERCADOPAGO RECIBIDO ==========');
    const body = req.body;
    console.log('[webhook] Body completo:', JSON.stringify(body, null, 2));

    const paymentId = body.data?.id || body.payment_id || body.id || body.resource;
    const topic = body.type || body.topic;

    console.log('[webhook] Payment ID extraído:', paymentId);
    console.log('[webhook] Topic:', topic);

    if (!['payment', 'payment.created', 'payment.updated'].includes(topic)) {
      console.log('[webhook] ⚠️ Evento ignorado (no es payment):', topic);
      res.status(200).json({ received: true });
      return;
    }

    if (!paymentId) {
      console.error('❌ [webhook] No se encontró payment ID en el webhook');
      console.error('[webhook] Body recibido:', body);
      res.status(400).json({ error: 'Payment ID no encontrado' });
      return;
    }

    console.log('[webhook] Consultando datos del pago en MercadoPago...');
    const paymentData = await payment.get({ id: paymentId });

    console.log('[webhook] ✅ Datos del pago obtenidos:');
    console.log('  - ID:', paymentData.id);
    console.log('  - Status:', paymentData.status);
    console.log('  - External Reference:', paymentData.external_reference);
    console.log('  - Order ID:', paymentData.order?.id);
    console.log('  - Amount:', paymentData.transaction_amount);

    const externalReference = paymentData.external_reference;
    const paymentStatus = paymentData.status;

    if (!externalReference) {
      console.error('❌ [webhook] No se encontró external_reference en el pago');
      console.error('[webhook] Payment data:', paymentData);
      res.status(400).json({ error: 'External reference no encontrado' });
      return;
    }

    console.log('[webhook] Buscando compra con ID:', externalReference);
    const compra = await Compra.findByPk(Number(externalReference));

    if (!compra) {
      console.error('❌ [webhook] Compra no encontrada para ID:', externalReference);
      res.status(404).json({ error: 'Compra no encontrada' });
      return;
    }

    console.log('[webhook] ✅ Compra encontrada:');
    console.log('  - ID:', compra.id);
    console.log('  - Estado actual:', compra.estado);
    console.log('  - Usuario:', compra.idUsuario);
    console.log('  - Total:', compra.total);
    console.log('  - Email:', compra.email);

    if (paymentStatus !== 'approved') {
      console.log('[webhook] ⚠️ Pago no aprobado. Estado:', paymentStatus);
      res.status(200).json({
        message: 'Pago registrado pero no aprobado',
        status: paymentStatus
      });
      return;
    }

    if (compra.estado === 'pagada') {
      console.log('[webhook] ⚠️ Compra ya fue confirmada previamente');
      res.status(200).json({ message: 'Compra ya confirmada' });
      return;
    }

    console.log('[webhook] 💰 Pago aprobado. Confirmando compra...');
    await confirmarCompra(compra.id);
    console.log('[webhook] ✅ confirmarCompra() ejecutado');

    await compra.update({
      payment_id: paymentId,
      order_id: paymentData.order?.id
    });
    console.log('[webhook] ✅ Compra actualizada con payment_id y order_id');

    console.log('[webhook] ✅✅✅ Compra confirmada exitosamente:', compra.id);
    console.log('========== FIN WEBHOOK (ÉXITO) ==========\n');

    res.status(200).json({
      message: 'Compra confirmada y stock actualizado',
      compraId: compra.id,
      paymentId: paymentId
    });

  } catch (error) {
    console.error('\n❌ ========== ERROR EN WEBHOOK ==========');
    console.error('[webhook] Tipo de error:', error?.constructor?.name);
    console.error('[webhook] Mensaje:', error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error));
    console.error('[webhook] Stack:', error && typeof error === 'object' && 'stack' in error ? (error as any).stack : 'No stack');
    console.error('[webhook] Error completo:', error);
    console.error('========== FIN ERROR WEBHOOK ==========\n');
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});
 
