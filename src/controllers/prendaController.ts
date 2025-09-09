import { Request, Response } from 'express';
import { Prenda } from '../models/prendas';
import { sequelize } from '../config/db';
import { literal, Op } from 'sequelize';
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


export const crearPrenda = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;

  const autorizado = await verificarPermisosAdministrador(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenes los permisos para realizar esta acción.' });
    return;
  }

  const t = await sequelize.transaction();
  try {
    const { nombre, precio, talles, categoria, imagen } = req.body;
    const nuevaPrenda = await Prenda.create({ nombre, precio, talles, categoria, imagen }, { transaction: t });
    await t.commit();
    res.status(201).json(nuevaPrenda);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al crear la prenda' });
  }
};





export const actualizarPrenda = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;

  const autorizado = await verificarPermisosAdministrador(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    await Prenda.update(req.body, { where: { id }, transaction: t });
    await t.commit();
    res.sendStatus(204);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar la prenda' });
  }
};



export const eliminarPrenda = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user?.id;

  const autorizado = await verificarPermisosAdministrador(usuarioId);
  if (!autorizado) {
    res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    return;
  }

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
  try {
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);

    const offset = (page - 1) * limit;
    const { rows: prendas, count: total } = await Prenda.findAndCountAll({
      limit, 
      offset
    });

    res.status(200).json({
      total,
      page,
      limit,
      data: prendas
    });
  } catch (error) {
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
