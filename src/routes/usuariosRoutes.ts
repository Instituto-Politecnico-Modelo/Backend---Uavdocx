import express from 'express';
import { 
    comprobarUsuario,
    registrarUsuario,
    verificarUsuario,
    solicitarResetContrasenia,
    resetearContrasenia,
    verificarPermisosAdministrador,
    obtenerTodosUsuarios,
    cambiarEstadoAdministrador,
    cambiarEstadoVerificado,
    eliminarUsuario
} 
from '../controllers/usuarioController';

import { verificarToken, soloAdmin } from '../middleware/usuarios';

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post('/ingresar', comprobarUsuario);
router.get('/verificar/:token', verificarUsuario);
router.post('/olvide-contrasenia', solicitarResetContrasenia);
router.post('/resetear-contrasenia/:token', resetearContrasenia);
router.get('/admin/:id', verificarPermisosAdministrador);

router.get('/todos', verificarToken, obtenerTodosUsuarios);

router.post('/cambiar-estado-admin/:id', verificarToken, soloAdmin, cambiarEstadoAdministrador);
router.post('/cambiar-estado-verificado/:id', verificarToken, soloAdmin, cambiarEstadoVerificado);
router.delete('/eliminar/:id', verificarToken, soloAdmin, eliminarUsuario);

export default router;