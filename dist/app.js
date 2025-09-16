"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const db_1 = require("./config/db");
const usuariosRoutes_1 = __importDefault(require("./routes/usuariosRoutes"));
const prendaRoutes_1 = __importDefault(require("./routes/prendaRoutes"));
const carritoRoutes_1 = __importDefault(require("./routes/carritoRoutes"));
const usuarios_1 = require("./middleware/usuarios");
const reclamoRoutes_1 = __importDefault(require("./routes/reclamoRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use('/reclamos', reclamoRoutes_1.default);
app.use('/usuarios', usuariosRoutes_1.default);
app.use('/prendas', prendaRoutes_1.default);
app.use('/carrito', carritoRoutes_1.default);
app.get('/perfil', usuarios_1.verificarToken, (req, res) => {
    res.json({ message: 'Bienvenido al perfil', user: req.user });
});
db_1.sequelize.authenticate()
    .then(() => console.log('Conectado a MySQL'))
    .catch(error => console.error('Error de conexión:', error));
db_1.sequelize.sync({ alter: true })
    .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
})
    .catch(err => console.error('Error al sincronizar la base de datos:', err));
const mercadopago_1 = require("mercadopago");
const carrito_1 = require("./models/carrito");
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: 'APP_USR-1138195044991057-091411-4e237673d5c4ee8d31f435ba92fecfd8-2686828519' });
app.post('/create-preference', usuarios_1.verificarToken, (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!usuarioId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const carrito = yield carrito_1.Carrito.findOne({ where: { idUsuario: usuarioId } });
            if (!carrito) {
                res.status(404).json({ error: 'Carrito no encontrado' });
                return;
            }
            const productos = (carrito.get('productos') || {});
            const items = Object.values(productos).map((prod) => ({
                title: `Producto ${prod.id}`,
                quantity: prod.cantidad,
                unit_price: prod.precio,
                id: String(prod.id)
            }));
            if (items.length === 0) {
                res.status(400).json({ error: 'El carrito está vacío' });
                return;
            }
            const preference = new mercadopago_1.Preference(client);
            const data = yield preference.create({
                body: {
                    items
                }
            });
            res.status(200).json({
                preference_id: data.id,
                preference_url: data.init_point,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Error al crear la preferencia' });
        }
    }))();
});
//# sourceMappingURL=app.js.map