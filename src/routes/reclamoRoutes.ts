import express from 'express';
import {
    crearReclamo,
    obtenerReclamos,
    obtenerReclamoPorId,
    modificarReclamo,
    eliminarReclamo
} from '../controllers/reclamoController';


const router = express.Router();

router.post('/', crearReclamo); 
router.get('/', obtenerReclamos);
router.get('/:id', obtenerReclamoPorId);
router.put('/:id', modificarReclamo);
router.delete('/:id', eliminarReclamo);

export default router;