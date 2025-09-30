import { Opinion } from '../models/opinion';

export async function crearOpinion(usuarioId: number, compraId: number, calificacion: number, comentario?: string) {
    return await Opinion.create({ idUsuario: usuarioId, idCompra: compraId, calificacion, comentario });
}

export async function obtenerOpiniones() {
    return await Opinion.findAll();
}

export async function opinionesUsuario(usuarioId: number) {
    return await Opinion.findAll({ where: { idUsuario: usuarioId } });
}