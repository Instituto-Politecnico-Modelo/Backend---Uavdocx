import { DataTypes, Sequelize } from 'sequelize';

export function defineOpinionModel(sequelize: Sequelize) {
    return sequelize.define('Opiniones', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        idUsuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // references: { model: Usuario, key: 'id' }, // Asociaciones se definen después
        },
        idCompra: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // references: { model: Compra, key: 'id' },
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
}
    