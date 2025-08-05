import { Request, Response } from 'express';
import { sequelize } from '../config/db';
import { Usuario } from '../models/usuarios'; 
import { Carrito } from '../models/carrito'; 

export async function verificarPermisosAdministrador(usuarioId: number): Promise<boolean> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) return false;

  const { verificado, admin } = usuario.get();
  return verificado === true && admin === true;
}

export async function verificarVerificado(usuarioId: number): Promise<boolean> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) return false;

  const { verificado } = usuario.get();
  return verificado === true;
}

export const agregarAlCarrito = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

  const { productos } = req.body;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      await Carrito.create({ idUsuario: usuarioId, productos }, { transaction: t });
    } else {
      carrito.set('productos', { ...(carrito.get('productos') || {}), ...productos });
      await carrito.save({ transaction: t });
    }
    await t.commit();
    res.status(200).json({ message: 'Productos agregados al carrito' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al agregar productos al carrito' });
  }
};

export const obtenerCarrito = async (req: Request, res: Response): Promise<void> => { 
  const usuarioId = (req as any).user?.id;
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
    if (!carrito) {
      res.status(404).json({ error: 'Carrito no encontrado' });
      return;
    }
    res.status(200).json(carrito);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
}

export const eliminarProductoCarrito = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }
  const { productoId } = req.body;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      res.status(404).json({ error: 'Carrito no encontrado' });
      return;
    }
    const productos = (carrito.get('productos') || {}) as { [key: string]: any };
    if (productos[productoId]) {
      delete productos[productoId];
      carrito.set('productos', productos);
      await carrito.save({ transaction: t });
      await t.commit();
      res.status(200).json({ message: 'Producto eliminado del carrito' });
    } else {
      await t.rollback();
      res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar el producto del carrito' });
  }
};

