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

  saveTokens(tokens: LoginResponse): void;
  clearTokens(): void;
}
