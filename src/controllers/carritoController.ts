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

type ProductoCarrito = { id: number; cantidad: number; precio: number };

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
        if (nuevosProductos[prod.id]) {
          nuevosProductos[prod.id].cantidad += prod.cantidad;
          nuevosProductos[prod.id].precio = precio; 
        } else {
          nuevosProductos[prod.id] = { id: prod.id, cantidad: prod.cantidad, precio };
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
    const productosArray: ProductoCarrito[] = Object.values(productos);
    const precioTotal = carrito.get('precioTotal') as number || 0;

    res.status(200).json({ productos: productosArray, precioTotal });
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
    const productos = (carrito.get('productos') || {}) as { [key: string]: ProductoCarrito };
    if (productos[productoId]) {
      delete productos[productoId];

      let precioTotal = 0;
      for (const key in productos) {
        const producto = productos[key];
        const prendaId = Number(key);
        const prenda = await Prenda.findByPk(prendaId);
        if (prenda && producto.cantidad) {
          const precio = prenda.get('precio') as number;
          precioTotal += precio * producto.cantidad;
          producto.precio = precio;
        }
      }

      carrito.set('precioTotal', precioTotal);
      carrito.set('productos', JSON.parse(JSON.stringify(productos)));
      await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
      await t.commit();
      res.status(200).json({ message: 'Producto eliminado del carrito y de la base de datos', carrito });
    } else {
      await t.rollback();
      res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar el producto del carrito' });
  }
};

  export const sumarCantidadCarrito = async (req: Request, res: Response): Promise<void> => {
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
      const productos = (carrito.get('productos') || {}) as { [key: string]: ProductoCarrito };
      if (productos[productoId]) {
        productos[productoId].cantidad += 1;
        let precioTotal = 0;
        for (const key in productos) {
          const producto = productos[key];
          precioTotal += producto.precio * producto.cantidad;
        }
        carrito.set('precioTotal', precioTotal);
        carrito.set('productos', JSON.parse(JSON.stringify(productos)));
        await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
        await t.commit();
        res.status(200).json({ message: 'Cantidad sumada', carrito });
      } else {
        await t.rollback();
        res.status(404).json({ error: 'Producto no encontrado en el carrito' });
      }
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: 'Error al sumar cantidad' });
    }
  }

  export const restarCantidadCarrito = async (req: Request, res: Response): Promise<void> => {
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
      const productos = (carrito.get('productos') || {}) as { [key: string]: ProductoCarrito };
      if (productos[productoId]) {
        if (productos[productoId].cantidad > 1) {
          productos[productoId].cantidad -= 1;
        }
        let precioTotal = 0;
        for (const key in productos) {
          const producto = productos[key];
          precioTotal += producto.precio * producto.cantidad;
        }
        carrito.set('precioTotal', precioTotal);
        carrito.set('productos', JSON.parse(JSON.stringify(productos)));
        await carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
        await t.commit();
        res.status(200).json({ message: 'Cantidad restada', carrito });
      } else {
        await t.rollback();
        res.status(404).json({ error: 'Producto no encontrado en el carrito' });
      }
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: 'Error al restar cantidad' });
    }
  }