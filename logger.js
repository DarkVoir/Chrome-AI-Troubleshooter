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
    this.levels = {
      ERROR: { value: 0, color: '#F44336', icon: '🔴' },
      WARN: { value: 1, color: '#FFC107', icon: '⚠️' },
      INFO: { value: 2, color: '#2196F3', icon: 'ℹ️' },
      DEBUG: { value: 3, color: '#9E9E9E', icon: '🔍' }
    };
    this.currentLevel = this.levels.INFO;
  }

  /**
   * Set logging level
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
   */
  setLevel(level) {
    if (this.levels[level]) {
      this.currentLevel = this.levels[level];
    }
  }

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
   * Internal logging method
   * @private
   */
  _log(level, message, data) {
    if (!this.enabled) return;
    
    const levelInfo = this.levels[level];
    if (levelInfo.value > this.currentLevel.value) return;

    const logEntry = {
      timestamp: Date.now(),
      level,
      component: this.component,
      message,
      data: data || undefined
    };

    // Add to memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with styling
    const style = `color: ${levelInfo.color}; font-weight: bold;`;
    const prefix = `[${levelInfo.icon} ${this.component}]`;
    
    if (data) {
      console.log(`%c${prefix} ${message}`, style, data);
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }

    // Persist to storage if enabled
    this._persistLogs();
  }

  /**
   * Persist logs to Chrome storage
   * @private
   */
  async _persistLogs() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const recentLogs = this.logs.slice(-100); // Keep last 100 logs
        await chrome.storage.local.set({
          'dark_voir_logs': recentLogs
        });
      }
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

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
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('dark_voir_logs');
    }
  }

  /**
   * Export logs as JSON
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Load persisted logs from storage
   */
  async loadLogs() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get('dark_voir_logs');
        if (result.dark_voir_logs) {
          this.logs = result.dark_voir_logs;
        }
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  /**
   * Get logs for specific time range
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Array} Filtered logs
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Search logs by message content
   * @param {string} query - Search query
   * @returns {Array} Matching logs
   */
  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerQuery))
    );
  }
}

// Create global logger instances
const logger = new Logger('DarkVoir');
const contentLogger = new Logger('Content');
const backgroundLogger = new Logger('Background');
const popupLogger = new Logger('Popup');

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, logger, contentLogger, backgroundLogger, popupLogger };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirLogger = Logger;
  window.logger = logger;
}
