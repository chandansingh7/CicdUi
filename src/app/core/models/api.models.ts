export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  errorCode: string | null;   // 5-char code from backend, e.g. "AU004"
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
