/**
 * Production-safe logging utility
 * In production, only errors are logged
 * In development, all logs are shown
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    // Warnings are shown in both dev and production
    console.warn(...args);
  },
  
  error: (...args: any[]) => {
    // Errors are always logged
    console.error(...args);
    
    // In production, you might want to send to error tracking service
    // Example: Sentry.captureException(...)
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

