import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const code = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: true,
    statusCode,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// Custom error class
export class AppError extends Error implements CustomError {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

// Common error types
export const ValidationError = (message: string) => new AppError(message, 400, 'VALIDATION_ERROR');
export const NotFoundError = (resource: string) =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');
export const UnauthorizedError = () =>
  new AppError('Unauthorized', 401, 'UNAUTHORIZED');
export const ForbiddenError = () =>
  new AppError('Forbidden', 403, 'FORBIDDEN');
export const ConflictError = (message: string) =>
  new AppError(message, 409, 'CONFLICT');
