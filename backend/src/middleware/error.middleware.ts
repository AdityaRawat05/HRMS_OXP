import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index';

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown[];
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  console.error(`[Error Handler] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
