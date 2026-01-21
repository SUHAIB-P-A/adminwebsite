/**
 * Monitoring and Error Tracking Utility
 * Integrates with Sentry and provides centralized error/performance monitoring
 */

import { logger } from './logger';

class MonitoringManager {
  constructor() {
    this.isInitialized = false;
    this.sentry = null;
    this.errorQueue = [];
  }

  /**
   * Initialize monitoring with Sentry
   * @param {Object} config - Configuration object
   * @param {string} config.dsn - Sentry DSN
   * @param {string} config.environment - Environment (production, staging, development)
   * @param {number} config.tracesSampleRate - Performance monitoring sample rate (0-1)
   */
  async init(config = {}) {
    try {
      const {
        dsn = import.meta.env.VITE_SENTRY_DSN,
        environment = import.meta.env.VITE_ENV || 'development',
        tracesSampleRate = 0.1,
        enabled = import.meta.env.VITE_ENV !== 'development'
      } = config;

      if (!enabled || !dsn) {
        logger.info('Monitoring disabled or no DSN provided');
        return;
      }

      // Dynamically import Sentry only when needed
      const Sentry = await this._loadSentry();
      if (!Sentry) return;

      Sentry.init({
        dsn,
        environment,
        tracesSampleRate,
        release: import.meta.env.VITE_APP_VERSION || 'unknown',
        integrations: [
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaySessionSampleRate: 0.1,
        replayOnErrorSampleRate: 1.0,
      });

      this.sentry = Sentry;
      this.isInitialized = true;
      logger.info('Monitoring initialized with Sentry');

      // Process queued errors
      this._processErrorQueue();
    } catch (error) {
      logger.error('Failed to initialize monitoring:', error);
    }
  }

  /**
   * Dynamically load Sentry SDK
   * @private
   */
  async _loadSentry() {
    try {
      // In a real app, this would be: import * as Sentry from '@sentry/react'
      // For now, we create a mock that can be replaced
      if (window.__SENTRY__) {
        return window.__SENTRY__;
      }

      logger.warn('Sentry SDK not loaded. Install with: npm install @sentry/react');
      return null;
    } catch (error) {
      logger.error('Error loading Sentry:', error);
      return null;
    }
  }

  /**
   * Capture exception
   * @param {Error} error - Error to capture
   * @param {Object} context - Additional context
   */
  captureException(error, context = {}) {
    logger.error('Exception captured:', error, context);

    if (!this.isInitialized) {
      this.errorQueue.push({ error, context, type: 'exception' });
      return;
    }

    if (this.sentry) {
      this.sentry.captureException(error, {
        contexts: { additional: context }
      });
    }
  }

  /**
   * Capture message
   * @param {string} message - Message to capture
   * @param {string} level - Log level (info, warning, error)
   * @param {Object} context - Additional context
   */
  captureMessage(message, level = 'info', context = {}) {
    logger.info(`Message captured [${level}]:`, message);

    if (!this.isInitialized) {
      this.errorQueue.push({ message, level, context, type: 'message' });
      return;
    }

    if (this.sentry) {
      this.sentry.captureMessage(message, level, {
        contexts: { additional: context }
      });
    }
  }

  /**
   * Set user context
   * @param {Object} user - User object with id, email, username
   */
  setUser(user) {
    if (!this.sentry) return;

    if (user) {
      this.sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username
      });
    } else {
      this.sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb
   * @param {Object} breadcrumb - Breadcrumb object
   */
  addBreadcrumb(breadcrumb) {
    if (!this.sentry) return;

    this.sentry.addBreadcrumb({
      category: breadcrumb.category || 'custom',
      message: breadcrumb.message,
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Track page view / navigation
   * @param {string} pageName - Name of the page
   * @param {Object} params - Additional parameters
   */
  trackPageView(pageName, params = {}) {
    this.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pageName}`,
      level: 'info',
      data: params
    });

    if (this.sentry) {
      this.sentry.captureMessage(`Page view: ${pageName}`, 'info');
    }
  }

  /**
   * Track API call
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {number} status - HTTP status code
   * @param {number} duration - Request duration in ms
   */
  trackApiCall(method, url, status, duration) {
    const level = status >= 400 ? 'warning' : 'info';
    
    this.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level,
      data: { status, duration }
    });

    if (status >= 500) {
      this.captureMessage(
        `API Error: ${method} ${url}`,
        'error',
        { status, duration }
      );
    }
  }

  /**
   * Start performance monitoring for a transaction
   * @param {string} name - Transaction name
   * @returns {Object} Transaction object with finish() method
   */
  startTransaction(name) {
    if (!this.sentry) {
      return {
        finish: () => {},
        addBreadcrumb: () => {}
      };
    }

    return this.sentry.startTransaction({
      name,
      op: 'custom'
    });
  }

  /**
   * Process queued errors after Sentry initialization
   * @private
   */
  _processErrorQueue() {
    while (this.errorQueue.length > 0) {
      const { type, error, message, level, context } = this.errorQueue.shift();

      if (type === 'exception') {
        this.captureException(error, context);
      } else if (type === 'message') {
        this.captureMessage(message, level, context);
      }
    }
  }

  /**
   * Get monitoring status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasSentry: !!this.sentry,
      queuedErrors: this.errorQueue.length,
      environment: import.meta.env.VITE_ENV || 'unknown'
    };
  }
}

// Singleton instance
export const monitoring = new MonitoringManager();

/**
 * React hook for monitoring
 * @returns {Object} Monitoring methods
 */
export const useMonitoring = () => {
  return {
    captureException: (error, context) => monitoring.captureException(error, context),
    captureMessage: (message, level, context) => monitoring.captureMessage(message, level, context),
    trackPageView: (pageName, params) => monitoring.trackPageView(pageName, params),
    trackApiCall: (method, url, status, duration) => monitoring.trackApiCall(method, url, status, duration),
    setUser: (user) => monitoring.setUser(user),
    addBreadcrumb: (breadcrumb) => monitoring.addBreadcrumb(breadcrumb)
  };
};
