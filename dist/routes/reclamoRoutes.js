"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reclamoController_1 = require("../controllers/reclamoController");
const router = express_1.default.Router();
router.post('/', reclamoController_1.crearReclamo);
router.get('/', reclamoController_1.obtenerReclamos);
router.get('/:id', reclamoController_1.obtenerReclamoPorId);
router.put('/:id', reclamoController_1.modificarReclamo);
router.delete('/:id', reclamoController_1.eliminarReclamo);
exports.default = router;
//# sourceMappingURL=reclamoRoutes.js.map