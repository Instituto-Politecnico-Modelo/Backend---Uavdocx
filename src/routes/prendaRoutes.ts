import { Router } from 'express';
import { crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda } from '../controllers/prendaController';

const router = Router();

router.post('/crearPrenda', crearPrenda);
router.get('/listarPrendas', obtenerPrendas);
router.put('/:id', actualizarPrenda);
router.delete('/:id', eliminarPrenda);
<<<<<<< HEAD
<<<<<<< HEAD
=======
router.get('/:id', obtenerPrendas)
>>>>>>> debugger
=======

router.get('/:id', obtenerPrendas)
router.get('/productos', obtenerPrendas)

>>>>>>> modifUIUX

export default router;
