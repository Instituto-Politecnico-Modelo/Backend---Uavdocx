"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reclamo = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
exports.Reclamo = db_1.sequelize.define('Reclamos', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    idUsuario: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    tipo: {
        type: sequelize_1.DataTypes.ENUM('PRODUCTO', 'ENVIO', 'PAGO', 'ATENCION', 'OTRO'),
        allowNull: false
    },
    descripcion: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    fecha_creacion: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    fecha_resolucion: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: null,
    },
    estado: {
        type: sequelize_1.DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE'
    }
});
//# sourceMappingURL=reclamo.js.map