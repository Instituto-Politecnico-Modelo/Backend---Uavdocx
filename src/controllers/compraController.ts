import { Compra } from '../models/compra';
import { Prenda } from '../models/prendas';


export async function crearCompra(data: any) {
    if (!Array.isArray(data.productos) || data.productos.length === 0) {
        throw new Error('La compra debe incluir al menos un producto.');
    }
    const productosConNombre = await Promise.all(
        data.productos.map(async (prod: any) => {
            const prenda = await Prenda.findByPk(prod.idPrenda);
            return {
                idPrenda: prod.idPrenda,
                nombre: prenda ? prenda.get('nombre') : null,
                talle: prod.talle,
                cantidad: prod.cantidad
            };
        })
    );
    const compraData = { ...data, productos: productosConNombre };
    return await Compra.create(compraData);
}

export async function obtenerCompras() {
    return await Compra.findAll();
}

export async function obtenerCompraPorId(id: number) {
    const compras = await Compra.findAll({ where: { idUsuario: id } });  
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