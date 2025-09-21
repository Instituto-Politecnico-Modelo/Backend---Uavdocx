import express from 'express';
import { 
    comprobarUsuario,
    registrarUsuario,
    verificarUsuario,
    solicitarResetContrasenia,
    resetearContrasenia,
    verificarPermisosAdministrador,
    obtenerTodosUsuarios
} 
from '../controllers/usuarioController';

import { verificarToken } from '../middleware/usuarios';

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/ingresar', comprobarUsuario);
router.get('/verificar/:token', verificarUsuario);
router.post('/olvide-contrasenia', solicitarResetContrasenia);
router.post('/resetear-contrasenia/:token', resetearContrasenia);
router.get('/admin/:id', verificarPermisosAdministrador);

router.get('/todos', verificarToken, obtenerTodosUsuarios);

export default router;