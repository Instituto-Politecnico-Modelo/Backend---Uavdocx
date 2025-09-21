import { Reclamo } from '../models/reclamo';
import { Request, Response, RequestHandler } from 'express';

export const crearReclamo: RequestHandler = async (req, res) => {
	try {
		const { idUsuario, tipo, descripcion } = req.body;
		const nuevoReclamo = await Reclamo.create({
			idUsuario,
			tipo,
			descripcion
		});
		res.status(201).json(nuevoReclamo);
		return;
	} catch (error: any) {
		res.status(500).json({ error: 'Error al crear el reclamo', details: error.message });
		return;
	}
};

export const obtenerReclamos: RequestHandler = async (req, res) => {
	try {
		const reclamos = await Reclamo.findAll();
		res.json(reclamos);
		return;
	} catch (error: any) {
		res.status(500).json({ error: 'Error al obtener los reclamos', details: error.message });
		return;
	}
};

export const obtenerReclamoPorId: RequestHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const reclamo = await Reclamo.findByPk(id);
		if (!reclamo) {
			res.status(404).json({ error: 'Reclamo no encontrado' });
			return;
		}
		res.json(reclamo);
		return;
	} catch (error: any) {
		res.status(500).json({ error: 'Error al obtener el reclamo', details: error.message });
		return;
	}
};

export const modificarReclamo: RequestHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const { tipo, descripcion, estado, fecha_resolucion } = req.body;
		const reclamo = await Reclamo.findByPk(id);
		if (!reclamo) {
			res.status(404).json({ error: 'Reclamo no encontrado' });
			return;
		}
		await reclamo.update({ tipo, descripcion, estado, fecha_resolucion });
		res.json(reclamo);
		return;
	} catch (error: any) {
		res.status(500).json({ error: 'Error al modificar el reclamo', details: error.message });
		return;
	}
};

export const eliminarReclamo: RequestHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const reclamo = await Reclamo.findByPk(id);
		if (!reclamo) {
			res.status(404).json({ error: 'Reclamo no encontrado' });
			return;
		}
		await reclamo.destroy();
		res.json({ mensaje: 'Reclamo eliminado correctamente' });
		return;
	} catch (error: any) {
		res.status(500).json({ error: 'Error al eliminar el reclamo', details: error.message });
		return;
	}
};

export const obtenerReclamosPorUsuario: RequestHandler = async (req, res) => {
	try {
		const { idUsuario } = req.params;
		const reclamos = await Reclamo.findAll({ where: { idUsuario } });
		res.json(reclamos);
		return;
	} catch (error: any) {
		res.status(500).json({ error: 'Error al obtener los reclamos del usuario', details: error.message });
		return;
	}	
};