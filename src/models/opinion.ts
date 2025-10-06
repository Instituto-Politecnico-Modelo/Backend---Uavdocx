import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db';
import { Compra } from './compra';
import { Usuario } from './usuarios';

export const Opinion = sequelize.define('Opiniones', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    usuario:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'id',
        },
    },
    idCompra: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Compra,
            key: 'id',
        },
    },
    calificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    foto: {
        type: DataTypes.STRING,
        allowNull: true,
    }
});
    