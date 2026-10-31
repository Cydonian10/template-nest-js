export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  path: string;
  timestamp: string;
}
