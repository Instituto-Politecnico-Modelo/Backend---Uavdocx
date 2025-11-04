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

app.post('/webhook/mp', (req, res) => {
  const mpKey = req.headers['x-signature-key'] || req.query.key;
  const expectedKey = 'd86f69ff80e1888d3ea4a654b2655886f527149a021d80d2b02c78cd458f0480';
  if (mpKey !== expectedKey) {
    res.status(401).json({ error: 'Clave inválida' });
    return;
  }
  console.log('Webhook MP recibido:', req.body);
  res.status(200).json({ received: true });
});





import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: 'APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519' });

app.post('/create-preference', verificarToken, (req, res) => {
  (async () => {
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
          // Configura la URL de notificación para Mercado Pago
          notification_url: 'http://uavdocx-backend-2nzhgo-1718e0-186-153-57-93.traefik.me/webhook/mp?key=d86f69ff80e1888d3ea4a654b2655886f527149a021d80d2b02c78cd458f0480'
        }
      });
      res.status(200).json({
        preference_id: data.id,
        preference_url: data.init_point,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la preferencia' });
    }
  })();
});
    
    
