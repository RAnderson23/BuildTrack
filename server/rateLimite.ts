// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit uploads to 10 per 15 minutes
  message: 'Too many uploads, please try again later'
});