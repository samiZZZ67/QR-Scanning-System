import { timingSafeEqual } from 'node:crypto';
import config from '../config/env.js';
import { verifyStaffSession } from '../security/session.js';

function staffPinMatches(provided) {
  const expected = config.staffPin;
  try {
    const a = Buffer.from(String(provided || '').padEnd(64));
    const b = Buffer.from(expected.padEnd(64));
    return provided.length === expected.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Middleware: validates a signed staff session token.
 * Temporary compatibility: x-staff-pin still works for external integrations.
 */
export function requireStaffPin(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [, token] = authorization.match(/^Bearer\s+(.+)$/i) || [];
  const session = verifyStaffSession(token);
  if (session) {
    req.staff = session;
    return next();
  }

  const provided = req.get('x-staff-pin') || '';
  if (provided && staffPinMatches(provided)) {
    req.staff = { role: 'Staff', legacyPin: true };
    return next();
  }

  return res.status(401).json({ error: 'Staff session required' });
}
