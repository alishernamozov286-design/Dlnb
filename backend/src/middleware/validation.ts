import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => `${err.msg}`).join(', ');
    
    return res.status(400).json({
      message: `Validation failed: ${errorMessages}`,
      errors: errors.array(),
      receivedData: req.body
    });
  }
  
  next();
};