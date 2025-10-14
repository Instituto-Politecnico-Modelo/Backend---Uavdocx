import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db';

export const Compra = sequelize.define('Compras', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    productos: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'pagada', 'cancelada', 'entregada'),
        allowNull: false,
        defaultValue: 'pendiente', 
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dni: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    }, 
    envio: {
        type: DataTypes.ENUM('MOTOMENSAJERIA', 'CORREOARGENTINO', 'PUDO', 'OCA', 'SUCURSAL'),
        allowNull: false,
    },
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true,
    }
});