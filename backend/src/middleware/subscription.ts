import { Response, NextFunction } from 'express';
import Subscription from '../models/Subscription';
import { AuthRequest } from './auth';

// UNLIMITED MESSAGES - No subscription check
export const checkSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip all subscription checks - unlimited messages for everyone
  next();
};

// Extend AuthRequest interface
declare module './auth' {
  interface AuthRequest {
    subscription?: any;
  }
}
