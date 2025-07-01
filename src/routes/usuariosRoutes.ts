import express from 'express';
import { 
    comprobarUsuario,
    registrarUsuario,
    verificarUsuario,
    solicitarResetContrasenia,
    resetearContrasenia
} 
from '../controllers/usuarioController';

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/ingresar', comprobarUsuario);
router.get('/verificar/:token', verificarUsuario);
router.post('/olvide-contrasenia', solicitarResetContrasenia);
router.post('/resetear-contrasenia/:token', resetearContrasenia);

export default router;