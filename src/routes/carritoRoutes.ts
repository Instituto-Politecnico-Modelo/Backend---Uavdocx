import { Router } from 'express';
import { obtenerCarrito,eliminarProductoCarrito, agregarAlCarrito} from '../controllers/carritoController';
import { verificarToken } from '../middleware/usuarios';


const router = Router();



router.post('/agregar', verificarToken, agregarAlCarrito);
router.delete('/eliminar', verificarToken, eliminarProductoCarrito);
router.get('', verificarToken, obtenerCarrito);

export default router;
