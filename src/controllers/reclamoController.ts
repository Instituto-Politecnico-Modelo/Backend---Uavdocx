import { Reclamo } from '../models/reclamo';
import { Request, Response, RequestHandler } from 'express';

export async function crearReclamo(idUsuario: number, tipo: string, descripcion: string) {
	try {
		const nuevoReclamo = await Reclamo.create({ idUsuario, tipo, descripcion });
		return nuevoReclamo;
	} catch (error: any) {
		throw new Error(error.message || 'Error al crear el reclamo');
	}
}



export async function obtenerReclamos(page?: number, limit?: number) {
	try{
		if (page && limit) {
			  const offset = (page - 1) * limit;
			  const { rows: prendas, count: total } = await Reclamo.findAndCountAll({
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
			  const prendas = await Reclamo.findAll();
			  return prendas;
			}
	  } catch (error) {
		  throw new Error('Error al obtener las prendas');
		}
}

export async function obtenerReclamoPorId(id: number) {
	try {
		const reclamo = await Reclamo.findByPk(id);
		if (!reclamo) {
			return null;
		}
		return reclamo;
	} catch (error: any) {
		throw new Error(error.message || 'Error al obtener el reclamo');
	}
}

export async function modificarReclamo(id: number, tipo?: string, descripcion?: string, estado?: string, fecha_resolucion?: Date) {
	try {
		const reclamo = await Reclamo.findByPk(id);
		if (!reclamo) {
			return null;
		}
		await reclamo.update({ tipo, descripcion, estado, fecha_resolucion });
		return reclamo;
	} catch (error: any) {
		throw new Error(error.message || 'Error al modificar el reclamo');
	}
} 

export async function eliminarReclamo(id: number, idUsuarioSolicitante: number, rol: string) {
	try {
		const reclamo = await Reclamo.findByPk(id);
		if (!reclamo) {
			return false;
		}
	if (rol === 'admin' || reclamo.get('idUsuario') === idUsuarioSolicitante) {
			await reclamo.destroy();
			return true;
		} else {
			return null;
		}
	} catch (error: any) {
		throw new Error(error.message || 'Error al eliminar el reclamo');
	}
}

export async function obtenerReclamosPorUsuario(idUsuario: number) {
	try {
		const reclamos = await Reclamo.findAll({ where: { idUsuario } });
		return reclamos;
	} catch (error: any) {
		throw new Error(error.message || 'Error al obtener los reclamos del usuario');
	}
}