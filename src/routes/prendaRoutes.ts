import { Router } from 'express';
import { filtrarPrendas ,crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda, cargarPrendas, buscarPrendasPorNombre, 
    getPrendaPorId, talleDisponibleHandler } from '../controllers/prendaController';

const router = Router();

import { verificarToken } from '../middleware/usuarios';

router.post('/crearPrenda', verificarToken, crearPrenda);
router.get('/buscarPrendas', buscarPrendasPorNombre);
router.get('/listarPrendas', obtenerPrendas);
router.put('/:id', verificarToken, actualizarPrenda);
router.delete('/:id', verificarToken,  eliminarPrenda);
router.get('/cargarPrendas',cargarPrendas);

router.get('/:id', getPrendaPorId);


router.post('/filtrar', filtrarPrendas)
router.get('/productos', obtenerPrendas)
router.get('/talleDisponible/:id/:talle/:cantidad', talleDisponibleHandler)


export default router;
