import { randomBytes } from 'crypto';

export function generateInviteToken(): string {
  // Generate a random 32-byte token and convert to hex
  return randomBytes(32).toString('hex');
} 