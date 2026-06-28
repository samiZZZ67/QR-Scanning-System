import { timingSafeEqual } from 'node:crypto';
import config from '../config/env.js';

/**
 * Middleware: validates the x-staff-pin header using constant-time comparison
 * to prevent timing-based brute-force attacks.
 */
export function requireStaffPin(req, res, next) {
  const provided = req.get('x-staff-pin') || '';
  const expected = config.staffPin;
  try {
    // Pad both strings to the same fixed length before comparison
    // to avoid length leakage while still catching wrong-length pins below.
    const a = Buffer.from(provided.padEnd(64));
    const b = Buffer.from(expected.padEnd(64));
    if (provided.length === expected.length && timingSafeEqual(a, b)) {
      return next();
    }
  } catch {
    // Any unexpected error falls through to the 401 below
  }
  return res.status(401).json({ error: 'Staff PIN required' });
}
