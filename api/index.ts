import type { Request, Response } from 'express';
import app from '../server.ts';

export default function handler(req: Request, res: Response) {
  if (req.url) {
    if (req.url.startsWith('/api?') || req.url.startsWith('/api/?')) {
      const url = new URL(req.url, 'http://localhost');
      const path = url.searchParams.get('0');
      if (path) {
        req.url = '/api/' + path.replace(/^\/+/, '');
      }
    } else if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }
  return app(req, res);
}
