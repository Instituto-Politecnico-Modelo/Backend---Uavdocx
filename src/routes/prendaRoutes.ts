import { Router } from 'express';
import {
  filtrarPrendas, crearPrenda, obtenerPrendas, actualizarPrenda, eliminarPrenda, cargarPrendas,
  buscarPrendasPorNombre, getPrendaPorId, talleDisponiblePorPrenda, restarStockPrenda
} from '../controllers/prendaController';
import { verificarToken, soloAdmin } from '../middleware/usuarios';

const router = Router();

router.post('/crearPrenda', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias } = req.body;
  try {
    const prenda = await crearPrenda(nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias);
    res.status(201).json(prenda);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al crear la prenda' });
  }
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  const { nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias } = req.body;
  try {
    await actualizarPrenda(id, nombre, precio, talles, categoria, imagenPrincipal, imagenesSecundarias);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar la prenda' });
  }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    await eliminarPrenda(id);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar la prenda' });
  }
});

router.get('/cargarPrendas', async (req, res) => {
  try {
    const prendas = await cargarPrendas();
    res.status(200).json(prendas);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener las prendas' });
  }
});

router.get('/buscarPrendas', async (req, res) => {
  const { nombre } = req.query;
  try {
    const prendas = await buscarPrendasPorNombre(typeof nombre === 'string' ? nombre : undefined);
    res.json(prendas);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al buscar prendas' });
  }
});

router.get('/listarPrendas', async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  try {
    const result = await obtenerPrendas(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener las prendas' });
  }
});

router.post('/filtrar', async (req, res) => {
  const { minimo, maximo, categoria, talles } = req.body;
  try {
    const prendas = await filtrarPrendas(minimo, maximo, categoria, talles);
    res.status(200).json(prendas);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al filtrar las prendas' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log('[GET /prendas/:id] Recibido id:', id);
  if (isNaN(id)) {
    console.log('[GET /prendas/:id] ID inválido:', req.params.id);
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const prenda = await getPrendaPorId(id);
    console.log('[GET /prendas/:id] Resultado:', prenda);
    if (!prenda) {
      console.log('[GET /prendas/:id] Prenda no encontrada para id:', id);
      return res.status(404).json({ error: 'Prenda no encontrada' });
    }
    res.status(200).json(prenda);
  } catch (error: any) {
    console.log('[GET /prendas/:id] Error:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la prenda' });
  }
});

router.get('/talleDisponible/:id/:talle/:cantidad', async (req, res) => {
  const { id, talle, cantidad } = req.params;
  try {
    const result = await talleDisponiblePorPrenda(Number(id), talle, Number(cantidad));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar disponibilidad de talle' });
  }
});

router.post('/restarStock', async (req, res) => {
  const { id, talle, cantidad } = req.body;
  try {
    const exito = await restarStockPrenda(id, talle, cantidad);
    if (exito) {
      res.status(200).json({ message: 'Stock actualizado correctamente' });
    } else {
      res.status(400).json({ error: 'No se pudo actualizar el stock. Verifique los datos.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el stock' });
  }
});

export default router;