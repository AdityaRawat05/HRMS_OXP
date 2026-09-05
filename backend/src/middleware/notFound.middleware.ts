import { Request, Response } from 'express';
import { ApiResponse } from '../types/index';

export const notFoundHandler = (req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
};
