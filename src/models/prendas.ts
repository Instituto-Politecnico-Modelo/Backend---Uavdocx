import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db';

export const Prenda = sequelize.define('Prendas',{
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  precio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  talles: {
    type: DataTypes.JSON,
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM('JEAN', 'BUZO', 'CAMPERA', 'REMERA', 'SHORT', 'OTRO'),
    allowNull: false


  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: false,

  }
})