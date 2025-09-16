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
exports.enviarCorreoReset = exports.enviarCorreoVerificacion = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const enviarCorreoVerificacion = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL,
            pass: process.env.PASS,
        },
    });
    const enlace = `http://localhost:3000/usuarios/verificar/${token}`;
    const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: 'Confirma tu cuenta',
        html: `<h2>Verifica tu cuenta</h2>
           <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
           <a href="${enlace}">Confirmar Cuenta</a>`,
    };
    try {
        yield transporter.sendMail(mailOptions);
        console.log('Correo enviado');
    }
    catch (error) {
        console.error('Error al enviar el correo:', error);
    }
});
exports.enviarCorreoVerificacion = enviarCorreoVerificacion;
const enviarCorreoReset = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL,
            pass: process.env.PASS,
        },
    });
    const url = `http://localhost:4200/usuarios/resetear-contrasenia/${token}`;
    const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: 'Restablece tu contraseña',
        html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${url}">${url}</a>`,
    };
    try {
        yield transporter.sendMail(mailOptions);
        console.log('Correo de restablecimiento enviado');
    }
    catch (error) {
        console.error('Error al enviar el correo de restablecimiento:', error);
    }
});
exports.enviarCorreoReset = enviarCorreoReset;
//# sourceMappingURL=email.js.map