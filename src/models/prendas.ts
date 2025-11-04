import { DataTypes, Sequelize } from 'sequelize';

export function definePrendaModel(sequelize: Sequelize) {
  return sequelize.define('Prendas',{
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
    imagenPrincipal: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    imagenesSecundarias: {
      type: DataTypes.JSON,
      allowNull: true, 
    }
  });
}