import { Request, Response, NextFunction } from 'express';
import { db, User } from '../db/database.ts';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado. Se requiere token o sesión activa.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  // We use token format: "usr-id:timestamp" or directly userId for demo session tokens
  const userId = token.split(':')[0];

  const user = db.getRaw().users.find((u) => u.id === userId && u.active);
  if (!user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: Array<'student' | 'teacher' | 'psychologist' | 'admin' | 'general'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Acceso denegado. Este recurso requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}
