/**
 * Dark Voir AI Troubleshooter - DOM Analyzer
 * Advanced DOM analysis for element detection and visual guidance
 */

class DOMAnalyzer {
  constructor() {
    this.cachedElements = new Map();
    this.cacheTimeout = 5000; // 5 seconds
    this.elementAnalysisCache = new Map();
    this.pageStructureCache = null;
  }

  // ============= MAIN ANALYSIS =============

  /**
   * Analyze page and find relevant elements for user query
   * @param {string} query - User query
   * @returns {Array} Found elements with metadata
   */
  analyzeForQuery(query) {
    if (!query || typeof query !== 'string') return [];

    const intent = this.detectIntent(query);
    const keywords = this.extractKeywords(query);
    const elements = this.findRelevantElements(keywords, intent);
    
    console.log(`[DOM Analyzer] Found ${elements.length} elements for query: "${query}"`);
    
    return elements.slice(0, 10).map(el => this.getElementMetadata(el));
  }

  // ============= INTENT DETECTION =============

  /**
   * Detect user intent from query
   * @private
   */
  detectIntent(query) {
    if (!query) return 'general';

    const lowerQuery = query.toLowerCase();

    if (CONSTANTS && CONSTANTS.USER_INTENTS) {
      if (CONSTANTS.USER_INTENTS.FIND_ELEMENT?.some(phrase => lowerQuery.includes(phrase))) {
        return 'find_element';
      }
      if (CONSTANTS.USER_INTENTS.DO_ACTION?.some(phrase => lowerQuery.includes(phrase))) {
        return 'do_action';
      }
      if (CONSTANTS.USER_INTENTS.FIX_ERROR?.some(phrase => lowerQuery.includes(phrase))) {
        return 'fix_error';
      }
      if (CONSTANTS.USER_INTENTS.EXPLAIN?.some(phrase => lowerQuery.includes(phrase))) {
        return 'explain';
      }
    }

    return 'general';
  }

  // ============= KEYWORD EXTRACTION =============

  /**
   * Extract keywords from query
   * @private
   */
  extractKeywords(query) {
    if (!query) return [];

    // Remove common words and extract meaningful terms
    const commonWords = ['the', 'a', 'an', 'where', 'is', 'how', 'do', 'i', 'to', 'can', 'find', 'what', 'why', 'when', 'which', 'and', 'or', 'not', 'but', 'me', 'on', 'in', 'for', 'with', 'from', 'as', 'if'];
    const words = query.toLowerCase().split(/\s+/);
    
    return words.filter(word => !commonWords.includes(word) && word.length > 2);
  }

  // ============= ELEMENT FINDING =============

