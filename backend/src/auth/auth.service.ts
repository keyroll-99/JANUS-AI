import { AuthResponse, LoginUserDto, RegisterUserDto, RefreshResponse } from './auth.dto';
import { supabase } from '../shared/config/supabase';
import { AuthError } from '@supabase/supabase-js';

/**
 * AuthService handles all authentication operations with Supabase Auth
 * Acts as a bridge between Express controllers and Supabase authentication
 */
export class AuthService {
  /**
   * Register a new user with email and password
   * @throws {AuthError} When registration fails (e.g., email already exists)
   */
  async register(dto: RegisterUserDto): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw this.handleAuthError(error);
    }

    if (!data.session || !data.user) {
      const err = new Error('Registration succeeded but session was not created.') as AuthError;
      err.name = 'SessionError';
      err.status = 500;
      throw err;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    };
  }

  /**
   * Authenticate an existing user with email and password
   * @throws {AuthError} When credentials are invalid
   */
  async login(dto: LoginUserDto): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw this.handleAuthError(error);
    }

    if (!data.session || !data.user) {
      const err = new Error('Login succeeded but session was not created.') as AuthError;
      err.name = 'SessionError';
      err.status = 500;
      throw err;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    };
  }

  /**
   * Refresh an expired access token using a refresh token
   * @param refreshToken The refresh token from httpOnly cookie
   * @throws {AuthError} When refresh token is invalid or expired
   */
  async refresh(refreshToken: string): Promise<RefreshResponse & { refreshToken: string }> {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw this.handleAuthError(error);
    }

    if (!data.session) {
      const err = new Error('Token refresh failed - no session returned.') as AuthError;
      err.name = 'RefreshError';
      err.status = 401;
      throw err;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Sign out a user by invalidating their refresh token
   * @param refreshToken The refresh token from httpOnly cookie
   */
  async logout(refreshToken: string): Promise<void> {
    // Set the session first so Supabase knows which user to sign out
    await supabase.auth.setSession({
      access_token: '', // We don't have access token in logout flow
      refresh_token: refreshToken,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log the error but don't throw - we still want to clear the cookie
      console.error('Supabase signOut error:', error);
    }
  }

  /**
   * Maps Supabase AuthError to appropriate HTTP status codes and messages
   * Provides consistent error handling across all auth operations
   */
  private handleAuthError(error: AuthError): Error {
    const err = new Error(error.message) as AuthError;
    err.name = error.name;

    // Map common Supabase auth errors to HTTP status codes
    switch (error.message) {
      case 'User already registered':
        err.status = 409; // Conflict
        err.message = 'An account with this email already exists.';
        break;
      case 'Invalid login credentials':
        err.status = 401; // Unauthorized
        err.message = 'Invalid email or password.';
        break;
      case 'Email not confirmed':
        err.status = 403; // Forbidden
        err.message = 'Please verify your email before logging in.';
        break;
      default:
        // Handle refresh token errors with pattern matching
        if (error.message.includes('Invalid Refresh Token')) {
          err.status = 401; // Unauthorized
          err.message = 'Your session has expired. Please log in again.';
        } else {
          // For unknown errors, maintain original message but set 500 status
          err.status = 500;
        }
        break;
    }

    return err;
  }
}

export const authService = new AuthService();
