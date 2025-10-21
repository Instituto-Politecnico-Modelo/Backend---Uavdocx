import express from 'express';
import {
    crearReclamo,
    obtenerReclamos,
    obtenerReclamoPorId,
    modificarReclamo,
    eliminarReclamo,
    obtenerReclamosPorUsuario
} from '../controllers/reclamoController';

import { verificarToken, soloAdmin } from '../middleware/usuarios';



const router = express.Router();

router.post('/crearReclamo', verificarToken, async (req, res) => {
    const { idUsuario, tipo, descripcion } = req.body;
    try {
        const reclamo = await crearReclamo(idUsuario, tipo, descripcion);
        res.status(201).json(reclamo);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al crear el reclamo' });
    }
});
router.get('/', verificarToken, soloAdmin, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    try {
        const reclamos = await obtenerReclamos(page, limit);
        res.json(reclamos);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener los reclamos' });
    }
});
router.get('/:id', verificarToken, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    try {
        const reclamo = await obtenerReclamoPorId(id);
        if (!reclamo) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        res.json(reclamo);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener el reclamo' });
    }
});
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    const { tipo, descripcion, estado, fecha_resolucion } = req.body;
    try {
        const reclamo = await modificarReclamo(id, tipo, descripcion, estado, fecha_resolucion);
        if (!reclamo) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        res.json(reclamo);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al modificar el reclamo' });
    }
});
router.delete('/:id', verificarToken, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    const user = (req as any).user;
    const idUsuario = user?.id;
    const esAdmin = user?.admin === true;
    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const exito = await eliminarReclamo(id, idUsuario, esAdmin ? 'admin' : 'user');
        if (exito === null) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este reclamo' });
        }
        if (!exito) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        res.json({ mensaje: 'Reclamo eliminado correctamente' });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al eliminar el reclamo' });
    }
});
router.get('/reclamosUsuario/:idUsuario', verificarToken, async (req, res) => {
    const idUsuario = parseInt(req.params.idUsuario, 10);
    if (isNaN(idUsuario)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    try {
        const reclamos = await obtenerReclamosPorUsuario(idUsuario);
        res.json(reclamos);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener los reclamos del usuario' });
    }
});

export default router;