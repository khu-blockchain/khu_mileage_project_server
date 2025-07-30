import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateUrlSafeRandomString = (bytes: number): string => {
  return randomBytes(bytes).toString('base64url');
};

export const generateRandomAlphanumericString = (bytes: number): string => {
  return randomBytes(bytes).toString('base64').replace(/[+/=]/g, '');
};
