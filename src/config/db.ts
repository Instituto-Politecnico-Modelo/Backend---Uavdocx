import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';


import dotenv from 'dotenv';
dotenv.config();




const DB_NAME = process.env.DB_NAME || '';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

async function ensureDatabaseExists() {
  try {
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mysql',
      logging: false,
    });
    await sequelize.authenticate();
    return sequelize;
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'original' in err &&
      typeof (err as any).original === 'object' &&
      (err as any).original !== null &&
      'code' in (err as any).original &&
      (err as any).original.code === 'ER_BAD_DB_ERROR'
    ) {
      const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
      });
      
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
      await connection.end();
      const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: false,
      });
      await sequelize.authenticate();
      return sequelize;
    } else {
      throw err;
    }
  }
}

export const sequelizePromise = ensureDatabaseExists();
export let sequelize: Sequelize;

sequelizePromise.then((s) => {
  sequelize = s;
});
