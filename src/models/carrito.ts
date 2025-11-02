import { DataTypes, Sequelize } from 'sequelize';

export function defineCarritoModel(sequelize: Sequelize) {
  return sequelize.define('Carrito', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precioTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, 
    },
    productos: {
      type: DataTypes.JSON, 
      allowNull: false,
      defaultValue: {}, 
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}
