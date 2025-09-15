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
exports.getPrendaPorId = exports.filtrarPrendas = exports.obtenerPrendas = exports.buscarPrendasPorNombre = exports.cargarPrendas = exports.eliminarPrenda = exports.actualizarPrenda = exports.crearPrenda = void 0;
exports.verificarPermisosAdministrador = verificarPermisosAdministrador;
exports.verificarVerificado = verificarVerificado;
const prendas_1 = require("../models/prendas");
const db_1 = require("../config/db");
const sequelize_1 = require("sequelize");
const usuarios_1 = require("../models/usuarios");
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
const crearPrenda = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarPermisosAdministrador(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenes los permisos para realizar esta acción.' });
        return;
    }
    const t = yield db_1.sequelize.transaction();
    try {
        const { nombre, precio, talles, categoria, imagen } = req.body;
        const nuevaPrenda = yield prendas_1.Prenda.create({ nombre, precio, talles, categoria, imagen }, { transaction: t });
        yield t.commit();
        res.status(201).json(nuevaPrenda);
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al crear la prenda' });
    }
});
exports.crearPrenda = crearPrenda;
const actualizarPrenda = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarPermisosAdministrador(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
        return;
    }
    const { id } = req.params;
    const t = yield db_1.sequelize.transaction();
    try {
        yield prendas_1.Prenda.update(req.body, { where: { id }, transaction: t });
        yield t.commit();
        res.sendStatus(204);
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al actualizar la prenda' });
    }
});
exports.actualizarPrenda = actualizarPrenda;
const eliminarPrenda = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const usuarioId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const autorizado = yield verificarPermisosAdministrador(usuarioId);
    if (!autorizado) {
        res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
        return;
    }
    const { id } = req.params;
    const t = yield db_1.sequelize.transaction();
    try {
        yield prendas_1.Prenda.destroy({ where: { id }, transaction: t });
        yield t.commit();
        res.sendStatus(204);
    }
    catch (error) {
        yield t.rollback();
        res.status(500).json({ error: 'Error al eliminar la prenda' });
    }
});
exports.eliminarPrenda = eliminarPrenda;
const cargarPrendas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prendas = yield prendas_1.Prenda.findAll();
        res.status(200).json(prendas);
    }
    catch (error) {
        console.error("Error al listar prendas:", error);
        res.status(500).json({ error: 'Error al obtener las prendas' });
    }
});
exports.cargarPrendas = cargarPrendas;
const buscarPrendasPorNombre = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre } = req.query;
    try {
        const prendas = yield prendas_1.Prenda.findAll({
            where: nombre
                ? { nombre: { [sequelize_1.Op.like]: `%${nombre}%` } }
                : {}
        });
        res.json(prendas);
    }
    catch (error) {
        console.error('Error en buscarPrendasPorNombre:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.buscarPrendasPorNombre = buscarPrendasPorNombre;
const obtenerPrendas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('obtenerPrendas: inicio');
    try {
        console.log('obtenerPrendas: req.query', req.query);
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        console.log('obtenerPrendas: page', page, 'limit', limit);
        const offset = (page - 1) * limit;
        console.log('obtenerPrendas: offset', offset);
        const { rows: prendas, count: total } = yield prendas_1.Prenda.findAndCountAll({
            limit,
            offset
        });
        console.log('obtenerPrendas: prendas encontradas', prendas);
        console.log('obtenerPrendas: total', total);
        res.status(200).json({
            total,
            page,
            limit,
            data: prendas
        });
        console.log('obtenerPrendas: respuesta enviada');
    }
    catch (error) {
        console.error('obtenerPrendas: error', error);
        res.status(500).json({ error: 'Error al obtener las prendas' });
    }
});
exports.obtenerPrendas = obtenerPrendas;
const filtrarPrendas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { minimo, maximo, categoria, talles } = req.body;
        const whereClause = {};
        if (minimo !== undefined && maximo !== undefined) {
            whereClause.precio = { [sequelize_1.Op.between]: [minimo, maximo] };
        }
        else if (minimo !== undefined) {
            whereClause.precio = { [sequelize_1.Op.gte]: minimo };
        }
        else if (maximo !== undefined) {
            whereClause.precio = { [sequelize_1.Op.lte]: maximo };
        }
        if (categoria) {
            whereClause.categoria = categoria;
        }
        const tallesConditions = [];
        if (talles && typeof talles === 'object') {
            for (const [talle, cantidad] of Object.entries(talles)) {
                tallesConditions.push((0, sequelize_1.literal)(`("talles"->>'${talle}')::int >= ${cantidad}`));
            }
        }
        const prendas = yield prendas_1.Prenda.findAll({
            where: Object.assign(Object.assign({}, whereClause), (tallesConditions.length > 0 ? { [sequelize_1.Op.and]: tallesConditions } : {}))
        });
        res.status(200).json(prendas);
    }
    catch (error) {
        console.error('Error en filtrarPrendas:', error);
        res.status(500).json({ error: 'Error al filtrar las prendas' });
    }
});
exports.filtrarPrendas = filtrarPrendas;
const getPrendaPorId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const prenda = yield prendas_1.Prenda.findByPk(id);
        if (!prenda) {
            res.status(404).json({ error: 'Prenda no encontrada' });
            return;
        }
        res.status(200).json(prenda);
        return;
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener la prenda' });
        return;
    }
});
exports.getPrendaPorId = getPrendaPorId;
//# sourceMappingURL=prendaController.js.map