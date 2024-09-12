/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextFunction, Request, Response} from 'express';
import {ErrorResponse} from '@sharedTypes/MessageTypes';
import CustomError from './classes/CustomError';
import jwt from 'jsonwebtoken';
import {getUserById} from './api/models/userModel';
import {TokenContent} from '@sharedTypes/DBTypes';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`🔍 - Not Found - ${req.originalUrl}`, 404);
  next(error);
};

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  console.error('errorHandler', err);
  res.status(err.status || 500);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorizationHeader = req.headers.authorization;

    // Ensure the authorization header exists and is in the correct format
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return next(new CustomError('No token provided', 401));
    }

    // Extract the token from the 'Bearer' scheme
    const token = authorizationHeader.split(' ')[1];

    if (!token) {
      return next(new CustomError('No token provided', 401));
    }

    // Verify and decode the JWT token
    const userFromToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenContent;

    // Fetch user based on decoded user_id
    const user = await getUserById(userFromToken.user_id);

    if (!user) {
      return next(new CustomError('Token not valid', 403));
    }

    // Attach user to response locals for further use in the request lifecycle
    res.locals.user = user;

    next();
  } catch (error) {
    // Check if the error is related to token expiration
    if ((error as Error).name === 'TokenExpiredError') {
      return next(new CustomError('Token expired', 401));
    }

    // General error handling for token validation failure
    return next(new CustomError('Invalid token', 400));
  }
};

export {notFound, errorHandler, authenticate};
