import { Request, Response } from 'express';
import { Prenda } from '../models/prendas';
import { sequelize } from '../config/db';
import { literal, Op } from 'sequelize';
import { Usuario } from '../models/usuarios'; 
import { soloAdmin } from '../middleware/usuarios';





export async function talleDisponiblePorPrenda(id: number, talle: string, cantidad: number): Promise<{disponible: boolean, stockActual: number | null}> {
  const prenda = await Prenda.findByPk(id);
  if (!prenda) return { disponible: false, stockActual: null };
  const talles = prenda.get('talles') as { [key: string]: number };
  const stockActual = talles[talle] ?? null;
  return { disponible: stockActual !== null && stockActual >= cantidad, stockActual };
}
export const talleDisponibleHandler = async (req: Request, res: Response) => {
  const { id, talle, cantidad } = req.params;
  try {
    const result = await talleDisponiblePorPrenda(Number(id), talle, Number(cantidad));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar disponibilidad de talle' });
  }
};

export async function verificarVerificado(usuarioId: number): Promise<boolean> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) return false;

  const { verificado } = usuario.get();
  return verificado === true;
}


export const crearPrenda = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;



  const t = await sequelize.transaction();
  try {
    const { nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias } = req.body;
    const nuevaPrenda = await Prenda.create({ nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias }, { transaction: t });
    await t.commit();
    res.status(201).json(nuevaPrenda);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al crear la prenda' });
  }
};





export const actualizarPrenda = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;



  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    const { nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias } = req.body;
    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (precio !== undefined) updateData.precio = precio;
    if (talles !== undefined) updateData.talles = talles;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (imagenPrincipal !== undefined) updateData.imagenPrincipal = imagenPrincipal;
    if (imagenesSecundarias !== undefined) updateData.imagenesSecundarias = imagenesSecundarias;

    await Prenda.update(updateData, { where: { id }, transaction: t });
    await t.commit();
    res.sendStatus(204);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar la prenda' });
  }
};



export const eliminarPrenda = async (req: Request, res: Response): Promise<void> => {
 
  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    await Prenda.destroy({ where: { id }, transaction: t });
    await t.commit();
    res.sendStatus(204);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar la prenda' });
  }
};





export const cargarPrendas = async (req: Request, res: Response) => {
  try {
    const prendas = await Prenda.findAll(); 
    res.status(200).json(prendas);
  } catch (error) {
    console.error("Error al listar prendas:", error);
    res.status(500).json({ error: 'Error al obtener las prendas' });
  }
};

export const buscarPrendasPorNombre = async (req: Request, res: Response) => {
  const { nombre } = req.query;
  try {
    const prendas = await Prenda.findAll({
      where: nombre
        ? { nombre: { [Op.like]: `%${nombre}%` } }
        : {}
    });
    res.json(prendas);
  } catch (error: any) {
    console.error('Error en buscarPrendasPorNombre:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPrendas = async (req: Request, res: Response) => {
  console.log('obtenerPrendas: inicio');
  try {
    console.log('obtenerPrendas: req.query', req.query);
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    console.log('obtenerPrendas: page', page, 'limit', limit);

    const offset = (page - 1) * limit;
    console.log('obtenerPrendas: offset', offset);
    const { rows: prendas, count: total } = await Prenda.findAndCountAll({
      limit, 
      offset
    });
    console.log('obtenerPrendas: prendas encontradas', prendas);
    console.log('obtenerPrendas: total', total);

    res.status(200).json({
      total,
      page,
      limit,
      data: prendas
    });
    console.log('obtenerPrendas: respuesta enviada');
  } catch (error) {
    console.error('obtenerPrendas: error', error);
    res.status(500).json({ error: 'Error al obtener las prendas' });
  }
};

export const filtrarPrendas = async (req: Request, res: Response) => {//talles todavia no
  try {
    const { minimo, maximo, categoria, talles } = req.body;
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
          literal(`("talles"->>'${talle}')::int >= ${cantidad}`)
        );

      }
    }

    const prendas = await Prenda.findAll({
      where: {
        ...whereClause,
        ...(tallesConditions.length > 0 ? { [Op.and]: tallesConditions } : {})
      }
    });

    res.status(200).json(prendas);
  } catch (error) {
    console.error('Error en filtrarPrendas:', error);
    res.status(500).json({ error: 'Error al filtrar las prendas' });
  }
};


export const getPrendaPorId = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const prenda = await Prenda.findByPk(id);
    if (!prenda) {
      res.status(404).json({ error: 'Prenda no encontrada' });
      return;
    }
  res.status(200).json(prenda);
  return;
  } catch (error) {
  res.status(500).json({ error: 'Error al obtener la prenda' });
  return;
  }
};

export async function restarStockPrenda(id: number, talle: string, cantidad: number): Promise<boolean> {
  const prenda = await Prenda.findByPk(id);
  if (!prenda) return false;
  const talles = prenda.get('talles') as { [key: string]: number };
  if (!(talle in talles) || talles[talle] < cantidad) return false;
  talles[talle] -= cantidad;
  await prenda.update({ talles });
  return true;
}