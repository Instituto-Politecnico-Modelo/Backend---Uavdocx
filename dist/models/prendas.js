"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prenda = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
exports.Prenda = db_1.sequelize.define('Prendas', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    precio: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    talles: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false
    },
    categoria: {
        type: sequelize_1.DataTypes.ENUM('JEAN', 'BUZO', 'CAMPERA', 'REMERA', 'SHORT', 'OTRO'),
        allowNull: false
    },
    imagen: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    }
});
//# sourceMappingURL=prendas.js.map