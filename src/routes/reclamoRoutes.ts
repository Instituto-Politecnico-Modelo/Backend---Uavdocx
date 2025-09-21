import express from 'express';
import {
    crearReclamo,
    obtenerReclamos,
    obtenerReclamoPorId,
    modificarReclamo,
    eliminarReclamo,
    obtenerReclamosPorUsuario
} from '../controllers/reclamoController';

import { verificarToken } from '../middleware/usuarios';



const router = express.Router();

router.post('/crearReclamo', verificarToken, crearReclamo); 
router.get('/', verificarToken, obtenerReclamos);
router.get('/:id', verificarToken, obtenerReclamoPorId);
router.put('/:id', verificarToken, modificarReclamo);
router.delete('/:id', verificarToken, eliminarReclamo);
router.get('/reclamosUsuario/:idUsuario', verificarToken, obtenerReclamosPorUsuario);

export default router;