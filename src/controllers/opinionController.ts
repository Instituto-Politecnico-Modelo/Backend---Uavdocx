export async function existeOpinionParaCompra(idCompra: number) {
    const opinion = await Opinion.findOne({ where: { idCompra } });
    return !!opinion;
}
import { Opinion } from '../models/opinion';

export async function crearOpinion(usuario: String, usuarioId: number, compraId: number, calificacion: number, comentario?: string, foto?: string) {
    return await Opinion.create({ usuario: usuario, idUsuario: usuarioId, idCompra: compraId, calificacion, comentario, foto });
}

export async function obtenerOpiniones() {
    return await Opinion.findAll();
}

export async function opinionesUsuario(usuarioId: number) {
    return await Opinion.findAll({ where: { idUsuario: usuarioId } });
}

export async function eliminarOpinion(opinionId: number) {
    return await Opinion.destroy({ where: { id: opinionId } });
}