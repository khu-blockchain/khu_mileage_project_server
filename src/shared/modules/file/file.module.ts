import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { generateSafeFilename } from '@/shared/utils/file.utils';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const uploadsDir = path.join(process.cwd(), 'public');

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        return {
          storage: multer.diskStorage({
            destination: (req, file, cb) => {
              cb(null, uploadsDir);
            },
            filename: (req, file, cb) => {
              const safeName = generateSafeFilename(file);
              cb(null, safeName);
            },
          }),
        };
      },
    }),
  ],
  exports: [MulterModule],
})
export class FileModule {}
