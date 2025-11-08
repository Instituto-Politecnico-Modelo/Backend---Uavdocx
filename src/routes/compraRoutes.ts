import { Router, Request, Response } from 'express';
import * as compraController from '../controllers/compraController';
import { verificarToken, soloAdmin } from '../middleware/usuarios';
import axios from 'axios';

const router = Router();


router.post('/', async (req, res) => {
	const {
		productos,
		idUsuario,
		total,
		nombre,
		apellido,
		direccion,
		dni,
		telefono,
		email,
		envio,
		preference_id,
		fechaEntrega
	} = req.body;
	try {
		const compra = await compraController.crearCompra(
			productos,
			idUsuario,
			total,
			nombre,
			apellido,
			direccion,
			dni,
			telefono,
			email,
			envio,
			preference_id,
			fechaEntrega
		);
		if (compra && typeof compra.get === 'function' && compra.get('id')) {
			res.status(201).json(compra);
		} else {
			res.status(400).json({ error: 'Error al crear la compra' });
		}
	} catch (error: any) {
		res.status(400).json({ error: error.message || 'Error al crear la compra' });
	}
});

router.get('/preference/:id', async (req, res) => {
    const preferenceId = req.params.id;
 
    try {
        const response = await axios.get(
            `https://api.mercadopago.com/v1/payments/search?preference_id=${preferenceId}`,
            {
                headers: {
                    Authorization: `APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519` 
                }
            }
        );
        console.log('Datos recibidos de MercadoPago:', response.data); 
		res.json(response.data);
    } catch (error) {
        console.error('Error al obtener los detalles de la preferencia:', error);
        res.status(500).json({ message: 'Error al obtener los detalles de la preferencia' });
    }
});




router.get('/', verificarToken, soloAdmin, async (req, res) => {
	const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
	const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
	try {
		const compras = await compraController.obtenerComprasPaginadas(page, limit);
		res.status(200).json(compras);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al obtener las compras' });
	}
});

router.get('/:id', async (req, res) => {
	const id = parseInt(req.params.id, 10);
	if (isNaN(id)) {
		return res.status(400).json({ error: 'ID inválido' });
	}
	try {
		const compra = await compraController.obtenerCompraPorId(id);
		if (compra && compra.length > 0) {
			res.status(200).json(compra);
		} else {
			res.status(404).json({ error: 'Compra no encontrada' });
		}
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al obtener la compra' });
	}
});

router.put('/modificar/:id/', verificarToken, soloAdmin, async (req, res) => {
	const id = parseInt(req.params.id, 10);
	if (isNaN(id)) {
		return res.status(400).json({ error: 'ID inválido' });
	}
	const { estadoNuevo } = req.body;
	try {
		const result = await compraController.modificarCompra(id, estadoNuevo);
		if (result) {
			res.status(200).json({ message: 'Compra modificada correctamente' });
		} else {
			res.status(400).json({ error: 'No se pudo modificar la compra' });
		}
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al modificar la compra' });
	}
});
/*
router.post('/cancelar-pendientes-antiguas', verificarToken, soloAdmin, async (req, res) => {
	try {
		await compraController.cancelarComprasPendientesAntiguas();
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al cancelar compras pendientes antiguas.' });
	}
});
*/

export default router;
