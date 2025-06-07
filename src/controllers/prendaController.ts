import { Request, Response } from 'express';
import { Prenda } from '../models/prendas';

export const crearPrenda = async (req: Request, res: Response) => {
  try {
    const {nombre, precio, talles, categoria } = req.body;
    const nuevaPrenda = await Prenda.create({nombre, precio, talles, categoria });
    res.status(201).json(nuevaPrenda);
  } catch (error) {
    res.status(500).json({ error: 'Error con crear la prenda'});
  }
};

export const obtenerPrendas = async (req: Request, res: Response) => {
  try {
    const prendas = await Prenda.findAll();
    res.status(200).json(prendas);
  } catch (error) {
    res.status(500).json({ error: 'Error con obtener las prendas'});
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
