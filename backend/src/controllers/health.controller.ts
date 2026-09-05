import { Request, Response } from 'express';
import { ApiResponse } from '../types/index';

export const getHealthStatus = (_req: Request, res: Response<ApiResponse>): void => {
  res.status(200).json({
    success: true,
    message: 'PeoplePay360 API is running',
  });
};
