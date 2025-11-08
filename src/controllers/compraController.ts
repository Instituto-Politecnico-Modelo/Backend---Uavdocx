export async function asociarPaymentId(preference_id: string, payment_id: string) {
    const compra = await Compra.findOne({ where: { preference_id } });
    if (!compra) throw new Error('Compra no encontrada para ese preference_id');
    await compra.update({ payment_id });
    return compra;
}

import { restarStockPrenda, sumarStockPrenda } from './prendaController';
import { mailCompraHecha, mailCompraConfirmada } from './usuarioController';
import { sequelize } from '../config/db';
import { Compra, Prenda, Usuario } from '../app';



export async function crearCompra(productos: any[], idUsuario: number, total: number, nombre: string, apellido: string, direccion: string, dni: number, telefono: string, email: string, envio: string, preference_id: string, fechaEntrega?: Date) {
    if (!Array.isArray(productos) || productos.length === 0) {
        throw new Error('La compra debe incluir al menos un producto.');
    }
    const t = await sequelize.transaction();
    try {
        const productosConNombre = await Promise.all(
            productos.map(async (prod: any) => {
                const prenda = await Prenda.findByPk(prod.idPrenda, { transaction: t });
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
            fechaEntrega,
            estado: 'pendiente',
            preference_id
        };
        console.log('[crearCompra] Creando compra en estado pendiente, sin descontar stock:', compraData);
        await mailCompraHecha(idUsuario);

        const compraCreada = await Compra.create(compraData, { transaction: t });
        await t.commit();
        return compraCreada;
    } catch (error) {
        await t.rollback();
        throw error;
    }
}


export async function confirmarCompra(idCompra: number) {
    const t = await sequelize.transaction();
    try {
        const compra = await Compra.findByPk(idCompra, { transaction: t });
        if (!compra) {
            console.error('[confirmarCompra] Compra no encontrada:', idCompra);
            throw new Error('Compra no encontrada');
        }
        if (compra.get('estado') === 'pagada') {
            console.warn('[confirmarCompra] La compra ya está confirmada:', idCompra);
            throw new Error('La compra ya está confirmada');
        }
        const productos = compra.get('productos') as any[];
        console.log('[confirmarCompra] Confirmando compra y descontando stock:', compra.id, productos);
        for (const prod of productos) {
            console.log(`[confirmarCompra] Restando stock: prenda ${prod.idPrenda}, talle ${prod.talle}, cantidad ${prod.cantidad}`);
            await restarStockPrenda(prod.idPrenda, prod.talle, prod.cantidad);
        }
    await compra.update({ estado: 'pagada' }, { transaction: t });
    const compraActualizada = await Compra.findByPk(idCompra, { transaction: t });
    console.log('[confirmarCompra] Estado actualizado a pagada:', compraActualizada?.estado, compraActualizada?.toJSON());
        await mailCompraConfirmada(compra.get('idUsuario'));
        await t.commit();
        console.log('[confirmarCompra] Compra confirmada y commit realizado:', compra.id);
        return compra;
    } catch (error) {
        await t.rollback();
        console.error('[confirmarCompra] Error:', error);
        throw error;
    }
}



export async function obtenerCompras() {
    return await Compra.findAll();
}

export async function obtenerComprasPaginadas(page?: number, limit?: number) {
    try {
        if (page && limit) {
            const offset = (page - 1) * limit;
            const { rows: compras, count: total } = await Compra.findAndCountAll({
                limit,
                offset
            });
            return {
                total,
                page,
                limit,
                data: compras
            };
        } else {
            const compras = await Compra.findAll();
            return compras;
        }
    } catch (error) {
        throw new Error('Error al obtener las compras');
    }
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
    try {
        const compra = await Compra.findByPk(id);
        if (!compra) {
            throw new Error('Compra no encontrada');
        }
        const estadoActual = compra.get('estado');
        if (estadoActual !== 'cancelada' && estado === 'cancelada') {
            await Compra.update({ estado, fechaEntrega }, { where: { id } });
            const productos = compra.get('productos') as any[];
            await sumarStock(productos);
        } else {
            await Compra.update({ estado, fechaEntrega }, { where: { id } });
        }
        const compraActualizada = await Compra.findByPk(id);
        return compraActualizada;
    } catch (error: any) {
        throw new Error(error.message || 'Error al modificar la compra');
    }
}


export async function restarStock(productos: any[]) {
    for (const prod of productos) {
        console.log(`[restarStock] Restando stock: prenda ${prod.idPrenda}, talle ${prod.talle}, cantidad ${prod.cantidad}`);
        await restarStockPrenda(prod.idPrenda, prod.talle, prod.cantidad);
    }
}  

export async function sumarStock(productos: any[]) {
    for (const prod of productos) {
        await sumarStockPrenda(prod.idPrenda, prod.talle, prod.cantidad);
    }
}
/*
export async function cancelarComprasPendientesAntiguas() {
    const ahora = new Date();
    const compras = await Compra.findAll({
        where: {
            estado: 'pendiente',
            createdAt: {
                [require('sequelize').Op.lt]: new Date(ahora.getTime() - 60 * 60 * 1000)
            }
        }
    });
    for (const compra of compras) {
        const id = compra.get('id') as number;
        await modificarCompra(id, 'cancelada');
    }
    return compras.length;
}
*/