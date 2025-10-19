import { Compra } from '../models/compra';
import { Prenda } from '../models/prendas';
import { restarStockPrenda } from './prendaController';



export async function crearCompra(productos: any[], idUsuario: number, total: number, nombre: string, apellido: string, direccion: string, dni: number, telefono: string, email: string, envio: string, fechaEntrega?: Date) {
    if (!Array.isArray(productos) || productos.length === 0) {
        throw new Error('La compra debe incluir al menos un producto.');
    }
    const productosConNombre = await Promise.all(
        productos.map(async (prod: any) => {
            const prenda = await Prenda.findByPk(prod.idPrenda);
            return {
                idPrenda: prod.idPrenda,
                nombre: prenda ? prenda.get('nombre') : null,
                talle: prod.talle,
                cantidad: prod.cantidad
            };
        })
    );
    const compraData = {
        productos: productosConNombre,
        idUsuario,
        total,
        nombre,
        apellido,
        direccion,
        dni,
        telefono,
        email,
        envio,
        fechaEntrega
    };
    return await Compra.create(compraData);
}

export async function obtenerCompras() {
    return await Compra.findAll();
}

export async function obtenerCompraPorId(idUsuario: number) {
    const compras = await Compra.findAll({ where: { idUsuario } });
    return compras.map((compra: any) => ({
        id: compra.id,
        id_usuario: compra.idUsuario,
        productos: compra.productos,
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

export async function modificarCompra(id: number, estado?: string, fechaEntrega?: Date) {
    const compra = await Compra.findByPk(id);
    if (!compra) throw new Error('Compra no encontrada');

    if (estado === 'pagada' && compra.get('estado') !== 'pagada') {
        let productos = compra.get('productos');
        let productosArray: any[] = [];
        if (Array.isArray(productos)) {
            productosArray = productos;
        } else if (productos && typeof productos === 'object') {
            productosArray = Object.values(productos);
        }
        for (const prod of productosArray) {
            const exito = await restarStockPrenda(prod.idPrenda, prod.talle, prod.cantidad);
            if (!exito) {
                throw new Error(`No hay suficiente stock para la prenda con id ${prod.idPrenda}, talle ${prod.talle}`);
            }
        }
    }
    const updateData: any = {};
    if (estado) updateData.estado = estado;
    if (fechaEntrega) updateData.fechaEntrega = fechaEntrega;
    return await Compra.update(updateData, { where: { id } });
}


