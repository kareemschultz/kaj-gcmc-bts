/**
 * Authentication Helper Utilities
 */

import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export function validatePassword(password: string) {
  return passwordSchema.safeParse(password);
}

export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isValidCSRFToken(token: string): boolean {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

export const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'unknown';
  }

  return userAgent.slice(0, 200).replace(/[<>]/g, '');
}