  /**
   * Find relevant elements based on keywords
   * @private
   */
  findRelevantElements(keywords, intent) {
    const elements = [];
    const processedKeywords = keywords.slice(0, 5); // Limit keywords to search

    processedKeywords.forEach(keyword => {
      try {
        // Search in buttons
        document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]').forEach(el => {
          if (this.elementMatchesKeyword(el, keyword) && this.isElementInteractive(el)) {
            elements.push(el);
          }
        });

        // Search in links
        document.querySelectorAll('a').forEach(el => {
          if (this.elementMatchesKeyword(el, keyword) && this.isElementInteractive(el)) {
            elements.push(el);
          }
        });

        // Search in form fields
        document.querySelectorAll('input, textarea, select').forEach(el => {
          if (this.elementMatchesKeyword(el, keyword) && this.isElementInteractive(el)) {
            elements.push(el);
          }
        });

        // Search by labels
        document.querySelectorAll('label').forEach(el => {
          if (this.elementMatchesKeyword(el, keyword) && this.isElementInteractive(el)) {
            elements.push(el);
          }
        });

        // Search by aria-label and aria-describedby
        document.querySelectorAll('[aria-label], [aria-describedby]').forEach(el => {
          if (this.elementMatchesKeyword(el, keyword) && this.isElementInteractive(el)) {
            elements.push(el);
          }
        });

      } catch (error) {
        console.warn('[DOM Analyzer] Error searching for keyword:', keyword, error);
      }
    });

    // Remove duplicates using Set
    const uniqueElements = [...new Set(elements)];
    
    // Sort by relevance (clickable first, then visible first)
    return uniqueElements.sort((a, b) => {
      const aClickable = this.isElementClickable(a) ? 1 : 0;
      const bClickable = this.isElementClickable(b) ? 1 : 0;
      return bClickable - aClickable;
    });
  }

  /**
   * Check if element matches keyword
   * @private
   */
  elementMatchesKeyword(element, keyword) {
    if (!element || !keyword) return false;

    try {
      const text = element.textContent?.toLowerCase() || '';
      const placeholder = element.placeholder?.toLowerCase() || '';
      const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
      const title = element.title?.toLowerCase() || '';
      const value = element.value?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      const name = element.name?.toLowerCase() || '';
      const ariaDescribedBy = element.getAttribute('aria-describedby')?.toLowerCase() || '';

      return (
        text.includes(keyword) ||
        placeholder.includes(keyword) ||
        ariaLabel.includes(keyword) ||
        title.includes(keyword) ||
        value.includes(keyword) ||
        id.includes(keyword) ||
        name.includes(keyword) ||
        ariaDescribedBy.includes(keyword)
      );
    } catch (error) {
      return false;
    }
  }

  // ============= ELEMENT VALIDATION =============

  /**
   * Check if element is interactive and visible
   * @private
   */
  isElementInteractive(element) {
    if (!element) return false;

    try {
      // Check if visible
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // Check if in viewport or close to it
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

      // Check if disabled
      if (element.hasAttribute && element.hasAttribute('disabled')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if element is clickable
   * @private
   */
  isElementClickable(element) {
    if (!element) return false;

    const clickableTags = ['a', 'button', 'input', 'select', 'textarea'];
    const clickableRoles = ['button', 'link', 'tab', 'menuitem', 'checkbox', 'radio'];

    try {
      return (
        clickableTags.includes(element.tagName.toLowerCase()) ||
        clickableRoles.includes(element.getAttribute('role')) ||
        element.onclick !== null ||
        window.getComputedStyle(element).cursor === 'pointer'
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if element is input field
   * @private
   */
  isElementInput(element) {
    if (!element) return false;

    return (
      element.tagName?.toLowerCase() === 'input' ||
      element.tagName?.toLowerCase() === 'textarea' ||
      element.contentEditable === 'true'
    );
  }

  // ============= METADATA GENERATION =============

  /**
   * Get comprehensive metadata for element
   * @param {HTMLElement} element - Element to analyze
   * @returns {Object} Element metadata
   */
  getElementMetadata(element) {
    if (!element) return null;

    try {
      const rect = element.getBoundingClientRect();

      return {
        tagName: element.tagName?.toLowerCase() || 'unknown',
        id: element.id || null,
        classes: element.className ? element.className.split(' ').filter(c => c.length > 0) : [],
        text: element.textContent?.trim().substring(0, 100) || '',
        value: element.value || null,
        placeholder: element.placeholder || null,
        ariaLabel: element.getAttribute('aria-label') || null,
        ariaDescribedBy: element.getAttribute('aria-describedby') || null,
        role: element.getAttribute('role') || null,
        type: element.type || null,
        href: element.href || null,
        name: element.name || null,
        selector: this.generateSelector(element),
        path: this.getElementPath(element),
        position: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          viewport: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        },
        attributes: this.getElementAttributes(element),
        isVisible: this.isElementInteractive(element),
        isClickable: this.isElementClickable(element),
        isInput: this.isElementInput(element),
        isDisabled: element.hasAttribute && element.hasAttribute('disabled'),
        isRequired: element.hasAttribute && element.hasAttribute('required')
      };
    } catch (error) {
      console.error('[DOM Analyzer] Error getting metadata:', error);
      return null;
    }
  }

  /**
   * Get element attributes
   * @private
   */
  getElementAttributes(element) {
    const attributes = {};
    
    try {
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          if (!attr.name.startsWith('data-')) {
            attributes[attr.name] = attr.value;
          }
        }
      }
    } catch (error) {
      // Silently fail
    }

    return attributes;
  }

  /**
   * Generate CSS selector for element
   * @param {HTMLElement} element - Element
   * @returns {string} CSS selector
   */
  generateSelector(element) {
    if (!element) return '';

    try {
      // Try ID first
      if (element.id) {
        return `#${element.id}`;
      }

      // Try data-testid
      if (element.dataset?.testid) {
        return `[data-testid="${element.dataset.testid}"]`;
      }

      // Try aria-label
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        return `[aria-label="${ariaLabel}"]`;
      }

      // Try name
      if (element.name) {
        return `[name="${element.name}"]`;
      }

      // Build path with tag and classes
      let selector = element.tagName.toLowerCase();
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).slice(0, 2);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      return selector;
    } catch (error) {
      return element.tagName?.toLowerCase() || 'unknown';
    }
  }

  /**
   * Get element path (ancestors)
   * @param {HTMLElement} element - Element
   * @returns {string} Element path
   */
  getElementPath(element) {
    const path = [];

    try {
      let current = element;
      while (current && current !== document.body && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();

        if (current.id) {
          selector += `#${current.id}`;
        } else if (current.className) {
          const classes = current.className.split(' ')[0];
          if (classes) {
            selector += `.${classes}`;
          }
        }

        path.unshift(selector);
        current = current.parentElement;
      }
    } catch (error) {
      // Silently fail
    }

    return path.join(' > ');
  }

  // ============= ELEMENT FINDING BY CRITERIA =============

  /**
   * Find element by various strategies
   * @param {Object} criteria - Search criteria
   * @returns {HTMLElement|null} Found element
   */
  findElement(criteria) {
    if (!criteria) return null;

    try {
      // Try selector first
      if (criteria.selector) {
        const el = document.querySelector(criteria.selector);
        if (el) return el;
      }

      // Try by text content (exact match)
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

      // Try by partial text
      if (criteria.partialText) {
        const elements = Array.from(document.querySelectorAll('*'));
        const el = elements.find(el =>
          el.textContent?.toLowerCase().includes(criteria.partialText.toLowerCase())
        );
        if (el) return el;
      }

      return null;
    } catch (error) {
      console.error('[DOM Analyzer] Error finding element:', error);
      return null;
    }
  }

  // ============= PAGE ANALYSIS =============

  /**
   * Get all form fields on page
   * @returns {Array} Form field metadata
   */
  getAllFormFields() {
    const fields = [];

    try {
      document.querySelectorAll('input, textarea, select').forEach(el => {
        if (this.isElementInteractive(el)) {
          fields.push(this.getElementMetadata(el));
        }
      });
    } catch (error) {
      console.error('[DOM Analyzer] Error getting form fields:', error);
    }

    return fields;
  }

  /**
   * Get all clickable elements on page
   * @returns {Array} Clickable element metadata
   */
  getAllClickableElements() {
    const clickable = [];

    try {
      document.querySelectorAll('a, button, [role="button"], [onclick]').forEach(el => {
        if (this.isElementInteractive(el)) {
          clickable.push(this.getElementMetadata(el));
        }
      });
    } catch (error) {
      console.error('[DOM Analyzer] Error getting clickable elements:', error);
    }

    return clickable;
  }

  /**
   * Get page structure for AI context
   * @returns {Object} Page structure information
   */
  getPageStructure() {
    if (this.pageStructureCache && Date.now() - this.pageStructureCache.timestamp < 5000) {
      return this.pageStructureCache.data;
    }

    try {
      const structure = {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          level: h.tagName,
          text: h.textContent?.trim()
        })).slice(0, 20),
        forms: Array.from(document.querySelectorAll('form')).length,
        links: Array.from(document.querySelectorAll('a')).length,
        buttons: Array.from(document.querySelectorAll('button')).length,
        inputs: Array.from(document.querySelectorAll('input')).length,
        textareas: Array.from(document.querySelectorAll('textarea')).length,
        selects: Array.from(document.querySelectorAll('select')).length,
        tables: Array.from(document.querySelectorAll('table')).length,
        hasLogin: this.detectLoginElements(),
        hasSearch: this.detectSearchElements(),
        hasCart: this.detectCartElements(),
        hasNavigation: this.detectNavigationElements(),
        accessibility: this.checkAccessibility()
      };

      // Cache the structure
      this.pageStructureCache = {
        data: structure,
        timestamp: Date.now()
      };

      return structure;
    } catch (error) {
      console.error('[DOM Analyzer] Error getting page structure:', error);
      return {};
    }
  }

  /**
   * Detect login elements
   * @private
   */
  detectLoginElements() {
    const keywords = ['login', 'sign in', 'signin', 'log in', 'sign-in'];
    
    try {
      return Array.from(document.querySelectorAll('*')).some(el =>
        keywords.some(keyword =>
          el.textContent?.toLowerCase().includes(keyword) ||
          el.id?.toLowerCase().includes(keyword) ||
          el.className?.toLowerCase().includes(keyword)
        )
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect search elements
   * @private
   */
  detectSearchElements() {
    try {
      return document.querySelector('input[type="search"], [role="search"], [class*="search"]') !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect cart elements
   * @private
   */
  detectCartElements() {
    const keywords = ['cart', 'basket', 'bag', 'checkout'];
    
    try {
      return Array.from(document.querySelectorAll('*')).some(el =>
        keywords.some(keyword =>
          el.textContent?.toLowerCase().includes(keyword) ||
          el.id?.toLowerCase().includes(keyword)
        )
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect navigation elements
   * @private
   */
  detectNavigationElements() {
    try {
      return document.querySelector('nav, [role="navigation"], [class*="nav"]') !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check page accessibility
   * @private
   */
  checkAccessibility() {
    try {
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
      const elementsWithAriaLabel = document.querySelectorAll('[aria-label]').length;
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      const buttons = document.querySelectorAll('button, [role="button"]').length;

      return {
        imagesWithoutAlt,
        elementsWithAriaLabel,
        headings,
        buttons,
        hasLandmarks: !!document.querySelector('main, [role="main"]')
      };
    } catch (error) {
      return {};
    }
  }

  // ============= CACHE MANAGEMENT =============

  /**
   * Clear cached elements
   */
  clearCache() {
    this.cachedElements.clear();
    this.elementAnalysisCache.clear();
    this.pageStructureCache = null;
  }
}

// ============= INITIALIZATION =============

const domAnalyzer = new DOMAnalyzer();

if (typeof window !== 'undefined') {
  window.DarkVoirDOMAnalyzer = DOMAnalyzer;
  window.domAnalyzer = domAnalyzer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMAnalyzer, domAnalyzer };
}

console.log('[DOM Analyzer] Module loaded and ready');