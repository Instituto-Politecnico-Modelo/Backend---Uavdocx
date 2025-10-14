import { Router } from 'express';
import { filtrarPrendas ,crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda, cargarPrendas, buscarPrendasPorNombre, 
    getPrendaPorId, talleDisponibleHandler, restarStockPrenda } from '../controllers/prendaController';

const router = Router();


import { verificarToken, soloAdmin } from '../middleware/usuarios';

router.post('/crearPrenda', verificarToken, soloAdmin, crearPrenda);
router.get('/buscarPrendas', buscarPrendasPorNombre);
router.get('/listarPrendas', obtenerPrendas);
router.put('/:id', verificarToken, soloAdmin, actualizarPrenda);
router.delete('/:id', verificarToken, soloAdmin, eliminarPrenda);
router.get('/cargarPrendas',cargarPrendas);

router.get('/:id', getPrendaPorId);


router.post('/filtrar', filtrarPrendas)
router.get('/productos', obtenerPrendas)
router.get('/talleDisponible/:id/:talle/:cantidad', talleDisponibleHandler)

router.post('/restarStock', async (req, res) => {
    const { id, talle, cantidad } = req.body;
    try {
        const exito = await restarStockPrenda(id, talle, cantidad);
        if (exito) {
            res.status(200).json({ message: 'Stock actualizado correctamente' });
        } else {
            res.status(400).json({ error: 'No se pudo actualizar el stock. Verifique los datos.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el stock' });
    }
});


export default router;
