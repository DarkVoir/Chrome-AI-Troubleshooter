/**
 * Dark Voir AI Troubleshooter - DOM Analyzer
 * Advanced DOM analysis for element detection and visual guidance
 */

class DOMAnalyzer {
  constructor() {
    this.cachedElements = new Map();
    this.cacheTimeout = 5000; // 5 seconds
  }

  /**
   * Analyze page and find relevant elements for user query
   * @param {string} query - User query
   * @returns {Array} Found elements with metadata
   */
  analyzeForQuery(query) {
    const intent = this.detectIntent(query);
    const keywords = this.extractKeywords(query);
    const elements = this.findRelevantElements(keywords, intent);
    
    return elements.map(el => this.getElementMetadata(el));
  }

  /**
   * Detect user intent from query
   * @private
   */
  detectIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    if (CONSTANTS.USER_INTENTS.FIND_ELEMENT.some(phrase => lowerQuery.includes(phrase))) {
      return 'find_element';
    }
    if (CONSTANTS.USER_INTENTS.DO_ACTION.some(phrase => lowerQuery.includes(phrase))) {
      return 'do_action';
    }
    if (CONSTANTS.USER_INTENTS.FIX_ERROR.some(phrase => lowerQuery.includes(phrase))) {
      return 'fix_error';
    }
    if (CONSTANTS.USER_INTENTS.EXPLAIN.some(phrase => lowerQuery.includes(phrase))) {
      return 'explain';
    }
    
