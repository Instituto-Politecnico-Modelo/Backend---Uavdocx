import { Router } from 'express';
import { crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda, cargarPrendas, buscarPrendasPorNombre } from '../controllers/prendaController';

const router = Router();

import { authenticateToken } from '../middleware/usuarios';

router.post('/crearPrenda', authenticateToken, crearPrenda);
router.get('/buscarPrendas', buscarPrendasPorNombre);
router.get('/listarPrendas', obtenerPrendas);
router.put('/:id', authenticateToken, actualizarPrenda);
router.delete('/:id', authenticateToken,  eliminarPrenda);
router.get('/cargarPrendas',cargarPrendas);
router.get('/:id', obtenerPrendas);



router.get('/productos', obtenerPrendas)



export default router;
