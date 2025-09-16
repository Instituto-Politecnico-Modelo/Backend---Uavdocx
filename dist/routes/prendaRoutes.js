"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prendaController_1 = require("../controllers/prendaController");
const router = (0, express_1.Router)();
const usuarios_1 = require("../middleware/usuarios");
router.post('/crearPrenda', usuarios_1.verificarToken, prendaController_1.crearPrenda);
router.get('/buscarPrendas', prendaController_1.buscarPrendasPorNombre);
router.get('/listarPrendas', prendaController_1.obtenerPrendas);
router.put('/:id', usuarios_1.verificarToken, prendaController_1.actualizarPrenda);
router.delete('/:id', usuarios_1.verificarToken, prendaController_1.eliminarPrenda);
router.get('/cargarPrendas', prendaController_1.cargarPrendas);
router.get('/:id', prendaController_1.getPrendaPorId);
router.post('/filtrar', prendaController_1.filtrarPrendas);
router.get('/productos', prendaController_1.obtenerPrendas);
exports.default = router;
//# sourceMappingURL=prendaRoutes.js.map