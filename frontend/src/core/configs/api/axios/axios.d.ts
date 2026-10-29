// src/configs/api/axios/axios.d.ts
export interface TokenPair {
  access: string | null;
  refresh: string | null;
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  details?: any;
}
