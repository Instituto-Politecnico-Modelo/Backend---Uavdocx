export async function existeOpinionParaCompra(idCompra: number) {
    const opinion = await Opinion.findOne({ where: { idCompra } });
    return !!opinion;
}
import { Opinion } from '../models/opinion';

export async function crearOpinion(usuarioId: number, compraId: number, calificacion: number, comentario?: string, foto?: string) {
    return await Opinion.create({ idUsuario: usuarioId, idCompra: compraId, calificacion, comentario, foto });
}

export async function obtenerOpiniones() {
    return await Opinion.findAll();
}

export async function opinionesUsuario(usuarioId: number) {
    return await Opinion.findAll({ where: { idUsuario: usuarioId } });
}

export async function eliminarOpinion(id: number) {
    const opinion = await Opinion.findByPk(id);
    if (opinion) {
        await opinion.destroy();
        return true;
    }
    return false;
}