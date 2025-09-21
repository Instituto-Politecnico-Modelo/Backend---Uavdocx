import { Request, Response } from 'express';
import { sequelize } from '../config/db';
import { Usuario } from '../models/usuarios'; 
import { Carrito } from '../models/carrito'; 
import { Prenda } from '../models/prendas'; 



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

type ProductoCarrito = { id: number; cantidad: number; precio: number; talle: string };

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
    let carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    let nuevosProductos: { [key: string]: ProductoCarrito } = {};

    if (carrito) {
      const actuales = (carrito.get('productos') as { [key: string]: ProductoCarrito }) || {};
      nuevosProductos = { ...actuales };
    }

    for (const prod of productos) {
      const prenda = await Prenda.findByPk(prod.id);
      if (prenda) {
        const precio = prenda.get('precio') as number;
        const clave = `${prod.id}-${prod.talle}`;
        if (nuevosProductos[clave]) {
          nuevosProductos[clave].cantidad += prod.cantidad;
          nuevosProductos[clave].precio = precio;
        } else {
          nuevosProductos[clave] = { id: prod.id, cantidad: prod.cantidad, precio, talle: prod.talle };
        }
      }
    }


    let precioTotal = 0;
    for (const key in nuevosProductos) {
      const producto = nuevosProductos[key];
      precioTotal += producto.precio * producto.cantidad;
    }

    if (!carrito) {
      await Carrito.create({ idUsuario: usuarioId, productos: nuevosProductos, precioTotal }, { transaction: t });
    } else {
      carrito.set('productos', { ...nuevosProductos });
      carrito.set('precioTotal', precioTotal);
      carrito.changed('productos' as any, true);
      carrito.changed('precioTotal' as any, true);
      await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
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
    res.status(403).json({ error: 'No tenés permisos para obtener el carrito.' });
    return;
  }

  try {
    let carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
    if (!carrito) {
      carrito = await Carrito.create({ idUsuario: usuarioId, productos: {} as { [key: string]: ProductoCarrito }, precioTotal: 0 });
      res.status(201).json({ productos: [], precioTotal: 0 });
      return;
    }

    const productos = (carrito.get('productos') as { [key: string]: ProductoCarrito }) || {};
    const productosArray = Object.entries(productos).map(([key, value]) => ({
      ...value,
      clave: key
    }));
    const precioTotal = carrito.get('precioTotal') as number || 0;

    res.status(200).json({ productos: productosArray, precioTotal });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
};


export const eliminarProductoCarrito = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

  const { productoId, talle } = req.body;
  const clave = `${productoId}-${talle}`;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      res.status(404).json({ error: 'Carrito no encontrado.' });
      await t.rollback();
      return;
    }
    const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
    if (productos[clave]) {
      delete productos[clave];
      // Recalcular precio total
      let precioTotal = 0;
      for (const key in productos) {
        const prod = productos[key];
        precioTotal += prod.precio * prod.cantidad;
      }
      carrito.set('productos', productos);
      carrito.set('precioTotal', precioTotal);
      carrito.changed('productos' as any, true);
      carrito.changed('precioTotal' as any, true);
      await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
      await t.commit();
      res.status(200).json({ message: 'Producto eliminado del carrito.' });
    } else {
      await t.rollback();
      res.status(404).json({ error: 'Producto no encontrado en el carrito.' });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar producto del carrito.' });
  }
};

export const sumarCantidadCarrito = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

  const { productoId, talle } = req.body;
  const clave = `${productoId}-${talle}`;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      res.status(404).json({ error: 'Carrito no encontrado.' });
      await t.rollback();
      return;
    }
    const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
    if (productos[clave]) {
      productos[clave].cantidad += 1;
      // Recalcular precio total
      let precioTotal = 0;
      for (const key in productos) {
        const prod = productos[key];
        precioTotal += prod.precio * prod.cantidad;
      }
      carrito.set('productos', productos);
      carrito.set('precioTotal', precioTotal);
      carrito.changed('productos' as any, true);
      carrito.changed('precioTotal' as any, true);
      await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
      await t.commit();
      res.status(200).json({ message: 'Cantidad aumentada.' });
    } else {
      await t.rollback();
      res.status(404).json({ error: 'Producto no encontrado en el carrito.' });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al aumentar cantidad.' });
  }
};

export const restarCantidadCarrito = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

  const { productoId, talle } = req.body;
  const clave = `${productoId}-${talle}`;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      res.status(404).json({ error: 'Carrito no encontrado.' });
      await t.rollback();
      return;
    }
    const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
    if (productos[clave]) {
      productos[clave].cantidad -= 1;
      if (productos[clave].cantidad <= 0) {
        delete productos[clave];
      }
      // Recalcular precio total
      let precioTotal = 0;
      for (const key in productos) {
        const prod = productos[key];
        precioTotal += prod.precio * prod.cantidad;
      }
      carrito.set('productos', productos);
      carrito.set('precioTotal', precioTotal);
      carrito.changed('productos' as any, true);
      carrito.changed('precioTotal' as any, true);
      await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
      await t.commit();
      res.status(200).json({ message: 'Cantidad disminuida.' });
    } else {
      await t.rollback();
      res.status(404).json({ error: 'Producto no encontrado en el carrito.' });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al disminuir cantidad.' });
  }
};