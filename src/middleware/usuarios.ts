import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuarios';

const SECRET_KEY: string = process.env.CLAVE || '';

export function verificarToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(403).json({ message: 'Token no proporcionado' });
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Token inválido o expirado' });
      return;
    }
    (req as any).user = user;
    next();
  });
}

export async function soloAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userData = (req as any).user;
  const usuario = await Usuario.findByPk(userData.id);
  if (!usuario || !usuario.get('admin')) {
    res.status(403).json({ message: 'Solo administradores pueden realizar esta acción' });
    return;
  }
  next();
}