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
} from '../controllers/usuarioController';

import { verificarToken, soloAdmin } from '../middleware/usuarios';

const router = express.Router();

router.post('/registro', async (req, res) => {
  const { usuario, email, contrasenia } = req.body;
  try {
    const result = await registrarUsuario(usuario, email, contrasenia);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message || 'Error al registrar usuario' });
  }
});

router.post('/ingresar', async (req, res) => {
  const { usuario_ingreso, pass_ingreso } = req.body;
  try {
    const result = await comprobarUsuario(usuario_ingreso, pass_ingreso);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message || 'Error al ingresar al usuario' });
  }
});

router.get('/verificar/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const result = await verificarUsuario(token);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message || 'Error al verificar usuario' });
  }
});

router.post('/olvide-contrasenia', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await solicitarResetContrasenia(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message || 'Error al solicitar restablecimiento' });
  }
});

router.post('/resetear-contrasenia/:token', async (req, res) => {
  const token = req.params.token || req.body.token;
  const { nuevaContrasenia } = req.body;
  try {
    const result = await resetearContrasenia(token, nuevaContrasenia);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message || 'Error al resetear contraseña' });
  }
});

router.get('/admin/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }
  try {
    const result = await verificarPermisosAdministrador(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message || 'Error al verificar permisos de administrador' });
  }
});

router.get('/todos', verificarToken, async (req, res) => {
  try {
    const usuarios = await obtenerTodosUsuarios();
    res.status(200).json(usuarios);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message || 'Error al obtener usuarios' });
  }
});

router.post('/cambiar-estado-admin/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }
  try {
    const result = await cambiarEstadoAdministrador(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message || 'Error al cambiar estado de administrador' });
  }
});

router.post('/cambiar-estado-verificado/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }
  try {
    const result = await cambiarEstadoVerificado(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message || 'Error al cambiar estado de verificado' });
  }
});

router.delete('/eliminar/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }
  try {
    const result = await eliminarUsuario(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message || 'Error al eliminar usuario' });
  }
});

export default router;