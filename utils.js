/**
 * Dark Voir AI Troubleshooter - Utility Functions
 * Common helper functions used across the extension
 */

const DarkVoirUtils = {
  // ============= TIMING FUNCTIONS =============

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 1000) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Sleep for specified duration
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise} Promise that resolves after duration
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise} Promise that resolves with function result
   */
  async retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.sleep(delay * Math.pow(2, i));
      }
    }
  },

  // ============= ID & HASHING =============

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Generate UUID v4
   * @returns {string} UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // ============= STRING UTILITIES =============

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Truncate string with ellipsis
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  truncate(str, maxLength = 100) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  },

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Convert camelCase to Title Case
   * @param {string} str - camelCase string
   * @returns {string} Title Case string
   */
  camelToTitle(str) {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  },

  /**
   * Convert snake_case to camelCase
   * @param {string} str - snake_case string
   * @returns {string} camelCase string
   */
  snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  },

  /**
   * Convert camelCase to snake_case
   * @param {string} str - camelCase string
   * @returns {string} snake_case string
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  },

  // ============= OBJECT/JSON UTILITIES =============

  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Check if string is valid JSON
   * @param {string} str - String to check
   * @returns {boolean} True if valid JSON
   */
  isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Parse JSON safely
   * @param {string} str - JSON string
   * @param {*} fallback - Fallback value if parsing fails
   * @returns {*} Parsed JSON or fallback
   */
  safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  },

  /**
   * Merge multiple objects
   * @param {...Object} objects - Objects to merge
   * @returns {Object} Merged object
   */
  merge(...objects) {
    return Object.assign({}, ...objects);
  },

  /**
   * Deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  },

  /**
   * Check if value is object
   * @param {*} item - Item to check
   * @returns {boolean} True if object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  },

  /**
   * Flatten nested object
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Key prefix
   * @returns {Object} Flattened object
   */
  flatten(obj, prefix = '') {
    const flattened = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (this.isObject(value)) {
        Object.assign(flattened, this.flatten(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  },

  // ============= TIME FORMATTING =============

  /**
   * Format timestamp to readable string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted time string
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  /**
   * Format date
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date string
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format duration in milliseconds to readable string
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  },

  /**
   * Get relative time (e.g., "2 hours ago")
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Relative time string
   */
  getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return this.formatDate(timestamp);
  },

  // ============= ELEMENT UTILITIES =============

  /**
   * Check if element is visible in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if visible
   */
  isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Scroll element into view smoothly
   * @param {HTMLElement} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  scrollToElement(element, options = {}) {
    if (!element) return;
    
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
      ...options
    });
  },

  /**
   * Get element position relative to viewport
   * @param {HTMLElement} element - Element to get position for
   * @returns {Object} Position object with top, left, width, height
   */
  getElementPosition(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    };
  },

  /**
   * Generate CSS selector for element
   * @param {HTMLElement} element - Element to generate selector for
   * @returns {string} CSS selector
   */
  generateSelector(element) {
    if (!element) return '';
    
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Try data-testid
    if (element.dataset.testid) {
      return `[data-testid="${element.dataset.testid}"]`;
    }
    
    // Try aria-label
    if (element.getAttribute('aria-label')) {
      return `[aria-label="${element.getAttribute('aria-label')}"]`;
    }
    
    // Try name
    if (element.name) {
      return `[name="${element.name}"]`;
    }
    
    // Build path with classes
    let path = element.tagName.toLowerCase();
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0) {
        path += '.' + classes.join('.');
      }
    }
    
    return path;
  },

  /**
   * Find element by multiple selector strategies
   * @param {string} selector - Selector string
   * @param {string} text - Optional text content to match
   * @returns {HTMLElement|null} Found element
   */
  findElement(selector, text = null) {
    try {
      // Try direct selector
      let element = document.querySelector(selector);
      if (element) return element;
      
      // Try finding by text content (exact match)
      if (text) {
        const elements = Array.from(document.querySelectorAll('*'));
        element = elements.find(el =>
          el.textContent.trim() === text ||
          el.innerText?.trim() === text
        );
        if (element) return element;
      }
      
      // Try finding by partial text
      if (text) {
        const elements = Array.from(document.querySelectorAll('*'));
        element = elements.find(el =>
          el.textContent.trim().toLowerCase().includes(text.toLowerCase()) ||
          el.innerText?.trim().toLowerCase().includes(text.toLowerCase())
        );
        if (element) return element;
      }
      
      return null;
    } catch (error) {
      console.error('[Utils] Error finding element:', error);
      return null;
    }
  },

  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that resolves with element
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  /**
   * Extract text content from element
   * @param {HTMLElement} element - Element to extract text from
   * @returns {string} Text content
   */
  getElementText(element) {
    if (!element) return '';
    return element.innerText || element.textContent || '';
  },

  // ============= PAGE CONTEXT =============

  /**
   * Get current page context
   * @returns {Object} Page context information
   */
  getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      protocol: window.location.protocol,
      path: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  },

  /**
   * Get page metadata
   * @returns {Object} Page metadata
   */
  getPageMetadata() {
    const meta = {};
    
    document.querySelectorAll('meta').forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      
      if (name && content) {
        meta[name] = content;
      }
    });
    
    return meta;
  },

  // ============= BROWSER DETECTION =============

  /**
   * Detect if user is on mobile device
   * @returns {boolean} True if mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Get Chrome version
   * @returns {number|null} Chrome version or null
   */
  getChromeVersion() {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  },

  /**
   * Check if browser is Chrome
   * @returns {boolean} True if Chrome
   */
  isChrome() {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  },

  /**
   * Check if Chrome AI is supported
   * @returns {Promise} True if supported
   */
  async checkAISupport() {
    try {
      if (!window.ai) return false;
      const canCreate = await window.ai.languageModel?.capabilities();
      return canCreate?.available === 'readily' || canCreate?.available === 'after-download';
    } catch (error) {
      return false;
    }
  },

  // ============= STORAGE UTILITIES =============

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[Utils] Storage save failed:', error);
    }
  },

  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @param {*} fallback - Fallback value
   * @returns {*} Stored value or fallback
   */
  loadFromStorage(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error('[Utils] Storage load failed:', error);
      return fallback;
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[Utils] Storage remove failed:', error);
    }
  },

  // ============= ARRAY UTILITIES =============

  /**
   * Remove duplicates from array
   * @param {Array} arr - Array to deduplicate
   * @returns {Array} Array without duplicates
   */
  removeDuplicates(arr) {
    return [...new Set(arr)];
  },

  /**
   * Chunk array into smaller arrays
   * @param {Array} arr - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Flatten nested array
   * @param {Array} arr - Array to flatten
   * @returns {Array} Flattened array
   */
  flattenArray(arr) {
    return arr.reduce((flat, item) => {
      return flat.concat(Array.isArray(item) ? this.flattenArray(item) : item);
    }, []);
  },

  /**
   * Sort array of objects by property
   * @param {Array} arr - Array to sort
   * @param {string} prop - Property to sort by
   * @param {string} order - 'asc' or 'desc'
   * @returns {Array} Sorted array
   */
  sortBy(arr, prop, order = 'asc') {
    return [...arr].sort((a, b) => {
      const aVal = a[prop];
      const bVal = b[prop];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
};

// ============= EXPORTS =============

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkVoirUtils;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirUtils = DarkVoirUtils;
}

console.log('[Utils] Dark Voir utilities loaded');