import { Router } from 'express';
import * as compraController from '../controllers/compraController';
import { Compra } from '../models/compra';

const router = Router();

router.post('/', async (req, res) => {
	try {
		const compra = await compraController.crearCompra(req.body);
		res.status(201).json(compra);
	} catch (error: any) {
		res.status(400).json({ error: error.message || 'Error al crear la compra' });
	}
});




router.get('/', async (req, res) => {
	try {
		const compras = await compraController.obtenerCompras();
		res.status(200).json(compras);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al obtener las compras' });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			return res.status(400).json({ error: 'ID inválido' });
		}
		const compra = await compraController.obtenerCompraPorId(id);
		if (!compra) {
			return res.status(404).json({ error: 'Compra no encontrada' });
		}
		res.status(200).json(compra);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Error al obtener la compra' });
	}
});


export default router;
