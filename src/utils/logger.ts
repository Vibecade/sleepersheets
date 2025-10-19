/**
 * Logger utility for consistent logging across the application.
 * In development, logs all messages. In production, only logs warnings and errors.
 */
export const logger = {
  debug: import.meta.env.DEV ? console.log : () => {},
  info: import.meta.env.DEV ? console.info : () => {},
  warn: console.warn,
  error: console.error,
};
