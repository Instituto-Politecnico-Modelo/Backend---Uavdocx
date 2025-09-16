"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const carritoController_1 = require("../controllers/carritoController");
const usuarios_1 = require("../middleware/usuarios");
const router = (0, express_1.Router)();
router.post('/sumar', usuarios_1.verificarToken, carritoController_1.sumarCantidadCarrito);
router.post('/restar', usuarios_1.verificarToken, carritoController_1.restarCantidadCarrito);
router.post('/agregar', usuarios_1.verificarToken, carritoController_1.agregarAlCarrito);
router.delete('/eliminar', usuarios_1.verificarToken, carritoController_1.eliminarProductoCarrito);
router.get('', usuarios_1.verificarToken, carritoController_1.obtenerCarrito);
exports.default = router;
//# sourceMappingURL=carritoRoutes.js.map