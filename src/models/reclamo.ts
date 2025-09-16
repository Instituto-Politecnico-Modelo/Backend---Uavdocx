import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db';

export const Reclamo = sequelize.define('Reclamos',{
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  tipo: {
    type: DataTypes.ENUM('PRODUCTO', 'ENVIO', 'PAGO', 'ATENCION', 'OTRO'),
    allowNull: false
  },
  descripcion:{
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_resolucion: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'),
    allowNull: false,
    defaultValue: 'PENDIENTE'
  }
})