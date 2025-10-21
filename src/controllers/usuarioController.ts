import dotenv from 'dotenv';
dotenv.config();

import { Usuario } from '../models/usuarios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { enviarCorreoVerificacion, enviarCorreoReset, enviarCorreoCompraRealizada, enviarCorreoCompraConfirmada } from '../utils/email'; 
import { sequelize } from '../config/db'; 

const SECRET_KEY: string = process.env.CLAVE || '';

export async function obtenerTodosUsuarios() {
  try {
    const usuarios = await Usuario.findAll();
    return usuarios;
  } catch (error) {
    throw new Error('Error al obtener usuarios');
  }
}

export async function obtenerUsuarios(page?: number, limit?: number) {
  try{
    if (page && limit) {
          const offset = (page - 1) * limit;
          const { rows: prendas, count: total } = await Usuario.findAndCountAll({
            limit,
            offset
          });
          return {
          total,
            page,
            limit,
            data: prendas
          };
    } else {
          const prendas = await Usuario.findAll();
          return prendas;
        }
  } catch (error) {
      throw new Error('Error al obtener las prendas');
    }
}


export async function emailDeUsuario(id: number) {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    const email = usuario.getDataValue('email');
    return { email };
  } catch (error) {
    throw new Error('Error al obtener el email del usuario');
  }
}

export async function mailCompraHecha(id: number) {
  try{
    const { email } = await emailDeUsuario(id);
    if(email){
      await enviarCorreoCompraRealizada(email, 'Detalles de la compra...');
      return { mensaje: 'Correo de compra enviada correctamente' };
    } else {
      throw new Error('El usuario no tiene un email asociado');
    }
  } catch (error) {
    throw new Error('Error al enviar el correo de compra');
  }
}

export async function mailCompraConfirmada(id: number) {
  try{
    const { email } = await emailDeUsuario(id);
    if(email){
      await enviarCorreoCompraConfirmada(email, 'Detalles de la compra confirmada...');
      return { mensaje: 'Correo de compra confirmada enviado correctamente' };
    } else {
      throw new Error('El usuario no tiene un email asociado');
    }
  } catch (error) {
    throw new Error('Error al enviar el correo de compra confirmada');
  }
}

export async function registrarUsuario(usuario: string, email: string, contrasenia: string) {
  if (!usuario || !email || !contrasenia) throw new Error('Faltan datos back');
  if (!validator.isEmail(email)) throw new Error('Email inválido');
  const t = await sequelize.transaction();
  try {
    const usuarioExistente = await Usuario.findOne({ where: { usuario }, transaction: t, lock: t.LOCK.UPDATE });
    if (usuarioExistente) {
      await t.rollback();
      throw new Error('El usuario ya existe');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);
    await Usuario.create({ usuario, email, contrasenia: hashedPassword, verificado: false }, { transaction: t });
    const tokenVerificacion = jwt.sign({ email }, SECRET_KEY, { expiresIn: '8h' });
    await enviarCorreoVerificacion(email, tokenVerificacion);
    await t.commit();
    return { mensaje: 'Usuario registrado. Revisa tu correo para confirmar tu cuenta.' };
  } catch (error: any) {
    await t.rollback();
    throw new Error(error.errors?.[0]?.message || error.message || 'Error al registrar usuario');
  }
}

export async function comprobarUsuario(usuario_ingreso: string, pass_ingreso: string) {
  if (!usuario_ingreso || !pass_ingreso) throw new Error('Faltan ingresar datos');
  try {
    const usuario = await Usuario.findOne({ where: { usuario: usuario_ingreso } });
    if (!usuario) throw new Error('El usuario no fue encontrado');
    const hashBD = usuario.get('contrasenia') as string;
    const passBien = await bcrypt.compare(pass_ingreso, hashBD);
    if (passBien) {
      const id = usuario.getDataValue('id');
      const admin = usuario.getDataValue('admin');
      const token = jwt.sign({ id, usuario: usuario_ingreso, admin }, SECRET_KEY, { expiresIn: '8h' });
      return { mensaje: 'Login correcto', token, id, admin };
    } else {
      throw new Error('La contraseña es incorrecta');
    }
  } catch (error) {
    throw new Error('Error al ingresar al usuario');
  }
}

export async function verificarUsuario(token: string) {
  const t = await sequelize.transaction();
  try {
    const payload = jwt.verify(token, SECRET_KEY) as { email: string };
    const usuario = await Usuario.findOne({ where: { email: payload.email }, transaction: t, lock: t.LOCK.UPDATE });
    if (!usuario) {
      await t.rollback();
      throw new Error('Usuario no encontrado');
    }
    await usuario.update({ verificado: true }, { transaction: t });
    await t.commit();
    return { mensaje: 'Cuenta verificada con éxito, puede volver a la pagina' };
  } catch (error: any) {
    await t.rollback();
    throw new Error(error.message || 'Token inválido o expirado');
  }
}

export async function verificarPermisosAdministrador(id: number) {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    const { admin } = usuario.get();
    if (admin === true) {
      return { esAdmin: true };
    } else {
      return { esAdmin: false, mensaje: 'No tiene permisos de administrador' };
    }
  } catch (error) {
    throw new Error('Error interno del servidor');
  }
}

export async function solicitarResetContrasenia(email: string) {
  if (!email || !validator.isEmail(email)) throw new Error('Email inválido');
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) throw new Error('No existe un usuario con ese email');
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '15m' });
    await enviarCorreoReset(email, token);
    return { mensaje: 'Correo enviado para restablecer contraseña' };
  } catch (error) {
    throw new Error('Error al solicitar restablecimiento');
  }
}

export async function resetearContrasenia(token: string, nuevaContrasenia: string) {
  if (!nuevaContrasenia) throw new Error('Falta la nueva contraseña');
  const t = await sequelize.transaction();
  try {
    const { email } = jwt.verify(token, SECRET_KEY) as { email: string };
    const usuario = await Usuario.findOne({ where: { email }, transaction: t, lock: t.LOCK.UPDATE });
    if (!usuario) {
      await t.rollback();
      throw new Error('Usuario no encontrado');
    }
    const hashed = await bcrypt.hash(nuevaContrasenia, 10);
    await usuario.update({ contrasenia: hashed }, { transaction: t });
    await t.commit();
    return { mensaje: 'Contraseña actualizada correctamente' };
  } catch (error: any) {
    await t.rollback();
    throw new Error(error.message || 'Token inválido o expirado');
  }
}

export async function cambiarEstadoAdministrador(id: number) {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    const esAdminActual = usuario.get('admin');
    await usuario.update({ admin: !esAdminActual });
    return { mensaje: `Estado de administrador cambiado a ${!esAdminActual}` };
  } catch (error) {
    throw new Error('Error interno del servidor');
  }
}

export async function cambiarEstadoVerificado(id: number) {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    const esVerificadoActual = usuario.get('verificado');
    await usuario.update({ verificado: !esVerificadoActual });
    return { mensaje: `Estado de verificado cambiado a ${!esVerificadoActual}` };
  } catch (error) {
    throw new Error('Error interno del servidor');
  }
}

export async function eliminarUsuario(id: number) {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    await usuario.destroy();
    return { mensaje: 'Usuario eliminado correctamente' };
  } catch (error) {
    throw new Error('Error interno del servidor');
  }
}