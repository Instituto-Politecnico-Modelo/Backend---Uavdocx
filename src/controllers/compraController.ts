import { Compra } from '../models/compra';


export async function crearCompra(data: any) {
	return await Compra.create(data);
}

export async function obtenerCompras() {
    return await Compra.findAll();
}

export async function obtenerCompraPorId(id: number) {
    const compras = await Compra.findAll({ where: { idUsuario: id } });  
    return compras.map((compra: any) => ({
        id: compra.id,
        id_usuario: compra.idUsuario,
        productos: [], 
        precioTotal: compra.total,
        estado: compra.estado,
        direccionEntrega: compra.direccion,
        nombreDestinatario: compra.nombre,
        apellidoDestinatario: compra.apellido,
        telefonoDestinatario: compra.telefono,
        dniDestinatario: compra.dni,
        email: compra.email,
        opcionEntrega: compra.envio,
        envio: compra.envio,
        fecha: compra.fecha
    }));
}