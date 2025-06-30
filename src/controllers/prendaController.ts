import { Request, Response } from 'express';
import { Prenda } from '../models/prendas';
import { Op } from 'sequelize';


export const crearPrenda = async (req: Request, res: Response) => {
  try {


    const {nombre, precio, talles, categoria, imagen } = req.body;
    const nuevaPrenda = await Prenda.create({nombre, precio, talles, categoria, imagen });



    res.status(201).json(nuevaPrenda);
  } catch (error) {
    res.status(500).json({ error: 'Error con crear la prenda'});
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




export const actualizarPrenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Prenda.update(req.body, { where: { id } });
  res.sendStatus(204);
};

export const eliminarPrenda = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Prenda.destroy({ where: { id } });
  res.sendStatus(204);
};


export const obtenerPrenda = async (req: Request, res: Response) => {
  try {
    const id = req.params.id; 
    const prenda = await Prenda.findByPk(id);

    if (!prenda) {
      return res.status(404).json({ error: 'Prenda no encontrada' });
    }

    res.status(200).json(prenda);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la prenda' });
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
  const { nombre} = req.query;



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