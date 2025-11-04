import { DataTypes, Sequelize } from 'sequelize';

export function defineUsuarioModel(sequelize: Sequelize) {
  return sequelize.define('Usuarios', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    contrasenia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verificado:{
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    admin:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    timestamps: true, 
  });
}