    return 'general';
  }

  /**
   * Extract keywords from query
   * @private
   */
  extractKeywords(query) {
    // Remove common words and extract meaningful terms
    const commonWords = ['the', 'a', 'an', 'where', 'is', 'how', 'do', 'i', 'to', 'can', 'find'];
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => !commonWords.includes(word) && word.length > 2);
  }

  /**
   * Find relevant elements based on keywords
   * @private
   */
  findRelevantElements(keywords, intent) {
    const elements = [];
    
    // Search by text content
    keywords.forEach(keyword => {
      // Buttons
      document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach(el => {
        if (this.elementMatchesKeyword(el, keyword)) {
          elements.push(el);
        }
      });
      
      // Links
      document.querySelectorAll('a').forEach(el => {
        if (this.elementMatchesKeyword(el, keyword)) {
          elements.push(el);
        }
      });
      
      // Inputs
      document.querySelectorAll('input, textarea').forEach(el => {
        if (this.elementMatchesKeyword(el, keyword)) {
          elements.push(el);
        }
      });
      
      // Any element with matching text
      const xpath = `//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${keyword}')]`;
      const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < xpathResult.snapshotLength; i++) {
        elements.push(xpathResult.snapshotItem(i));
      }
    });
    
    // Remove duplicates and hidden elements
    const uniqueElements = [...new Set(elements)];
    return uniqueElements.filter(el => this.isElementInteractive(el));
  }

  /**
   * Check if element matches keyword
   * @private
   */
  elementMatchesKeyword(element, keyword) {
    const text = element.textContent?.toLowerCase() || '';
    const placeholder = element.placeholder?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const title = element.title?.toLowerCase() || '';
    const value = element.value?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    
    return (
      text.includes(keyword) ||
      placeholder.includes(keyword) ||
      ariaLabel.includes(keyword) ||
      title.includes(keyword) ||
      value.includes(keyword) ||
      id.includes(keyword)
    );
  }

  /**
   * Check if element is interactive and visible
   * @private
   */
  isElementInteractive(element) {
    if (!element) return false;
    
    // Check if visible
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    // Check if in viewport (or reasonably close)
    const inViewport = (
      rect.top < window.innerHeight + 500 &&
      rect.bottom > -500 &&
      rect.left < window.innerWidth + 500 &&
      rect.right > -500
    );
    
    if (!inViewport) return false;
    
    // Check computed style
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    return true;
  }

  /**
   * Get comprehensive metadata for element
   * @param {HTMLElement} element - Element to analyze
   * @returns {Object} Element metadata
   */
  getElementMetadata(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      classes: element.className ? element.className.split(' ') : [],
      text: element.textContent?.trim().substring(0, 100),
      value: element.value,
      placeholder: element.placeholder,
      ariaLabel: element.getAttribute('aria-label'),
      role: element.getAttribute('role'),
      type: element.type,
      href: element.href,
      name: element.name,
      selector: DarkVoirUtils.generateSelector(element),
      position: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      },
      isVisible: this.isElementInteractive(element),
      isClickable: this.isElementClickable(element),
      isInput: this.isElementInput(element)
    };
  }

  /**
   * Check if element is clickable
   * @private
   */
  isElementClickable(element) {
    const clickableTags = ['a', 'button', 'input', 'select'];
    const clickableRoles = ['button', 'link', 'tab', 'menuitem'];
    
    return (
      clickableTags.includes(element.tagName.toLowerCase()) ||
      clickableRoles.includes(element.getAttribute('role')) ||
      element.onclick !== null ||
      window.getComputedStyle(element).cursor === 'pointer'
    );
  }

  /**
   * Check if element is input field
   * @private
   */
  isElementInput(element) {
    return (
      element.tagName.toLowerCase() === 'input' ||
      element.tagName.toLowerCase() === 'textarea' ||
      element.contentEditable === 'true'
    );
  }

  /**
   * Find element by various strategies
   * @param {Object} criteria - Search criteria
   * @returns {HTMLElement|null} Found element
   */
  findElement(criteria) {
    // Try selector first
    if (criteria.selector) {
      const el = document.querySelector(criteria.selector);
      if (el) return el;
    }
    
    // Try by text content
    if (criteria.text) {
      const elements = Array.from(document.querySelectorAll('*'));
      const el = elements.find(el => 
        el.textContent?.trim() === criteria.text ||
        el.innerText?.trim() === criteria.text
      );
      if (el) return el;
    }
    
    // Try by aria-label
    if (criteria.ariaLabel) {
      const el = document.querySelector(`[aria-label="${criteria.ariaLabel}"]`);
      if (el) return el;
    }
    
    // Try by ID
    if (criteria.id) {
      return document.getElementById(criteria.id);
    }
    
    // Try by name
    if (criteria.name) {
      return document.querySelector(`[name="${criteria.name}"]`);
    }
    
    return null;
  }

  /**
   * Get all form fields on page
   * @returns {Array} Form field metadata
   */
  getAllFormFields() {
    const fields = [];
    
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (this.isElementInteractive(el)) {
        fields.push(this.getElementMetadata(el));
      }
    });
    
    return fields;
  }

  /**
   * Get all clickable elements on page
   * @returns {Array} Clickable element metadata
   */
  getAllClickableElements() {
    const clickable = [];
    
    document.querySelectorAll('a, button, [role="button"], [onclick]').forEach(el => {
      if (this.isElementInteractive(el)) {
        clickable.push(this.getElementMetadata(el));
      }
    });
    
    return clickable;
  }

  /**
   * Get page structure for AI context
   * @returns {Object} Page structure information
   */
  getPageStructure() {
    return {
      url: window.location.href,
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
        level: h.tagName,
        text: h.textContent?.trim()
      })),
      forms: Array.from(document.querySelectorAll('form')).length,
      links: Array.from(document.querySelectorAll('a')).length,
      buttons: Array.from(document.querySelectorAll('button')).length,
      inputs: Array.from(document.querySelectorAll('input')).length,
      hasLogin: this.detectLoginElements(),
      hasSearch: this.detectSearchElements(),
      hasCart: this.detectCartElements()
    };
  }

  /**
   * Detect login elements
   * @private
   */
  detectLoginElements() {
    const keywords = ['login', 'sign in', 'signin', 'log in'];
    return Array.from(document.querySelectorAll('*')).some(el =>
      keywords.some(keyword => 
        el.textContent?.toLowerCase().includes(keyword) ||
        el.id?.toLowerCase().includes(keyword) ||
        el.className?.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Detect search elements
   * @private
   */
  detectSearchElements() {
    return document.querySelector('input[type="search"], [role="search"]') !== null;
  }

  /**
   * Detect cart elements
   * @private
   */
  detectCartElements() {
    const keywords = ['cart', 'basket', 'bag'];
    return Array.from(document.querySelectorAll('*')).some(el =>
      keywords.some(keyword => 
        el.textContent?.toLowerCase().includes(keyword) ||
        el.id?.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Get element ancestors path
   * @param {HTMLElement} element - Element to get path for
   * @returns {string} Element path
   */
  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(' ')[0]}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  /**
   * Clear cached elements
   */
  clearCache() {
    this.cachedElements.clear();
  }
}

// Create global instance
const domAnalyzer = new DOMAnalyzer();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMAnalyzer, domAnalyzer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DarkVoirDOMAnalyzer = DOMAnalyzer;
  window.domAnalyzer = domAnalyzer;
}
