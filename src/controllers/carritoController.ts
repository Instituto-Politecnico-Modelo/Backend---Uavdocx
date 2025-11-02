import { Request, Response } from 'express';
import { sequelize } from '../config/db';
import { Usuario, Carrito, Prenda } from '../app';





type ProductoCarrito = { id: number; cantidad: number; precio: number; talle: string };



export async function agregarAlCarrito(usuarioId: number, productos: any[]): Promise<{ message: string } | { error: string }> {
  
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
        const talles = prenda.get('talles') as Record<string, number>;
        const stock = talles && typeof talles === 'object' ? (talles[prod.talle] ?? 0) : 0;
        const clave = `${prod.id}-${prod.talle}`;
        const cantidadActual = nuevosProductos[clave]?.cantidad || 0;
        const cantidadSolicitada = prod.cantidad;
        if (cantidadActual + cantidadSolicitada > stock) {
          await t.rollback();
          return { error: `No hay suficiente stock disponible para la prenda ${prod.id} talle ${prod.talle}. Stock: ${stock}, en carrito: ${cantidadActual}` };
        }
        if (nuevosProductos[clave]) {
          nuevosProductos[clave].cantidad += cantidadSolicitada;
          nuevosProductos[clave].precio = precio;
        } else {
          nuevosProductos[clave] = { id: prod.id, cantidad: cantidadSolicitada, precio, talle: prod.talle };
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

export async function verificarStockCarrito(usuarioId: number): Promise<{ disponible: boolean; faltantes?: Array<{ id: number; talle: string; cantidadSolicitada: number; stockActual: number }> }> {
  const carrito = await Carrito.findOne({ where: { idUsuario: usuarioId } });
  if (!carrito) return { disponible: false };

  const productos = carrito.get('productos') as { [key: string]: ProductoCarrito };
  const faltantes: Array<{ id: number; talle: string; cantidadSolicitada: number; stockActual: number }> = [];

  for (const key in productos) {
    const prod = productos[key];
    const prenda = await Prenda.findByPk(prod.id);
    if (!prenda) {
      faltantes.push({ id: prod.id, talle: prod.talle, cantidadSolicitada: prod.cantidad, stockActual: 0 });
      continue;
    }
    const talles = prenda.get('talles') as Record<string, number>;
    const stockActual = talles && typeof talles === 'object' ? (talles[prod.talle] ?? 0) : 0;
    if (prod.cantidad > stockActual) {
      faltantes.push({ id: prod.id, talle: prod.talle, cantidadSolicitada: prod.cantidad, stockActual });
    }
  }
  if (faltantes.length > 0) {
    return { disponible: false, faltantes };
  }
  return { disponible: true };
}