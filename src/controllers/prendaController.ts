import { Prenda } from '../models/prendas';
import { sequelize } from '../config/db';
import { literal, Op } from 'sequelize';
import { Usuario } from '../models/usuarios';

export async function talleDisponiblePorPrenda(id: number, talle: string, cantidad: number): Promise<{disponible: boolean, stockActual: number | null}> {
  const prenda = await Prenda.findByPk(id);
  if (!prenda) return { disponible: false, stockActual: null };
  const talles = prenda.get('talles') as { [key: string]: number };
  const stockActual = talles[talle] ?? null;
  return { disponible: stockActual !== null && stockActual >= cantidad, stockActual };
}

export async function verificarVerificado(usuarioId: number): Promise<boolean> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) return false;
  const { verificado } = usuario.get();
  return verificado === true;
}

export async function crearPrenda(nombre: string, precio: number, talles: any, categoria: string, imagenPrincipal: string, imagenesSecundarias?: any) {
  const t = await sequelize.transaction();
  try {
    const nuevaPrenda = await Prenda.create({ nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias }, { transaction: t });
    await t.commit();
    return nuevaPrenda;
  } catch (error) {
    await t.rollback();
    throw new Error('Error al crear la prenda');
  }
}

export async function actualizarPrenda(id: number, nombre?: string, precio?: number, talles?: any, categoria?: string, imagenPrincipal?: string, imagenesSecundarias?: any) {
  const t = await sequelize.transaction();
  try {
    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (precio !== undefined) updateData.precio = precio;
    if (talles !== undefined) updateData.talles = talles;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (imagenPrincipal !== undefined) updateData.imagenPrincipal = imagenPrincipal;
    if (imagenesSecundarias !== undefined) updateData.imagenesSecundarias = imagenesSecundarias;
    await Prenda.update(updateData, { where: { id }, transaction: t });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw new Error('Error al actualizar la prenda');
  }
}

export async function eliminarPrenda(id: number) {
  const t = await sequelize.transaction();
  try {
    await Prenda.destroy({ where: { id }, transaction: t });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw new Error('Error al eliminar la prenda');
  }
}

export async function cargarPrendas() {
  try {
    const prendas = await Prenda.findAll();
    return prendas;
  } catch (error) {
    throw new Error('Error al obtener las prendas');
  }
}

export async function buscarPrendasPorNombre(nombre?: string) {
  try {
    const prendas = await Prenda.findAll({
      where: nombre
        ? { nombre: { [Op.like]: `%${nombre}%` } }
        : {}
    });
    return prendas;
  } catch (error: any) {
    throw new Error(error.message || 'Error en buscarPrendasPorNombre');
  }
}

export async function obtenerPrendas(page?: number, limit?: number) {
  try {
    if (page && limit) {
      const offset = (page - 1) * limit;
      const { rows: prendas, count: total } = await Prenda.findAndCountAll({
        limit,
        offset
      });
      return {
        total,
        page,
        limit,
        data: prendas
      };
    } else {
      const prendas = await Prenda.findAll();
      return prendas;
    }
  } catch (error) {
    throw new Error('Error al obtener las prendas');
  }
}

export async function filtrarPrendas(minimo?: number, maximo?: number, categoria?: string, talles?: any) {
  try {
    const whereClause: any = {};
    if (minimo !== undefined && maximo !== undefined) {
      whereClause.precio = { [Op.between]: [minimo, maximo] };
    } else if (minimo !== undefined) {
      whereClause.precio = { [Op.gte]: minimo };
    } else if (maximo !== undefined) {
      whereClause.precio = { [Op.lte]: maximo };
    }
    if (categoria) {
      whereClause.categoria = categoria;
    }
    const tallesConditions: any[] = [];
    if (talles && typeof talles === 'object') {
      for (const [talle, cantidad] of Object.entries(talles)) {
        tallesConditions.push(
          literal(`(\"talles\"->>'${talle}')::int >= ${cantidad}`)
        );
      }
    }
    const prendas = await Prenda.findAll({
      where: {
        ...whereClause,
        ...(tallesConditions.length > 0 ? { [Op.and]: tallesConditions } : {})
      }
    });
    return prendas;
  } catch (error) {
    throw new Error('Error al filtrar las prendas');
  }
}

export async function getPrendaPorId(id: number) {
  try {
    const prenda = await Prenda.findByPk(id);
    if (!prenda) {
      return null;
    }
    return prenda;
  } catch (error) {
    throw new Error('Error al obtener la prenda');
  }
}

export async function restarStockPrenda(id: number, talle: string, cantidad: number): Promise<boolean> {
  const prenda = await Prenda.findByPk(id);
  if (!prenda) return false;
  const talles = prenda.get('talles') as { [key: string]: number };
  if (!(talle in talles) || talles[talle] < cantidad) return false;
  talles[talle] -= cantidad;
  await prenda.update({ talles });
  return true;
}