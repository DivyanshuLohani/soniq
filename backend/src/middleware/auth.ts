import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthenticatedUser {
  id: string;
  spotifyId?: string | null;
  spotifyProduct?: string | null;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isGuest?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'soniq-super-secret-jwt-key-2025';

export function signUserToken(user: AuthenticatedUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : cookieToken;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    if (decoded && decoded.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          spotifyId: dbUser.spotifyId,
          spotifyProduct: dbUser.spotifyProduct,
          displayName: dbUser.displayName,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role as 'USER' | 'ADMIN',
          isGuest: false,
        };
      } else {
        req.user = decoded;
      }
    }
  } catch (err) {
    // Continue unauthenticated on invalid token
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }
  next();
}
