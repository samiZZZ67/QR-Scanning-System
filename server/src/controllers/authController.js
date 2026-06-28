import { timingSafeEqual } from 'node:crypto';
import config from '../config/env.js';
import { createStaffSession, normalizeStaffRole } from '../security/session.js';

/**
 * POST /api/staff/session
 * Validates the staff PIN from request body (or x-staff-pin header) using
 * constant-time comparison to prevent timing attacks, then returns a short-lived
 * signed staff session token.
 */
export function createSession(req, res) {
  // Accept PIN from body (client-side form) OR header (programmatic access)
  const provided = String(req.body?.pin ?? req.get('x-staff-pin') ?? '');
  const expected = config.staffPin;
  const role = normalizeStaffRole(req.body?.role);

  try {
    const a = Buffer.from(provided.padEnd(64));
    const b = Buffer.from(expected.padEnd(64));
    if (provided.length === expected.length && timingSafeEqual(a, b)) {
      return res.json({ ok: true, ...createStaffSession(role) });
    }
  } catch {
    // fall through to 401
  }

  return res.status(401).json({ error: 'Invalid PIN' });
}
