export class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;

  static ok<T>(data: T, message = 'Operación exitosa'): ApiResponseDto<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static fail(message: string, error?: any): ApiResponseDto<null> {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}
