import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './auth.dto';
import config from '../shared/config/config';

/**
 * AuthController handles HTTP requests for authentication endpoints
 * Manages cookie-based refresh token storage and access token responses
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   * Sets httpOnly cookie with refresh token, returns access token in body
   */
  async register(
    req: Request<object, object, RegisterUserDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.register(req.body);

      // Set refresh token in httpOnly cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      // Return access token and user data
      res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login an existing user
   * POST /api/v1/auth/login
   * Sets httpOnly cookie with refresh token, returns access token in body
   */
  async login(
    req: Request<object, object, LoginUserDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.login(req.body);

      // Set refresh token in httpOnly cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      // Return access token and user data
      res.status(200).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh an expired access token
   * POST /api/v1/auth/refresh
   * Reads refresh token from cookie, returns new access token
   */
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies?.[config.cookie.name];

      if (!refreshToken) {
        res.status(401).json({
          message: 'Refresh token not found. Please log in again.',
        });
        return;
      }

      const result = await authService.refresh(refreshToken);

      // Update refresh token in cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      // Return new access token
      res.status(200).json({
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * Clears refresh token cookie and invalidates session
   */
  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies?.[config.cookie.name];

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      this.clearRefreshTokenCookie(res);

      // Return 204 No Content
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper method to set refresh token in httpOnly cookie
   * @private
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(config.cookie.name, refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge,
      path: '/',
    });
  }

  /**
   * Helper method to clear refresh token cookie
   * @private
   */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: '/',
    });
  }
}

export const authController = new AuthController();
