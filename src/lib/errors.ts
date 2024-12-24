export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class VideoError extends AppError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, `VIDEO_${code}`, details);
    this.name = 'VideoError';
  }
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, `STORAGE_${code}`, details);
    this.name = 'StorageError';
  }
} 