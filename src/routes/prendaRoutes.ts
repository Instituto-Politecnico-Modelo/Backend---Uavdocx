import { Router } from 'express';
import { filtrarPrendas ,crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda, cargarPrendas, buscarPrendasPorNombre } from '../controllers/prendaController';

const router = Router();

import { verificarToken } from '../middleware/usuarios';

router.post('/crearPrenda', verificarToken, crearPrenda);
router.get('/buscarPrendas', buscarPrendasPorNombre);
router.get('/listarPrendas', obtenerPrendas);
router.put('/:id', verificarToken, actualizarPrenda);
router.delete('/:id', verificarToken,  eliminarPrenda);
router.get('/cargarPrendas',cargarPrendas);
router.get('/:id', obtenerPrendas);


router.post('/filtrar', filtrarPrendas)
router.get('/productos', obtenerPrendas)



export default router;
