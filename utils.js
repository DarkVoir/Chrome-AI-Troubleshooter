/**
 * Dark Voir AI Troubleshooter - Utility Functions
 * Common helper functions used across the extension
 */

const Utils = {
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
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

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
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

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
   * Format duration in milliseconds to readable string
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  },

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
      right: rect.right + window.scrollX
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
      
      // Try finding by text content
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
          el.textContent.trim().includes(text) || 
          el.innerText?.trim().includes(text)
        );
        if (element) return element;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding element:', error);
      return null;
    }
  },

  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<HTMLElement>} Promise that resolves with element
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
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  },

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
   * Check if Chrome AI is supported
   * @returns {Promise<boolean>} True if supported
   */
  async checkAISupport() {
    try {
      if (!window.ai) return false;
      const canCreate = await window.ai.canCreateTextSession();
      return canCreate === 'readily' || canCreate === 'after-download';
    } catch (error) {
      return false;
    }
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
  }
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirUtils = Utils;
}
