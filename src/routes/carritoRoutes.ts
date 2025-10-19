import { Router } from 'express';
import { obtenerCarrito, eliminarProductoCarrito, agregarAlCarrito, sumarCantidadCarrito, restarCantidadCarrito } from '../controllers/carritoController';
import { verificarToken } from '../middleware/usuarios';


const router = Router();






router.post('/sumar', verificarToken, async (req, res) => {
	const usuarioId = (req as any).user?.id;
	const { productoId, talle } = req.body;
	const result = await sumarCantidadCarrito(usuarioId, productoId, talle);
	if ('error' in result) {
		res.status(400).json(result);
	} else {
		res.status(200).json(result);
	}
});


router.post('/restar', verificarToken, async (req, res) => {
	const usuarioId = (req as any).user?.id;
	const { productoId, talle } = req.body;
	const result = await restarCantidadCarrito(usuarioId, productoId, talle);
	if ('error' in result) {
		res.status(400).json(result);
	} else {
		res.status(200).json(result);
	}
});


router.post('/agregar', verificarToken, async (req, res) => {
	const usuarioId = (req as any).user?.id;
	const { productos } = req.body;
	const result = await agregarAlCarrito(usuarioId, productos);
	if ('error' in result) {
		res.status(400).json(result);
	} else {
		res.status(201).json(result);
	}
});


router.delete('/eliminar', verificarToken, async (req, res) => {
	const usuarioId = (req as any).user?.id;
	const { productoId, talle } = req.body;
	const result = await eliminarProductoCarrito(usuarioId, productoId, talle);
	if ('error' in result) {
		res.status(400).json(result);
	} else {
		res.status(200).json(result);
	}
});


router.get('', verificarToken, async (req, res) => {
	const usuarioId = (req as any).user?.id;
	const result = await obtenerCarrito(usuarioId);
	if ('error' in result) {
		res.status(400).json(result);
	} else {
		res.status(200).json(result);
	}
});

export default router;
