import { Router } from 'express';
import { crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda, cargarPrendas } from '../controllers/prendaController';

const router = Router();

router.post('/crearPrenda', crearPrenda);
router.get('/listarPrendas', obtenerPrendas);
router.put('/:id', actualizarPrenda);
router.delete('/:id', eliminarPrenda);
router.get('/cargarPrendas',cargarPrendas)
router.get('/:id', obtenerPrendas)



router.get('/productos', obtenerPrendas)



export default router;
