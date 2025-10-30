/**
 * Dark Voir AI Troubleshooter - Error Handler
 * Centralized error handling and recovery system
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.errorCallbacks = [];
    this.recoveryStrategies = new Map();
    this.setupDefaultStrategies();
  }

  /**
   * Setup default recovery strategies
   * @private
   */
  setupDefaultStrategies() {
    // AI API not available
    this.registerRecoveryStrategy('AI_NOT_AVAILABLE', async (error) => {
      logger.warn('Chrome AI not available, checking status...');
      const aiStatus = await this.checkAIAvailability();
      return {
        recovered: false,
        message: 'Chrome AI features require Chrome Canary 127+ with AI enabled',
        suggestion: 'Visit chrome://flags and enable "Prompt API for Gemini Nano"',
        aiStatus
      };
    });

    // Permission denied
    this.registerRecoveryStrategy('PERMISSION_DENIED', async (error) => {
      return {
        recovered: false,
        message: 'Permission denied for this operation',
        suggestion: 'Check extension permissions in chrome://extensions'
      };
    });

    // Network error
    this.registerRecoveryStrategy('NETWORK_ERROR', async (error) => {
      return {
        recovered: false,
        message: 'Network request failed',
        suggestion: 'Check your internet connection and try again'
      };
    });

    // Element not found
    this.registerRecoveryStrategy('ELEMENT_NOT_FOUND', async (error) => {
      return {
        recovered: false,
        message: 'Could not locate the specified element',
        suggestion: 'The page structure may have changed. Try refreshing.'
      };
    });

    // Generic error
    this.registerRecoveryStrategy('GENERIC_ERROR', async (error) => {
      return {
        recovered: false,
        message: error.message || 'An unexpected error occurred',
        suggestion: 'Try reloading the extension or page'
      };
    });
  }

  /**
   * Register a recovery strategy for error type
   * @param {string} errorType - Type of error
   * @param {Function} strategy - Recovery function
   */
  registerRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Handle an error
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Recovery result
   */
  async handle(error, context = {}) {
    try {
      // Create error entry
      const errorEntry = {
        id: DarkVoirUtils.generateId(),
        timestamp: Date.now(),
        message: error.message || error,
        stack: error.stack || new Error().stack,
        type: this.categorizeError(error),
        context,
        recovered: false
      };

      // Store error
      this.errors.push(errorEntry);
      if (this.errors.length > this.maxErrors) {
        this.errors.shift();
      }

      // Log error
      logger.error(`Error handled: ${errorEntry.type}`, {
        message: errorEntry.message,
        context: errorEntry.context
      });

      // Attempt recovery
      const recoveryResult = await this.attemptRecovery(errorEntry);
      errorEntry.recovered = recoveryResult.recovered;
      errorEntry.recoveryResult = recoveryResult;

      // Notify callbacks
      this.notifyCallbacks(errorEntry);

      // Persist to storage
      await this.persistErrors();

      return recoveryResult;
    } catch (handlingError) {
      logger.error('Error in error handler:', handlingError);
      return {
        recovered: false,
        message: 'Failed to handle error',
        originalError: error
      };
    }
  }

  /**
   * Categorize error type
   * @private
   */
  categorizeError(error) {
    const message = error.message || error.toString();
    
    if (message.includes('AI') || message.includes('window.ai')) {
      return 'AI_NOT_AVAILABLE';
    }
    if (message.includes('permission')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('element') || message.includes('querySelector')) {
      return 'ELEMENT_NOT_FOUND';
    }
    
    return 'GENERIC_ERROR';
  }

  /**
   * Attempt to recover from error
   * @private
   */
  async attemptRecovery(errorEntry) {
    const strategy = this.recoveryStrategies.get(errorEntry.type);
    
    if (strategy) {
      try {
        return await strategy(errorEntry);
      } catch (recoveryError) {
        logger.error('Recovery strategy failed:', recoveryError);
        return {
          recovered: false,
          message: 'Recovery attempt failed',
          error: recoveryError.message
        };
      }
    }
    
    // Default recovery
    return {
      recovered: false,
      message: errorEntry.message,
      suggestion: 'Please try again or contact support'
    };
  }

  /**
   * Check AI availability
   * @private
   */
  async checkAIAvailability() {
    try {
      if (!window.ai) {
        return {
          available: false,
          reason: 'window.ai not found'
        };
      }

      const canCreate = await window.ai.canCreateTextSession();
      return {
        available: canCreate === 'readily' || canCreate === 'after-download',
        status: canCreate,
        needsDownload: canCreate === 'after-download'
      };
    } catch (error) {
      return {
        available: false,
        reason: error.message
      };
    }
  }

  /**
   * Register error callback
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    this.errorCallbacks.push(callback);
  }

  /**
   * Notify all callbacks of error
   * @private
   */
  notifyCallbacks(errorEntry) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorEntry);
      } catch (error) {
        logger.error('Error in callback:', error);
      }
    });
  }

  /**
   * Get all errors
   * @returns {Array} Array of error entries
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get errors by type
   * @param {string} type - Error type
   * @returns {Array} Filtered errors
   */
  getErrorsByType(type) {
    return this.errors.filter(err => err.type === type);
  }

  /**
   * Get recent errors
   * @param {number} count - Number of recent errors
   * @returns {Array} Recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('dark_voir_errors');
    }
  }

  /**
   * Persist errors to storage
   * @private
   */
  async persistErrors() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const recentErrors = this.errors.slice(-50);
        await chrome.storage.local.set({
          'dark_voir_errors': recentErrors
        });
      }
    } catch (error) {
      logger.error('Failed to persist errors:', error);
    }
  }

  /**
   * Load errors from storage
   */
  async loadErrors() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get('dark_voir_errors');
        if (result.dark_voir_errors) {
          this.errors = result.dark_voir_errors;
        }
      }
    } catch (error) {
      logger.error('Failed to load errors:', error);
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStatistics() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recovered: 0,
      unrecovered: 0,
      lastError: this.errors[this.errors.length - 1] || null
    };

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // Count recovered
      if (error.recovered) {
        stats.recovered++;
      } else {
        stats.unrecovered++;
      }
    });

    return stats;
  }

  /**
   * Export errors as JSON
   * @returns {string} JSON string
   */
  exportErrors() {
    return JSON.stringify({
      errors: this.errors,
      statistics: this.getStatistics(),
      exportedAt: Date.now()
    }, null, 2);
  }
}

// Create global error handler
const errorHandler = new ErrorHandler();

// Setup global error listeners
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error, {
      type: 'window_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, {
      type: 'unhandled_rejection',
      promise: 'Promise rejection'
    });
  });
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, errorHandler };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirErrorHandler = ErrorHandler;
  window.errorHandler = errorHandler;
}
