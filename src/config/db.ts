
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

import dotenv from 'dotenv';
dotenv.config();

console.log('[ENV] Variables de entorno:', {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT
});

const DB_NAME = process.env.DB_NAME || '';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

async function ensureDatabaseExists() {
  try {
    console.log('[DB] Intentando conectar a MySQL...');
    console.log(`[DB] Host: ${DB_HOST}, Puerto: ${DB_PORT}, Usuario: ${DB_USER}, Base: ${DB_NAME}`);
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mysql',
      logging: console.log,
    });
    await sequelize.authenticate();
    console.log('[DB] Conexión exitosa a MySQL');
    return sequelize;
  } catch (err) {
    console.error('[DB] Error al conectar:', err);
    if (
      typeof err === 'object' &&
      err !== null &&
      'original' in err &&
      typeof (err as any).original === 'object' &&
      (err as any).original !== null &&
      'code' in (err as any).original &&
      (err as any).original.code === 'ER_BAD_DB_ERROR'
    ) {
      console.log('[DB] Base de datos no existe, intentando crearla...');
      const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
      await connection.end();
      console.log('[DB] Base de datos creada o ya existente. Intentando conectar de nuevo...');
      const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: console.log,
      });
      await sequelize.authenticate();
      console.log('[DB] Conexión exitosa a MySQL tras crear la base.');
      return sequelize;
    } else {
  console.error('[DB] Error inesperado al conectar:', err);
  throw err;
    }
  }
}

export const sequelizePromise = ensureDatabaseExists();
export let sequelize: Sequelize;

sequelizePromise.then((s) => {
  sequelize = s;
});
