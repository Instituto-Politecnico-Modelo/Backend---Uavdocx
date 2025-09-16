import express from 'express';
import { 
    comprobarUsuario,
    registrarUsuario,
    verificarUsuario,
    solicitarResetContrasenia,
    resetearContrasenia,
    verificarPermisosAdministrador
} 
from '../controllers/usuarioController';


const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/ingresar', comprobarUsuario);
router.get('/verificar/:token', verificarUsuario);
router.post('/olvide-contrasenia', solicitarResetContrasenia);
router.post('/resetear-contrasenia/:token', resetearContrasenia);
router.get('/admin/:id', verificarPermisosAdministrador);

export default router;