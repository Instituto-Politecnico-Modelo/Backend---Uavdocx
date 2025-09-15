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
exports.eliminarReclamo = exports.modificarReclamo = exports.obtenerReclamoPorId = exports.obtenerReclamos = exports.crearReclamo = void 0;
const reclamo_1 = require("../models/reclamo");
const crearReclamo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idUsuario, tipo, descripcion } = req.body;
        const nuevoReclamo = yield reclamo_1.Reclamo.create({
            idUsuario,
            tipo,
            descripcion
        });
        res.status(201).json(nuevoReclamo);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear el reclamo', details: error.message });
    }
});
exports.crearReclamo = crearReclamo;
const obtenerReclamos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reclamos = yield reclamo_1.Reclamo.findAll();
        res.json(reclamos);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener los reclamos', details: error.message });
    }
});
exports.obtenerReclamos = obtenerReclamos;
const obtenerReclamoPorId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const reclamo = yield reclamo_1.Reclamo.findByPk(id);
        if (!reclamo) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        res.json(reclamo);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener el reclamo', details: error.message });
    }
});
exports.obtenerReclamoPorId = obtenerReclamoPorId;
const modificarReclamo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { tipo, descripcion, estado, fecha_resolucion } = req.body;
        const reclamo = yield reclamo_1.Reclamo.findByPk(id);
        if (!reclamo) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        yield reclamo.update({ tipo, descripcion, estado, fecha_resolucion });
        res.json(reclamo);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al modificar el reclamo', details: error.message });
    }
});
exports.modificarReclamo = modificarReclamo;
const eliminarReclamo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const reclamo = yield reclamo_1.Reclamo.findByPk(id);
        if (!reclamo) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        yield reclamo.destroy();
        res.json({ mensaje: 'Reclamo eliminado correctamente' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar el reclamo', details: error.message });
    }
});
exports.eliminarReclamo = eliminarReclamo;
//# sourceMappingURL=reclamoController.js.map