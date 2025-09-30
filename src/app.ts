import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { sequelize } from './config/db';
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

sequelize.authenticate()
  .then(() => console.log('Conectado a MySQL'))
  .catch(error => console.error('Error de conexión:', error));

sequelize.sync({ alter: true })  
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('Error al sincronizar la base de datos:', err));


  import { MercadoPagoConfig, Preference } from 'mercadopago';
  import { Carrito } from './models/carrito';

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

        if (items.length === 0) {
          res.status(400).json({ error: 'El carrito está vacío' });
          return;
        }

        const preference = new Preference(client);
        const data = await preference.create({
          body: {
            items
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
    
    
