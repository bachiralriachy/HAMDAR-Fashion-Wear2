import type { Request, Response } from 'express';
import app from '../server.ts';

export default function handler(req: Request, res: Response) {
  // If Vercel rewrote query parameters, e.g. /api?0=admin/verify-pin
  if (req.url && (req.url.startsWith('/api?') || req.url.startsWith('/api/?'))) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.searchParams.get('0');
    if (path) {
      req.url = '/api/' + path.replace(/^\/+/, '');
    }
  }
  return app(req, res);
}
