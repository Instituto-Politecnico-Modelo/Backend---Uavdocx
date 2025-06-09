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
    type: DataTypes.JSON,// Para crear el hashmap seria ENUM('S', 'M', 'L', 'XL', '2XL', '3XL'), y la cantidad int
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM('JEAN', 'BUZO', 'CAMPERA', 'REMERA', 'SHORT', 'OTRO'),
    allowNull: false
<<<<<<< HEAD
=======
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: false,
>>>>>>> debugger
  }
})