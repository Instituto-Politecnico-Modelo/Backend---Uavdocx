
import { Router } from 'express';
import * as opinionController from '../controllers/opinionController';
import { Opinion } from '../models/opinion';
import { verificarToken } from '../middleware/usuarios';
import { existeOpinionParaCompra } from '../controllers/opinionController';

const router = Router();

router.get('/compra/:id', async (req, res) => {
    const compraId = parseInt(req.params.id, 10);
    if (isNaN(compraId)) {
        return res.status(400).json({ error: 'ID de compra inválido' });
    }
    try {
        const existe = await existeOpinionParaCompra(compraId);
        res.json({ existe });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar la opinión de la compra' });
    }
});


router.post('/:id', verificarToken, async (req, res) => {
    const usuarioId = (req as any).user?.id;
    const compraId = parseInt(req.params.id, 10);
    const { calificacion, comentario, foto } = req.body;

    if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    if (!calificacion || calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ error: 'Calificación inválida. Debe ser un número entre 1 y 5.' });
    }
    if (comentario && comentario.length > 500) {
        return res.status(400).json({ error: 'El comentario no puede exceder los 500 caracteres.' });
    }
    
    try {
        const nueva = await opinionController.crearOpinion(usuarioId, compraId, calificacion, comentario, foto);
        res.status(201).json(nueva);
    } catch (error: any) {
        if (error.message === 'Ya has dejado una opinión para esta compra.') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al crear la opinión' });
    }
});


router.get('/', async (req, res) => {
    try {
        const opiniones = await opinionController.obtenerOpiniones();
        res.json(opiniones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las opiniones' });
    }
});

router.get('/usuario/:id', verificarToken, async (req, res) => {
    const usuarioId = parseInt(req.params.id, 10);
    try {
        const opiniones = await opinionController.opinionesUsuario(usuarioId);
        res.json(opiniones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las opiniones del usuario' });
    }
});

router.delete('/:id', verificarToken, async (req, res) => {
    const opinionId = parseInt(req.params.id, 10);
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    return opinionController.eliminarOpinion(opinionId);
});




export default router;
