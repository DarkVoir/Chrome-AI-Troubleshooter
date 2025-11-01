/**
 * Dark Voir AI Troubleshooter - Logger
 * Centralized logging system with levels and persistence
 */

class Logger {
  constructor(component = 'DarkVoir') {
    this.component = component;
    this.logs = [];
    this.maxLogs = 1000;
    this.enabled = true;
    this.minLogLevel = 'DEBUG'; // Can be DEBUG, INFO, WARN, ERROR
    this.levels = {
      ERROR: { value: 0, color: '#F44336', icon: '🔴', name: 'ERROR' },
      WARN: { value: 1, color: '#FFC107', icon: '⚠️', name: 'WARN' },
      INFO: { value: 2, color: '#2196F3', icon: 'ℹ️', name: 'INFO' },
      DEBUG: { value: 3, color: '#9E9E9E', icon: '🔍', name: 'DEBUG' }
    };
    this.currentLevel = this.levels.INFO;
    this.enableConsole = true;
    this.enableStorage = true;
  }

  // ============= LEVEL CONTROL =============

  /**
   * Set logging level
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
   */
  setLevel(level) {
    if (this.levels[level]) {
      this.currentLevel = this.levels[level];
      this.minLogLevel = level;
      console.log(`[${this.component}] Log level set to ${level}`);
    } else {
      console.warn(`[${this.component}] Invalid log level: ${level}`);
    }
  }

  /**
   * Enable/disable logging
   * @param {boolean} enabled - Enable or disable
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Enable/disable console output
   * @param {boolean} enabled - Enable or disable
   */
  setConsoleOutput(enabled) {
    this.enableConsole = enabled;
  }

  /**
   * Enable/disable storage persistence
   * @param {boolean} enabled - Enable or disable
   */
  setStoragePersistence(enabled) {
    this.enableStorage = enabled;
  }

