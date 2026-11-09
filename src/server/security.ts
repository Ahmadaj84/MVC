import crypto from 'crypto';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * HTTP Basic authentication for the whole app (UI + API).
 *
 * Credentials come from ADMIN_USER / ADMIN_PASSWORD. The browser prompts once
 * and then re-sends the credentials automatically on every same-origin fetch,
 * so the SPA needs no extra login code.
 *
 * - Production: the server refuses to start without both variables.
 * - Development: if they are missing, a random password is generated and
 *   printed to the console for this run only.
 */
export function createBasicAuth(isProduction: boolean): RequestHandler {
  let user = process.env.ADMIN_USER;
  let password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    if (isProduction) {
      throw new Error('ADMIN_USER and ADMIN_PASSWORD must be set in production.');
    }
    user = user || 'admin';
    password = crypto.randomBytes(12).toString('base64url');
    console.warn(
      `[auth] ADMIN_USER/ADMIN_PASSWORD not set. Using temporary dev credentials -> ${user} / ${password}`
    );
  }

  const expected = Buffer.from(`${user}:${password}`);

  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const provided = Buffer.from(Buffer.from(encoded, 'base64').toString('utf8'));
      if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) {
        return next();
      }
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="MVC", charset="UTF-8"');
    res.status(401).json({ error: 'Authentication required' });
  };
}

/** Minimal security headers (helmet-lite, no extra dependency). */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.removeHeader('X-Powered-By');
  next();
}

/** Simple fixed-window rate limiter per client IP for mutating requests. */
export function rateLimit(maxPerWindow: number, windowMs: number): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (entry.count > maxPerWindow) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }
    if (hits.size > 10000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    next();
  };
}
