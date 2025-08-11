import { Router } from 'express';
import { obtenerCarrito,eliminarProductoCarrito, agregarAlCarrito} from '../controllers/carritoController';

const router = Router();


router.post('/agregar', agregarAlCarrito);
router.delete('/eliminar', eliminarProductoCarrito);
router.get('', obtenerCarrito);

export default router;
