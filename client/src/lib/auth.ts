import * as SecureStore from 'expo-secure-store';
import { api } from './api';

const ACCESS_TOKEN_KEY = 'agriguide_access_token';

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  isVerified: boolean;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post<RegisterResponse>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  verifyEmail: (email: string, otp: string) =>
    api.post<{ message: string; user: AuthUser }>('/auth/verify-email', {
      email,
      otp,
    }),

  resendVerificationOtp: (email: string) =>
    api.post<{ message: string }>('/auth/resend-otp', { email }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', {
      email,
      otp,
      newPassword,
    }),

  changePassword: (
    currentPassword: string,
    newPassword: string,
    token: string,
  ) =>
    api.post<{ message: string }>(
      '/auth/change-password',
      { currentPassword, newPassword },
      { token },
    ),

  me: (token: string) => api.get<AuthUser>('/auth/me', { token }),
};

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
};
