import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Uploads papkalarini yaratish
const profilesDir = path.join(__dirname, '../../uploads/profiles');
const servicesDir = path.join(__dirname, '../../uploads/services');

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}

// Storage configuration for profiles
const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profilesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Storage configuration for services
const serviceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, servicesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'service-' + uniqueSuffix + ext);
  }
});

// File filter - faqat rasmlar
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari (jpeg, jpg, png, gif, webp) qabul qilinadi!'));
  }
};

// Multer configuration for profiles
export const upload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Multer configuration for services
export const uploadServiceImage = multer({
  storage: serviceStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
}).single('image');
