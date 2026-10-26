import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { store } from './server/store.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support JSON body up to 10MB for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

export const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

// Ensure upload directory exists safely
const UPLOADS_DIR = isVercel
  ? path.join('/tmp', 'uploads')
  : path.resolve(process.cwd(), 'public/uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not initialize uploads directory:', e);
}

// Serve public uploads statically
app.use('/uploads', express.static(UPLOADS_DIR));

// ==========================================
// STATELESS CRYPTOGRAPHIC ADMIN SESSION TOKEN
// ==========================================

interface RateLimitTracker {
  attempts: number;
  lockedUntil: number;
}
const pinRateLimits = new Map<string, RateLimitTracker>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const tracker = pinRateLimits.get(ip) || { attempts: 0, lockedUntil: 0 };

  if (tracker.lockedUntil > now) {
    const retryAfterSec = Math.ceil((tracker.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  if (tracker.lockedUntil > 0 && tracker.lockedUntil <= now) {
    tracker.attempts = 0;
    tracker.lockedUntil = 0;
    pinRateLimits.set(ip, tracker);
  }

  return { allowed: true, remainingAttempts: Math.max(0, 5 - tracker.attempts) };
}

function recordPinFailure(ip: string): { remainingAttempts: number; locked: boolean } {
  const now = Date.now();
  const tracker = pinRateLimits.get(ip) || { attempts: 0, lockedUntil: 0 };
  tracker.attempts += 1;

  if (tracker.attempts >= 5) {
    tracker.lockedUntil = now + 5 * 60 * 1000; // 5 minute lockout
    pinRateLimits.set(ip, tracker);
    return { remainingAttempts: 0, locked: true };
  }

  pinRateLimits.set(ip, tracker);
  return { remainingAttempts: 5 - tracker.attempts, locked: false };
}

function resetPinRateLimit(ip: string) {
  pinRateLimits.delete(ip);
}

function getSessionSigningSecret(): string {
  const auth = store.getAuth();
  const envSecret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || '';
  return crypto
    .createHash('sha256')
    .update(`${envSecret}:${auth.pinSalt}:${auth.pinHash}:hamdar_session_v1`)
    .digest('hex');
}

export function generateAdminSessionToken(durationMs: number = 7 * 24 * 60 * 60 * 1000): string {
  const payload = {
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + durationMs,
    nonce: crypto.randomBytes(16).toString('hex')
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getSessionSigningSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

export function verifyAdminSessionToken(token: string): { valid: boolean; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Authentication token required.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed authentication token.' };
  }

  const [payloadStr, signature] = parts;
  const secret = getSessionSigningSecret();
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  try {
    const isSigValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSig, 'utf-8')
    );
    if (!isSigValid) {
      return { valid: false, error: 'Invalid token signature. Authentication rejected.' };
    }
  } catch {
    return { valid: false, error: 'Invalid token signature length.' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (payload.role !== 'admin') {
      return { valid: false, error: 'Insufficient administrative privileges.' };
    }
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return { valid: false, error: 'Session expired. Please re-enter your PIN.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid token payload.' };
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required. Please enter admin PIN.' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const verification = verifyAdminSessionToken(token);
  if (!verification.valid) {
    res.status(401).json({ error: verification.error || 'Session expired or invalid. Please re-enter your PIN.' });
    return;
  }

  next();
}

// ==========================================
// API ROUTES
// ==========================================
export const apiRouter = express.Router();

// Settings
apiRouter.get('/settings', (_req: Request, res: Response) => {
  try {
    const settings = store.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

apiRouter.put('/settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = store.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update settings' });
  }
});

// Products
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const department = req.query.department as string | undefined;
    const category = req.query.category as string | undefined;
    const subcategory = req.query.subcategory as string | undefined;
    const search = req.query.search as string | undefined;
    const activeOnly = req.query.activeOnly !== 'false';

    const products = store.getProducts(department, category, subcategory, search, activeOnly);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  try {
    const product = store.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch product' });
  }
});

apiRouter.post('/products', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, department, category, subcategory, description, price, originalPrice, salePrice, images, sizes, colors, stock, isFeatured, isActive } = req.body;
    if (!name || price === undefined || !department) {
      res.status(400).json({ error: 'Name, price, and department are required' });
      return;
    }

    if (department !== 'men' && department !== 'women') {
      res.status(400).json({ error: "Validation Error: Department must be strictly 'men' or 'women'." });
      return;
    }

    const created = store.createProduct({
      name: String(name).trim(),
      department: department as 'men' | 'women',
      category: category || 'Clothing',
      subcategory: subcategory || (category === 'Shoes' ? (department === 'men' ? "Men's Shoes" : "Women's Shoes") : ''),
      description: description || '',
      price: parseFloat(price) || 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      images: Array.isArray(images) && images.length ? images : ['/src/assets/images/hero_fashion_models_1792786507434.jpg'],
      sizes: Array.isArray(sizes) && sizes.length ? sizes : ['S', 'M', 'L'],
      colors: Array.isArray(colors) && colors.length ? colors : ['Standard'],
      stock: parseInt(stock, 10) || 0,
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== false,
      isExample: false
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create product' });
  }
});

