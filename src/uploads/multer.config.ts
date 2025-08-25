import { memoryStorage } from 'multer';

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') &&
      file.mimetype !== 'image/svg+xml'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Файл не является изображением!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};
