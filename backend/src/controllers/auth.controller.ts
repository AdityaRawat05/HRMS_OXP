import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { ApiResponse } from '../types/index';

export const login = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
      return;
    }

    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        errors: [],
      });
      return;
    }

    const profile = await AuthService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: profile },
    });
  } catch (err) {
    next(err);
  }
};
