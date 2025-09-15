"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
exports.Usuario = db_1.sequelize.define('Usuarios', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    usuario: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    contrasenia: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    verificado: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    },
    admin: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    timestamps: true,
});
//# sourceMappingURL=usuarios.js.map