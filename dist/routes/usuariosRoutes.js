"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usuarioController_1 = require("../controllers/usuarioController");
const router = express_1.default.Router();
router.post('/registro', usuarioController_1.registrarUsuario);
router.post('/ingresar', usuarioController_1.comprobarUsuario);
router.get('/verificar/:token', usuarioController_1.verificarUsuario);
router.post('/olvide-contrasenia', usuarioController_1.solicitarResetContrasenia);
router.post('/resetear-contrasenia/:token', usuarioController_1.resetearContrasenia);
router.get('/admin/:id', usuarioController_1.verificarPermisosAdministrador);
exports.default = router;
//# sourceMappingURL=usuariosRoutes.js.map