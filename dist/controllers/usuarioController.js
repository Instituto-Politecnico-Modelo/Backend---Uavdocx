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
exports.resetearContrasenia = exports.solicitarResetContrasenia = exports.verificarPermisosAdministrador = exports.verificarUsuario = exports.comprobarUsuario = exports.registrarUsuario = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const usuarios_1 = require("../models/usuarios");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = __importDefault(require("validator"));
const email_1 = require("../utils/email");
const db_1 = require("../config/db");
const SECRET_KEY = process.env.CLAVE || '';
const registrarUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { usuario, email, contrasenia } = req.body;
    if (!usuario || !email || !contrasenia) {
        res.status(400).json({ mensaje: 'Faltan datos back' });
        return;
    }
    if (!validator_1.default.isEmail(email)) {
        res.status(400).json({ mensaje: 'Email inválido' });
        return;
    }
    const t = yield db_1.sequelize.transaction();
    try {
        const usuarioExistente = yield usuarios_1.Usuario.findOne({ where: { usuario }, transaction: t, lock: t.LOCK.UPDATE });
        if (usuarioExistente) {
            yield t.rollback();
            res.status(409).json({ mensaje: 'El usuario ya existe' });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = yield bcrypt_1.default.hash(contrasenia, saltRounds);
        const nuevoUsuario = yield usuarios_1.Usuario.create({
            usuario,
            email,
            contrasenia: hashedPassword,
            verificado: false,
        }, { transaction: t });
        const tokenVerificacion = jsonwebtoken_1.default.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
        yield (0, email_1.enviarCorreoVerificacion)(email, tokenVerificacion);
        yield t.commit();
        res.status(201).json({ mensaje: 'Usuario registrado. Revisa tu correo para confirmar tu cuenta.' });
    }
    catch (error) {
        yield t.rollback();
        console.error('Error en registrarUsuario:', error);
        res.status(500).json({
            mensaje: 'Error al registrar usuario',
            error: ((_b = (_a = error.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) || error.message || error
        });
    }
});
exports.registrarUsuario = registrarUsuario;
const comprobarUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { usuario_ingreso, pass_ingreso } = req.body;
    if (!usuario_ingreso || !pass_ingreso) {
        res.status(400).json({ mensaje: 'Faltan ingresar datos' });
        return;
    }
    try {
        const usuario = yield usuarios_1.Usuario.findOne({ where: { usuario: usuario_ingreso } });
        if (!usuario) {
            res.status(404).json({ mensaje: 'El usuario no fue encontrado' });
            return;
        }
        const hashBD = usuario.get('contrasenia');
        const passBien = yield bcrypt_1.default.compare(pass_ingreso, hashBD);
        if (passBien) {
            const id = usuario.getDataValue('id');
            const token = jsonwebtoken_1.default.sign({ id, usuario: usuario_ingreso }, SECRET_KEY, { expiresIn: '1h' });
            res.status(200).json({ mensaje: 'Login correcto', token, id });
        }
        else {
            res.status(401).json({ mensaje: 'La contraseña es incorrecta' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al ingresar al usuario' });
    }
});
exports.comprobarUsuario = comprobarUsuario;
const verificarUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    const t = yield db_1.sequelize.transaction();
    try {
        const payload = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const usuario = yield usuarios_1.Usuario.findOne({ where: { email: payload.email }, transaction: t, lock: t.LOCK.UPDATE });
        if (!usuario) {
            yield t.rollback();
            res.status(404).json({ mensaje: 'Usuario no encontrado' });
            return;
        }
        yield usuario.update({ verificado: true }, { transaction: t });
        yield t.commit();
        res.status(200).json({ mensaje: 'Cuenta verificada con éxito, puede volver a la pagina' });
    }
    catch (error) {
        yield t.rollback();
        console.error('Error para verificar usuario:', error);
        res.status(400).json({ mensaje: 'Token inválido o expirado', error: error.message || error });
    }
});
exports.verificarUsuario = verificarUsuario;
const verificarPermisosAdministrador = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const usuario = yield usuarios_1.Usuario.findByPk(id);
        if (!usuario) {
            res.status(404).json({ mensaje: 'Usuario no encontrado' });
            return;
        }
        const { admin } = usuario.get();
        if (admin === true) {
            res.status(200).json({ esAdmin: true });
        }
        else {
            res.status(403).json({ esAdmin: false, mensaje: 'No tiene permisos de administrador' });
        }
    }
    catch (error) {
        console.error('Error al verificar permisos de administrador:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});
exports.verificarPermisosAdministrador = verificarPermisosAdministrador;
const solicitarResetContrasenia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email || !validator_1.default.isEmail(email)) {
        res.status(400).json({ mensaje: 'Email inválido' });
        return;
    }
    try {
        const usuario = yield usuarios_1.Usuario.findOne({ where: { email } });
        if (!usuario) {
            res.status(404).json({ mensaje: 'No existe un usuario con ese email' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ email }, SECRET_KEY, { expiresIn: '15m' });
        yield (0, email_1.enviarCorreoReset)(email, token);
        res.status(200).json({ mensaje: 'Correo enviado para restablecer contraseña' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al solicitar restablecimiento' });
    }
});
exports.solicitarResetContrasenia = solicitarResetContrasenia;
const resetearContrasenia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.params.token || req.body.token;
    const { nuevaContrasenia } = req.body;
    console.log('Token recibido:', token);
    if (!nuevaContrasenia) {
        res.status(400).json({ mensaje: 'Falta la nueva contraseña' });
        return;
    }
    const t = yield db_1.sequelize.transaction();
    try {
        const { email } = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const usuario = yield usuarios_1.Usuario.findOne({ where: { email }, transaction: t, lock: t.LOCK.UPDATE });
        if (!usuario) {
            yield t.rollback();
            res.status(404).json({ mensaje: 'Usuario no encontrado' });
            return;
        }
        const hashed = yield bcrypt_1.default.hash(nuevaContrasenia, 10);
        yield usuario.update({ contrasenia: hashed }, { transaction: t });
        yield t.commit();
        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
    }
    catch (error) {
        yield t.rollback();
        console.error('Error en resetearContrasenia:', error);
        res.status(400).json({ mensaje: 'Token inválido o expirado', error: error.message });
    }
});
exports.resetearContrasenia = resetearContrasenia;
//# sourceMappingURL=usuarioController.js.map