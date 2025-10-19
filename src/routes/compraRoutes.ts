import { Router, Request, Response } from 'express';
import * as compraController from '../controllers/compraController';
import { verificarToken, soloAdmin } from '../middleware/usuarios';

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




router.get('/', verificarToken, soloAdmin, async (req, res) => {
	try {
		const compras = await compraController.obtenerCompras();
		if (Array.isArray(compras)) {
			res.status(200).json(compras);
		} else {
			res.status(500).json({ error: 'Error al obtener las compras' });
		}
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
	const { estado, fechaEntrega } = req.body;
	try {
		const result = await compraController.modificarCompra(id, estado, fechaEntrega);
		if (result) {
			res.status(200).json({ message: 'Compra modificada correctamente' });
		} else {
			res.status(400).json({ error: 'No se pudo modificar la compra' });
		}
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al modificar la compra' });
	}
});

export default router;
