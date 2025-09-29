import { Compra } from '../models/compra';

export async function crearCompra(data: any) {
	return await Compra.create(data);
}

export async function obtenerCompras() {
    return await Compra.findAll();
}

export async function obtenerCompraPorId(id: number) {
    return await Compra.findAll({ where: { idUsuario: id } });
}