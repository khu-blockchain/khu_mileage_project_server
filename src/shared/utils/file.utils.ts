import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export const generateSafeFilename = (file: Express.Multer.File): string => {
  const ext = path.extname(file.originalname);
  const dateStr = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const randStr = crypto.randomBytes(4).toString('hex');
  const safeName = `${dateStr}_${randStr}${ext}`;

  return safeName;
};

export const cleanupUploadedFiles = async (files: Express.Multer.File[]): Promise<void> => {
  console.error('An error occurred, starting file cleanup...');

  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file.path);
        console.log(`Successfully deleted ${file.path}`);
      } catch (e) {
        console.error(`Failed to delete file: ${file.path}`, e);
      }
    }),
  );
};
