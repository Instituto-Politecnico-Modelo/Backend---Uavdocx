import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { sequelize } from './config/db';
import usuariosRoutes from './routes/usuariosRoutes';
import prendaRoutes from './routes/prendaRoutes';  
import carritoRoutes from './routes/carritoRoutes';  
import { verificarToken } from './middleware/usuarios';

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());

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
