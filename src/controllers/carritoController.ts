import { Request, Response } from 'express';
import { sequelize } from '../config/db';
import { Usuario } from '../models/usuarios'; 
import { Carrito } from '../models/carrito'; 
import { Prenda } from '../models/prendas'; 




export async function verificarVerificado(usuarioId: number): Promise<boolean> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) return false;

  const { verificado } = usuario.get();
  return verificado === true;
}

type ProductoCarrito = { id: number; cantidad: number; precio: number; talle: string };



export async function agregarAlCarrito(usuarioId: number, productos: any[]): Promise<{ message: string } | { error: string }> {
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    return { error: 'No tenés permisos para realizar esta acción.' };
  }
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
    return { message: 'Productos agregados al carrito' };
  } catch (error) {
    await t.rollback();
    return { error: 'Error al agregar productos al carrito' };
  }
}

export async function obtenerCarrito(usuarioId: number): Promise<{ productos: any[]; precioTotal: number } | { error: string }> {
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    return { error: 'No tenés permisos para obtener el carrito.' };
  }
  try {
    let carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
    if (!carrito) {
      carrito = await Carrito.create({ idUsuario: usuarioId, productos: {} as { [key: string]: ProductoCarrito }, precioTotal: 0 });
      return { productos: [], precioTotal: 0 };
    }
    const productos = (carrito.get('productos') as { [key: string]: ProductoCarrito }) || {};
    const productosArray = Object.entries(productos).map(([key, value]) => ({
      ...value,
      clave: key
    }));
    const precioTotal = carrito.get('precioTotal') as number || 0;
    return { productos: productosArray, precioTotal };
  } catch (error) {
    return { error: 'Error al obtener el carrito' };
  }
}


export async function eliminarProductoCarrito(usuarioId: number, productoId: number, talle: string): Promise<{ message: string } | { error: string }> {
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    return { error: 'No tenés permisos para realizar esta acción.' };
  }
  const clave = `${productoId}-${talle}`;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      await t.rollback();
      return { error: 'Carrito no encontrado.' };
    }
    const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
    if (productos[clave]) {
      delete productos[clave];
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
      return { message: 'Producto eliminado del carrito.' };
    } else {
      await t.rollback();
      return { error: 'Producto no encontrado en el carrito.' };
    }
  } catch (error) {
    await t.rollback();
    return { error: 'Error al eliminar producto del carrito.' };
  }
}

export async function sumarCantidadCarrito(usuarioId: number, productoId: number, talle: string): Promise<{ message: string } | { error: string }> {
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    return { error: 'No tenés permisos para realizar esta acción.' };
  }
  const clave = `${productoId}-${talle}`;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      await t.rollback();
      return { error: 'Carrito no encontrado.' };
    }
    const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
    if (productos[clave]) {
      productos[clave].cantidad += 1;
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
      return { message: 'Cantidad aumentada.' };
    } else {
      await t.rollback();
      return { error: 'Producto no encontrado en el carrito.' };
    }
  } catch (error) {
    await t.rollback();
    return { error: 'Error al aumentar cantidad.' };
  }
}

export async function restarCantidadCarrito(usuarioId: number, productoId: number, talle: string): Promise<{ message: string } | { error: string }> {
  const autorizado = await verificarVerificado(usuarioId);
  if (!autorizado) {
    return { error: 'No tenés permisos para realizar esta acción.' };
  }
  const clave = `${productoId}-${talle}`;
  const t = await sequelize.transaction();
  try {
    const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
    if (!carrito) {
      await t.rollback();
      return { error: 'Carrito no encontrado.' };
    }
    const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
    if (productos[clave]) {
      productos[clave].cantidad -= 1;
      if (productos[clave].cantidad <= 0) {
        delete productos[clave];
      }
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
      return { message: 'Cantidad disminuida.' };
    } else {
      await t.rollback();
      return { error: 'Producto no encontrado en el carrito.' };
    }
  } catch (error) {
    await t.rollback();
    return { error: 'Error al disminuir cantidad.' };
  }
}