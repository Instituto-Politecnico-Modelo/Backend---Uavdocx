import { Router } from 'express';
import { obtenerCarrito, eliminarProductoCarrito, agregarAlCarrito, sumarCantidadCarrito, restarCantidadCarrito } from '../controllers/carritoController';
import { verificarToken } from '../middleware/usuarios';


const router = Router();




router.post('/sumar', verificarToken, sumarCantidadCarrito);
router.post('/restar', verificarToken, restarCantidadCarrito);
router.post('/agregar', verificarToken, agregarAlCarrito);
router.delete('/eliminar', verificarToken, eliminarProductoCarrito);
router.get('', verificarToken, obtenerCarrito);

export default router;
