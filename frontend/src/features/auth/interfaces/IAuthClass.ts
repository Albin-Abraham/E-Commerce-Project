import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@features/auth/services/auth.types";

export interface IAuthClass {
  isAuthenticated(): boolean;
  getUser(): AuthUser | null;
  getAccessToken(): string | null;

  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  forgotPassword?(email: string): Promise<{ message?: string }>;

  saveTokens(tokens: LoginResponse): void;
  clearTokens(): void;
}
