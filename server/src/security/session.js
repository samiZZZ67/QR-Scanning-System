import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import config from '../config/env.js';

const allowedRoles = new Set(['Admin', 'Kitchen', 'Waiter']);

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(input) {
  return createHmac('sha256', config.sessionSecret).update(input).digest('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function normalizeStaffRole(role) {
  const value = String(role || '').trim();
  return allowedRoles.has(value) ? value : 'Staff';
}

export function createStaffSession(role = 'Staff') {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + Math.max(5, config.sessionTtlMinutes) * 60;
  const payload = {
    sub: 'staff',
    role: normalizeStaffRole(role),
    iat: issuedAt,
    exp: expiresAtSeconds,
    jti: randomUUID()
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const token = `${unsigned}.${sign(unsigned)}`;
  return {
    token,
    role: payload.role,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString()
  };
}

export function verifyStaffSession(token) {
  const [header, payload, signature] = String(token || '').split('.');
  if (!header || !payload || !signature) return null;

  const unsigned = `${header}.${payload}`;
  if (!safeEqual(signature, sign(unsigned))) return null;

  try {
    const parsed = decode(payload);
    if (parsed.sub !== 'staff') return null;
    if (!parsed.exp || parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      role: normalizeStaffRole(parsed.role),
      expiresAt: new Date(parsed.exp * 1000).toISOString(),
      id: parsed.jti
    };
  } catch {
    return null;
  }
}

