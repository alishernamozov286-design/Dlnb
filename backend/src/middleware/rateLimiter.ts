import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Juda ko\'p so\'rov yuborildi, iltimos keyinroq urinib ko\'ring',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Juda ko\'p kirish urinishi, 15 daqiqadan keyin urinib ko\'ring',
  skipSuccessfulRequests: true,
});

// AI endpoints rate limiter
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: 'AI so\'rovlar limiti tugadi, 1 daqiqadan keyin urinib ko\'ring',
});
