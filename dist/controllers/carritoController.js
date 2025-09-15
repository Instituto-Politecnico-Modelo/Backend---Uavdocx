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
Object.defineProperty(exports, "__esModule", { value: true });
exports.restarCantidadCarrito = exports.sumarCantidadCarrito = exports.eliminarProductoCarrito = exports.obtenerCarrito = exports.agregarAlCarrito = void 0;
exports.verificarPermisosAdministrador = verificarPermisosAdministrador;
exports.verificarVerificado = verificarVerificado;
const db_1 = require("../config/db");
const usuarios_1 = require("../models/usuarios");
const carrito_1 = require("../models/carrito");
const prendas_1 = require("../models/prendas");
function verificarPermisosAdministrador(usuarioId) {
    return __awaiter(this, void 0, void 0, function* () {
        const usuario = yield usuarios_1.Usuario.findByPk(usuarioId);
        if (!usuario)
            return false;
        const { verificado, admin } = usuario.get();
        return verificado === true && admin === true;
    });
}
function verificarVerificado(usuarioId) {
    return __awaiter(this, void 0, void 0, function* () {
        const usuario = yield usuarios_1.Usuario.findByPk(usuarioId);
        if (!usuario)
            return false;
        const { verificado } = usuario.get();
        return verificado === true;
    });
}
const agregarAlCarrito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarVerificado(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
        return;
    }
    const { productos } = req.body;
    const t = yield db_1.sequelize.transaction();
    try {
        let carrito = yield carrito_1.Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
        let nuevosProductos = {};
        if (carrito) {
            const actuales = carrito.get('productos') || {};
            nuevosProductos = Object.assign({}, actuales);
        }
        for (const prod of productos) {
            const prenda = yield prendas_1.Prenda.findByPk(prod.id);
            if (prenda) {
                const precio = prenda.get('precio');
                if (nuevosProductos[prod.id]) {
                    nuevosProductos[prod.id].cantidad += prod.cantidad;
                    nuevosProductos[prod.id].precio = precio;
                }
                else {
                    nuevosProductos[prod.id] = { id: prod.id, cantidad: prod.cantidad, precio };
                }
            }
        }
        let precioTotal = 0;
        for (const key in nuevosProductos) {
            const producto = nuevosProductos[key];
            precioTotal += producto.precio * producto.cantidad;
        }
        if (!carrito) {
            yield carrito_1.Carrito.create({ idUsuario: usuarioId, productos: nuevosProductos, precioTotal }, { transaction: t });
        }
        else {
            carrito.set('productos', Object.assign({}, nuevosProductos));
            carrito.set('precioTotal', precioTotal);
            carrito.changed('productos', true);
            carrito.changed('precioTotal', true);
            yield carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
        }
        yield t.commit();
        res.status(200).json({ message: 'Productos agregados al carrito' });
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al agregar productos al carrito' });
    }
});
exports.agregarAlCarrito = agregarAlCarrito;
const obtenerCarrito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarVerificado(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para obtener el carrito.' });
        return;
    }
    try {
        let carrito = yield carrito_1.Carrito.findOne({ where: { idUsuario: usuarioId } });
        if (!carrito) {
            carrito = yield carrito_1.Carrito.create({ idUsuario: usuarioId, productos: {}, precioTotal: 0 });
            res.status(201).json({ productos: [], precioTotal: 0 });
            return;
        }
        const productos = carrito.get('productos') || {};
        const productosArray = Object.values(productos);
        const precioTotal = carrito.get('precioTotal') || 0;
        res.status(200).json({ productos: productosArray, precioTotal });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});
exports.obtenerCarrito = obtenerCarrito;
const eliminarProductoCarrito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarVerificado(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
        return;
    }
    const { productoId } = req.body;
    const t = yield db_1.sequelize.transaction();
    try {
        const carrito = yield carrito_1.Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
        if (!carrito) {
            res.status(404).json({ error: 'Carrito no encontrado' });
            return;
        }
        const productos = (carrito.get('productos') || {});
        if (productos[productoId]) {
            delete productos[productoId];
            let precioTotal = 0;
            for (const key in productos) {
                const producto = productos[key];
                const prendaId = Number(key);
                const prenda = yield prendas_1.Prenda.findByPk(prendaId);
                if (prenda && producto.cantidad) {
                    const precio = prenda.get('precio');
                    precioTotal += precio * producto.cantidad;
                    producto.precio = precio;
                }
            }
            carrito.set('precioTotal', precioTotal);
            carrito.set('productos', JSON.parse(JSON.stringify(productos)));
            yield carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
            yield t.commit();
            res.status(200).json({ message: 'Producto eliminado del carrito y de la base de datos', carrito });
        }
        else {
            yield t.rollback();
            res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al eliminar el producto del carrito' });
    }
});
exports.eliminarProductoCarrito = eliminarProductoCarrito;
const sumarCantidadCarrito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarVerificado(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
        return;
    }
    const { productoId } = req.body;
    const t = yield db_1.sequelize.transaction();
    try {
        const carrito = yield carrito_1.Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
        if (!carrito) {
            res.status(404).json({ error: 'Carrito no encontrado' });
            return;
        }
        const productos = (carrito.get('productos') || {});
        if (productos[productoId]) {
            productos[productoId].cantidad += 1;
            let precioTotal = 0;
            for (const key in productos) {
                const producto = productos[key];
                precioTotal += producto.precio * producto.cantidad;
            }
            carrito.set('precioTotal', precioTotal);
            carrito.set('productos', JSON.parse(JSON.stringify(productos)));
            yield carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
            yield t.commit();
            res.status(200).json({ message: 'Cantidad sumada', carrito });
        }
        else {
            yield t.rollback();
            res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al sumar cantidad' });
    }
});
exports.sumarCantidadCarrito = sumarCantidadCarrito;
const restarCantidadCarrito = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarVerificado(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
        return;
    }
    const { productoId } = req.body;
    const t = yield db_1.sequelize.transaction();
    try {
        const carrito = yield carrito_1.Carrito.findOne({ where: { idUsuario: usuarioId }, transaction: t });
        if (!carrito) {
            res.status(404).json({ error: 'Carrito no encontrado' });
            return;
        }
        const productos = (carrito.get('productos') || {});
        if (productos[productoId]) {
            if (productos[productoId].cantidad > 1) {
                productos[productoId].cantidad -= 1;
            }
            let precioTotal = 0;
            for (const key in productos) {
                const producto = productos[key];
                precioTotal += producto.precio * producto.cantidad;
            }
            carrito.set('precioTotal', precioTotal);
            carrito.set('productos', JSON.parse(JSON.stringify(productos)));
            yield carrito.save({ transaction: t, fields: ['productos', 'precioTotal'] });
            yield t.commit();
            res.status(200).json({ message: 'Cantidad restada', carrito });
        }
        else {
            yield t.rollback();
            res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al restar cantidad' });
    }
});
exports.restarCantidadCarrito = restarCantidadCarrito;
//# sourceMappingURL=carritoController.js.map