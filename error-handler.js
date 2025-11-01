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

  // ============= DEFAULT STRATEGIES =============

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

    // Timeout error
    this.registerRecoveryStrategy('TIMEOUT_ERROR', async (error) => {
      return {
        recovered: false,
        message: 'Operation timed out',
        suggestion: 'The operation took too long. Please try again.'
      };
    });

    // Storage error
    this.registerRecoveryStrategy('STORAGE_ERROR', async (error) => {
      return {
        recovered: false,
        message: 'Storage access error',
        suggestion: 'Check browser storage settings and try again'
      };
    });

    // Extension context error
    this.registerRecoveryStrategy('EXTENSION_CONTEXT_ERROR', async (error) => {
      return {
        recovered: false,
        message: 'Extension context was invalidated',
        suggestion: 'The extension was reloaded. Please refresh the page.'
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

    console.log('[Error Handler] Default recovery strategies loaded');
  }

  // ============= REGISTRATION =============

  /**
   * Register a recovery strategy for error type
   * @param {string} errorType - Type of error
   * @param {Function} strategy - Recovery function
   */
  registerRecoveryStrategy(errorType, strategy) {
    if (typeof strategy !== 'function') {
      console.warn('[Error Handler] Invalid strategy for', errorType);
      return;
    }
    
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Register error callback
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback);
    }
  }

  // ============= MAIN ERROR HANDLING =============

  /**
   * Handle an error
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   * @returns {Promise} Recovery result
   */
  async handle(error, context = {}) {
    try {
      // Create error entry
      const errorEntry = {
        id: DarkVoirUtils?.generateId?.() || `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        message: error?.message || String(error),
        stack: error?.stack || new Error().stack,
        type: this.categorizeError(error),
        context: context,
        recovered: false
      };

      // Store error
      this.errors.push(errorEntry);
      if (this.errors.length > this.maxErrors) {
        this.errors.shift();
      }

      // Log error
      if (logger) {
        logger.error(`Error handled: ${errorEntry.type}`, {
          message: errorEntry.message,
          context: errorEntry.context
        });
      } else {
        console.error('[Error Handler]', errorEntry.type, errorEntry.message);
      }

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
      if (logger) {
        logger.error('Error in error handler:', handlingError);
      } else {
        console.error('[Error Handler] Handling failed:', handlingError);
      }

      return {
        recovered: false,
        message: 'Failed to handle error',
        originalError: error
      };
    }
  }

  // ============= ERROR CATEGORIZATION =============

  /**
   * Categorize error type
   * @private
   */
  categorizeError(error) {
    if (!error) return 'GENERIC_ERROR';

    const message = error?.message || error.toString();
    const messageLower = message.toLowerCase();

    if (messageLower.includes('ai') || messageLower.includes('window.ai')) {
      return 'AI_NOT_AVAILABLE';
    }
    
    if (messageLower.includes('permission')) {
      return 'PERMISSION_DENIED';
    }
    
    if (messageLower.includes('network') || messageLower.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    
    if (messageLower.includes('element') || messageLower.includes('queryselector')) {
      return 'ELEMENT_NOT_FOUND';
    }
    
    if (messageLower.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    
    if (messageLower.includes('storage') || messageLower.includes('quota')) {
      return 'STORAGE_ERROR';
    }
    
    if (messageLower.includes('context') || messageLower.includes('extension')) {
      return 'EXTENSION_CONTEXT_ERROR';
    }

    return 'GENERIC_ERROR';
  }

  // ============= RECOVERY =============

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
        if (logger) {
          logger.error('Recovery strategy failed:', recoveryError);
        }
        
        return {
          recovered: false,
          message: 'Recovery attempt failed',
          error: recoveryError?.message
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

      // Try to get capabilities
      if (window.ai.languageModel?.capabilities) {
        const canCreate = await window.ai.languageModel.capabilities();
        return {
          available: canCreate.available === 'readily' || canCreate.available === 'after-download',
          status: canCreate.available,
          needsDownload: canCreate.available === 'after-download'
        };
      }

      return {
        available: false,
        reason: 'Capabilities check not available'
      };

    } catch (error) {
      return {
        available: false,
        reason: error?.message
      };
    }
  }

  // ============= CALLBACKS =============

  /**
   * Notify all callbacks of error
   * @private
   */
  notifyCallbacks(errorEntry) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorEntry);
      } catch (error) {
        if (logger) {
          logger.error('Error in error callback:', error);
        } else {
          console.error('[Error Handler] Callback error:', error);
        }
      }
    });
  }

  // ============= DATA RETRIEVAL =============

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
    return this.errors.slice(-Math.min(count, this.errors.length));
  }

  /**
   * Get errors by time range
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Array} Errors in range
   */
  getErrorsByTimeRange(startTime, endTime) {
    return this.errors.filter(err =>
      err.timestamp >= startTime && err.timestamp <= endTime
    );
  }

  /**
   * Search errors by message
   * @param {string} query - Search query
   * @returns {Array} Matching errors
   */
  searchErrors(query) {
    const lowerQuery = query?.toLowerCase() || '';
    return this.errors.filter(err =>
      err.message.toLowerCase().includes(lowerQuery) ||
      err.type.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get error count
   * @returns {number} Total error count
   */
  getErrorCount() {
    return this.errors.length;
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
      lastError: this.errors[this.errors.length - 1] || null,
      timeRange: {
        oldest: this.errors[0]?.timestamp || null,
        newest: this.errors[this.errors.length - 1]?.timestamp || null
      }
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
   * Get formatted report
   * @returns {string} Report text
   */
  getReport() {
    const stats = this.getStatistics();
    
    let report = `
═════════════════════════════════════════
Error Handler Report
═════════════════════════════════════════
Total Errors: ${stats.total}
  • Recovered: ${stats.recovered}
  • Unrecovered: ${stats.unrecovered}

By Type:
`;

    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `  • ${type}: ${count}\n`;
    });

    if (stats.lastError) {
      report += `
Last Error:
  • Type: ${stats.lastError.type}
  • Message: ${stats.lastError.message}
  • Time: ${new Date(stats.lastError.timestamp).toISOString()}
`;
    }

    report += `
═════════════════════════════════════════
`;

    return report.trim();
  }

  // ============= DATA MANAGEMENT =============

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
    
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage) {
        chrome.storage.local.remove('dark_voir_errors');
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Persist errors to storage
   * @private
   */
  async persistErrors() {
    try {
      if (typeof chrome === 'undefined' || !chrome?.storage) {
        return;
      }

      const recentErrors = this.errors.slice(-50);
      
      return new Promise((resolve) => {
        chrome.storage.local.set({ 'dark_voir_errors': recentErrors }, () => {
          if (chrome.runtime?.lastError) {
            // Silently fail
          }
          resolve();
        });
      });

    } catch (error) {
      if (logger) {
        logger.error('Failed to persist errors:', error);
      }
    }
  }

  /**
   * Load errors from storage
   * @returns {Promise} Promise when loaded
   */
  async loadErrors() {
    try {
      if (typeof chrome === 'undefined' || !chrome?.storage) {
        return;
      }

      return new Promise((resolve) => {
        chrome.storage.local.get('dark_voir_errors', (result) => {
          if (result.dark_vier_errors) {
            this.errors = result.dark_voir_errors;
          }
          resolve();
        });
      });

    } catch (error) {
      if (logger) {
        logger.error('Failed to load errors:', error);
      }
    }
  }

  // ============= EXPORT =============

  /**
   * Export errors as JSON
   * @returns {string} JSON string
   */
  exportErrors() {
    return JSON.stringify({
      errors: this.errors,
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Export errors as CSV
   * @returns {string} CSV string
   */
  exportAsCSV() {
    if (this.errors.length === 0) return 'Timestamp,Type,Message,Recovered\n';

    const headers = 'Timestamp,Type,Message,Recovered\n';
    const rows = this.errors.map(error => {
      const timestamp = new Date(error.timestamp).toISOString();
      const message = (error.message || '').replace(/"/g, '""');
      
      return `"${timestamp}","${error.type}","${message}",${error.recovered}`;
    });

    return headers + rows.join('\n');
  }

  /**
   * Export as formatted text
   * @returns {string} Formatted text
   */
  exportAsText() {
    return this.getReport() + '\n\n' + this.errors.map((error, i) => {
      return `${i + 1}. [${new Date(error.timestamp).toISOString()}] ${error.type}\n   ${error.message}`;
    }).join('\n\n');
  }
}

// ============= GLOBAL SETUP =============

// Create global error handler
const errorHandler = new ErrorHandler();

// Setup global error listeners
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error || event, {
      type: 'window_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, {
      type: 'unhandled_rejection',
      prompt: 'Promise rejection'
    });
  });
}

// ============= EXPORTS =============

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, errorHandler };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirErrorHandler = ErrorHandler;
  window.errorHandler = errorHandler;
}

console.log('[Error Handler] Dark Voir error handling system loaded');