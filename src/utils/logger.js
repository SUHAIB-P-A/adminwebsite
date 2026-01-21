/**
 * Centralized Logging Utility
 * Handles all application logging with environment-aware configurations
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const LOG_COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

class Logger {
  constructor() {
    this.isDev = import.meta.env.VITE_ENV === 'development';
    this.logHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      data,
      url: window.location.href,
    };
  }

  /**
   * Store log in history for debugging
   */
  storeInHistory(logEntry) {
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Console output with color coding
   */
  consoleOutput(level, message, data) {
    const color = LOG_COLORS[level];
    const resetColor = LOG_COLORS.RESET;
    
    if (data) {
      console.log(
        `${color}[${level}]${resetColor} ${message}`,
        data
      );
    } else {
      console.log(
        `${color}[${level}]${resetColor} ${message}`
      );
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = null) {
    const logEntry = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
    this.storeInHistory(logEntry);
    
    if (this.isDev) {
      this.consoleOutput(LOG_LEVELS.DEBUG, message, data);
    }
  }

  /**
   * Info level logging
   */
  info(message, data = null) {
    const logEntry = this.formatMessage(LOG_LEVELS.INFO, message, data);
    this.storeInHistory(logEntry);
    
    if (this.isDev) {
      this.consoleOutput(LOG_LEVELS.INFO, message, data);
    }
  }

  /**
   * Warning level logging
   */
  warn(message, data = null) {
    const logEntry = this.formatMessage(LOG_LEVELS.WARN, message, data);
    this.storeInHistory(logEntry);
    
    this.consoleOutput(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Error level logging
   */
  error(message, data = null) {
    const logEntry = this.formatMessage(LOG_LEVELS.ERROR, message, data);
    this.storeInHistory(logEntry);
    
    this.consoleOutput(LOG_LEVELS.ERROR, message, data);
    
    // Send to monitoring service in production
    if (!this.isDev) {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Get log history for debugging
   */
  getHistory() {
    return this.logHistory;
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Placeholder for sending errors to monitoring service
   */
  sendToMonitoring(logEntry) {
    // TODO: Implement error tracking service (e.g., Sentry, LogRocket, etc.)
    // Example:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry),
    // }).catch(() => {
    //   // Fail silently - don't break app if logging fails
    // });
  }
}

// Create singleton instance
export const logger = new Logger();

export default logger;