apiRouter.put('/products/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    if (req.body.department && req.body.department !== 'men' && req.body.department !== 'women') {
      res.status(400).json({ error: "Validation Error: Department must be strictly 'men' or 'women'." });
      return;
    }
    const updated = store.updateProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update product' });
  }
});

apiRouter.delete('/products/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const success = store.deleteProduct(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// Admin Stats
apiRouter.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  try {
    const stats = store.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
});

// Admin PIN Verification
apiRouter.post('/admin/verify-pin', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Too many failed attempts. Locked out for security. Try again in ${rateLimit.retryAfterSec} seconds.`,
      locked: true,
      retryAfterSec: rateLimit.retryAfterSec
    });
    return;
  }

  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ error: 'PIN is required' });
    return;
  }

  const isValid = store.verifyPin(pin);
  if (!isValid) {
    const result = recordPinFailure(ip);
    if (result.locked) {
      res.status(429).json({
        error: 'Too many incorrect PIN attempts. Admin access locked for 5 minutes.',
        locked: true,
        remainingAttempts: 0
      });
      return;
    }
    res.status(401).json({
      error: `Incorrect PIN. ${result.remainingAttempts} attempts remaining before temporary lockout.`,
      remainingAttempts: result.remainingAttempts
    });
    return;
  }

  // PIN verified successfully
  resetPinRateLimit(ip);
  const token = generateAdminSessionToken();
  const auth = store.getAuth();

  res.json({
    success: true,
    token,
    isInitialSetup: auth.isInitialSetup
  });
});

// Admin Password Login
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  const isValid = store.verifyPassword(password);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid administrator password.' });
    return;
  }

  const token = generateAdminSessionToken();
  const auth = store.getAuth();
  res.json({
    success: true,
    token,
    isInitialSetup: auth.isInitialSetup
  });
});

// Auth status
apiRouter.get('/admin/auth-status', requireAdmin, (_req: Request, res: Response) => {
  const auth = store.getAuth();
  res.json({
    valid: true,
    isInitialSetup: auth.isInitialSetup
  });
});

// Change PIN
apiRouter.post('/admin/change-pin', requireAdmin, (req: Request, res: Response) => {
  try {
    const { currentPin, newPin, confirmPin } = req.body;

    if (!currentPin || !newPin || !confirmPin) {
      res.status(400).json({ error: 'Current PIN, new PIN, and confirmation PIN are required' });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits' });
      return;
    }

    if (newPin !== confirmPin) {
      res.status(400).json({ error: 'New PIN and confirmation do not match' });
      return;
    }

    const isCurrentValid = store.verifyPin(currentPin);
    if (!isCurrentValid) {
      res.status(401).json({ error: 'Current PIN is incorrect' });
      return;
    }

    store.updatePin(newPin);
    const token = generateAdminSessionToken();
    res.json({ success: true, message: 'Admin PIN updated successfully', token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update PIN' });
  }
});

// Change Password
apiRouter.post('/admin/change-password', requireAdmin, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'All password fields are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New passwords do not match' });
      return;
    }

    const isCurrentValid = store.verifyPassword(currentPassword);
    if (!isCurrentValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    store.updatePassword(newPassword);
    const token = generateAdminSessionToken();
    res.json({ success: true, message: 'Admin password updated successfully', token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
});

// Image Upload Endpoint (handles data URLs or base64 files)
apiRouter.post('/upload', requireAdmin, (req: Request, res: Response) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'dataUrl base64 string is required' });
      return;
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Invalid data URL format' });
      return;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

    const safeName = (filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '') : 'img') + `_${Date.now()}.${ext}`;

    // 1. Save to persistent store
    store.saveImage(safeName, mimeType, base64Data);

    // 2. Also try writing to uploads directory on disk if writable
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    } catch {
      // Ignored in read-only environments
    }

    // Return the permanent publicly accessible API route URL
    const publicUrl = `/api/images/${safeName}`;
    res.json({ url: publicUrl, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Public image serving endpoint
apiRouter.get('/images/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    // 1. Try finding in store database
    const saved = store.getImage(id);
    if (saved) {
      const buffer = Buffer.from(saved.data, 'base64');
      res.setHeader('Content-Type', saved.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
      return;
    }

    // 2. Try finding on local filesystem
    const diskPath = path.join(UPLOADS_DIR, id);
    if (fs.existsSync(diskPath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(diskPath);
      return;
    }

    res.status(404).json({ error: 'Image not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to serve image' });
  }
});

// Mount API router ONLY under /api prefix
app.use('/api', apiRouter);

// Missing /api/* 404 handler
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl || req.url} not found` });
});

// Global JSON error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC SERVING
// ==========================================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HAMDAR Fashion Wear server running on http://0.0.0.0:${PORT}`);
  });
}

const isDirectRun = Boolean(
  process.argv[1] && (
    process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js') ||
    process.argv[1].endsWith('/server')
  )
);

if (!isVercel && isDirectRun) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