  // ============= LOGGING METHODS =============

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {*} data - Additional data
   */
  error(message, data = null) {
    this._log('ERROR', message, data);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {*} data - Additional data
   */
  warn(message, data = null) {
    this._log('WARN', message, data);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {*} data - Additional data
   */
  info(message, data = null) {
    this._log('INFO', message, data);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {*} data - Additional data
   */
  debug(message, data = null) {
    this._log('DEBUG', message, data);
  }

  /**
   * Log success message
   * @param {string} message - Success message
   * @param {*} data - Additional data
   */
  success(message, data = null) {
    this._log('INFO', `✓ ${message}`, data);
  }

  /**
   * Internal logging method
   * @private
   */
  _log(level, message, data) {
    if (!this.enabled) return;

    const levelInfo = this.levels[level];
    if (!levelInfo) return;

    // Check if we should log this level
    if (levelInfo.value > this.currentLevel.value) return;

    try {
      // Create log entry
      const logEntry = {
        timestamp: Date.now(),
        iso: new Date().toISOString(),
        level: level,
        component: this.component,
        message: message,
        data: data || undefined
      };

      // Add URL context if in browser
      if (typeof window !== 'undefined') {
        logEntry.url = window.location.href;
      }

      // Add to memory
      this.logs.push(logEntry);

      // Prevent logs from growing too large
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Console output with styling
      if (this.enableConsole) {
        this._logToConsole(levelInfo, message, data);
      }

      // Persist to storage
      if (this.enableStorage) {
        this._persistLogs();
      }

    } catch (error) {
      // Prevent infinite error loops
      if (console && console.error) {
        console.error(`[${this.component}] Log error:`, error.message);
      }
    }
  }

  /**
   * Output to console with styling
   * @private
   */
  _logToConsole(levelInfo, message, data) {
    try {
      const style = `color: ${levelInfo.color}; font-weight: bold; font-size: 12px;`;
      const prefix = `[${levelInfo.icon} ${this.component}]`;

      if (data) {
        console.log(`%c${prefix} ${message}`, style, data);
      } else {
        console.log(`%c${prefix} ${message}`, style);
      }
    } catch (error) {
      // Silently fail if console is not available
    }
  }

  // ============= PERSISTENCE =============

  /**
   * Persist logs to Chrome storage
   * @private
   */
  async _persistLogs() {
    if (!this.enableStorage) return;

    try {
      // Check if extension context is available
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.runtime) {
        return;
      }

      // Check if extension is still valid
      if (!chrome.runtime.id) {
        return;
      }

      // Only persist if there are logs
      if (this.logs.length === 0) return;

      // Store logs safely with error handling
      const logsToStore = this.logs.slice(-500); // Keep only last 500
      
      return new Promise((resolve) => {
        chrome.storage.local.set(
          { 'dark_voir_logs': logsToStore },
          () => {
            if (chrome.runtime.lastError) {
              // Silently fail
            }
            resolve();
          }
        );
      });

    } catch (error) {
      // Silently fail if extension context is gone
    }
  }

  /**
   * Load persisted logs from storage
   * @returns {Promise} Promise that resolves when logs are loaded
   */
  async loadLogs() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
      }

      return new Promise((resolve) => {
        chrome.storage.local.get('dark_voir_logs', (result) => {
          if (result && result.dark_voir_logs) {
            this.logs = result.dark_voir_logs;
          }
          resolve();
        });
      });

    } catch (error) {
      console.error('[Logger] Failed to load logs:', error);
    }
  }

  // ============= DATA RETRIEVAL =============

  /**
   * Get all logs
   * @returns {Array} Array of log entries
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Get logs by level
   * @param {string} level - Log level to filter
   * @returns {Array} Filtered log entries
   */
  getLogsByLevel(level) {
    if (!this.levels[level]) return [];
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get recent logs
   * @param {number} count - Number of recent logs
   * @returns {Array} Recent log entries
   */
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  /**
   * Get logs for specific time range
   * @param {number} startTime - Start timestamp (milliseconds)
   * @param {number} endTime - End timestamp (milliseconds)
   * @returns {Array} Filtered logs
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log =>
      log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Get logs since specific time
   * @param {number} millisAgo - Milliseconds in the past
   * @returns {Array} Recent logs
   */
  getLogsSince(millisAgo) {
    const startTime = Date.now() - millisAgo;
    return this.getLogsByTimeRange(startTime, Date.now());
  }

  /**
   * Search logs by message content
   * @param {string} query - Search query
   * @param {string} level - Optional level filter
   * @returns {Array} Matching logs
   */
  searchLogs(query, level = null) {
    const lowerQuery = query.toLowerCase();
    
    let results = this.logs.filter(log => {
      const messageMatch = log.message.toLowerCase().includes(lowerQuery);
      const dataMatch = log.data && 
                       JSON.stringify(log.data).toLowerCase().includes(lowerQuery);
      return messageMatch || dataMatch;
    });

    if (level && this.levels[level]) {
      results = results.filter(log => log.level === level);
    }

    return results;
  }

  /**
   * Get logs from component
   * @param {string} component - Component name
   * @returns {Array} Logs from component
   */
  getLogsByComponent(component) {
    return this.logs.filter(log => log.component === component);
  }

  /**
   * Get error count
   * @returns {number} Number of errors
   */
  getErrorCount() {
    return this.getLogsByLevel('ERROR').length;
  }

  /**
   * Get warning count
   * @returns {number} Number of warnings
   */
  getWarningCount() {
    return this.getLogsByLevel('WARN').length;
  }

  // ============= DATA MANAGEMENT =============

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove('dark_voir_logs');
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get log statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const levelCounts = {};
    Object.keys(this.levels).forEach(level => {
      levelCounts[level] = this.getLogsByLevel(level).length;
    });

    return {
      totalLogs: this.logs.length,
      byLevel: levelCounts,
      oldestLog: this.logs[0]?.iso || null,
      newestLog: this.logs[this.logs.length - 1]?.iso || null,
      component: this.component
    };
  }

  /**
   * Export logs as JSON
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   * @returns {string} CSV string of logs
   */
  exportAsCSV() {
    if (this.logs.length === 0) return 'Timestamp,Level,Component,Message,Data\n';

    const headers = 'Timestamp,Level,Component,Message,Data\n';
    const rows = this.logs.map(log => {
      const timestamp = log.iso || new Date(log.timestamp).toISOString();
      const data = log.data ? JSON.stringify(log.data).replace(/"/g, '""') : '';
      const message = (log.message || '').replace(/"/g, '""');
      
      return `"${timestamp}","${log.level}","${log.component}","${message}","${data}"`;
    });

    return headers + rows.join('\n');
  }

  /**
   * Export logs as formatted text
   * @returns {string} Formatted text
   */
  exportAsText() {
    return this.logs.map(log => {
      const timestamp = log.iso || new Date(log.timestamp).toISOString();
      const prefix = this.levels[log.level]?.icon || '•';
      
      let text = `[${timestamp}] ${prefix} ${log.level} [${log.component}] ${log.message}`;
      
      if (log.data) {
        try {
          text += '\n  Data: ' + JSON.stringify(log.data, null, 2).split('\n').join('\n  ');
        } catch (e) {
          text += '\n  Data: ' + String(log.data);
        }
      }
      
      return text;
    }).join('\n\n');
  }

  // ============= SUMMARY & REPORTING =============

  /**
   * Get formatted summary
   * @returns {string} Summary string
   */
  getSummary() {
    const stats = this.getStatistics();
    
    return `
═══════════════════════════════════════
Logger Summary - ${this.component}
═══════════════════════════════════════
Total Logs: ${stats.totalLogs}
  • Errors: ${stats.byLevel.ERROR}
  • Warnings: ${stats.byLevel.WARN}
  • Info: ${stats.byLevel.INFO}
  • Debug: ${stats.byLevel.DEBUG}

Time Range:
  • Oldest: ${stats.oldestLog || 'N/A'}
  • Newest: ${stats.newestLog || 'N/A'}
═══════════════════════════════════════
    `.trim();
  }

  /**
   * Display logs in table format
   */
  displayTable() {
    if (this.logs.length === 0) {
      console.log(`[${this.component}] No logs to display`);
      return;
    }

    const data = this.logs.map(log => ({
      Time: new Date(log.timestamp).toLocaleTimeString(),
      Level: log.level,
      Component: log.component,
      Message: log.message,
      Data: log.data ? '...' : ''
    }));

    console.table(data);
  }

  /**
   * Display error report
   */
  displayErrorReport() {
    const errors = this.getLogsByLevel('ERROR');
    
    if (errors.length === 0) {
      console.log(`[${this.component}] No errors logged`);
      return;
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`${this.component} - Error Report (${errors.length} errors)`);
    console.log('═'.repeat(50));

    errors.forEach((error, index) => {
      console.log(`\n#${index + 1}: ${error.message}`);
      console.log(`   Time: ${error.iso}`);
      if (error.data) {
        console.log('   Data:', error.data);
      }
    });

    console.log(`\n${'═'.repeat(50)}\n`);
  }
}

// ============= GLOBAL LOGGER INSTANCES =============

const logger = new Logger('DarkVoir');
const contentLogger = new Logger('Content');
const backgroundLogger = new Logger('Background');
const popupLogger = new Logger('Popup');

// ============= EXPORTS =============

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Logger,
    logger,
    contentLogger,
    backgroundLogger,
    popupLogger
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirLogger = Logger;
  window.logger = logger;
  window.contentLogger = contentLogger;
  window.backgroundLogger = backgroundLogger;
  window.popupLogger = popupLogger;
}

console.log('[Logger] Dark Voir logging system loaded');