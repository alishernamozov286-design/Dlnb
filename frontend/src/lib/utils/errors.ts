/**
 * Error Classes - Custom error types
 */

export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SyncError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SyncError);
    }
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete',
    public collection: string
  ) {
    super(message);
    this.name = 'StorageError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError);
    }
  }
}