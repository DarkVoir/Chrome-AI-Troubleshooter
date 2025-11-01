/**
 * Dark Voir AI Troubleshooter - Complete Content Script
 * Monitors webpage for errors, performance issues, and DOM problems
 */

// ============================================
// EXTENSION CONTEXT VALIDATION
// ============================================

let extensionValid = true;

// Check if extension context is still valid
function isExtensionValid() {
  try {
    if (typeof chrome === 'undefined' ||
        !chrome.runtime ||
        !chrome.runtime.id) {
      extensionValid = false;
      return false;
    }
    return true;
  } catch (e) {
    extensionValid = false;
    return false;
  }
}

// Safe wrapper for all chrome API calls
function safeSendMessage(message, callback) {
  if (!isExtensionValid()) {
    console.log('[Content] Extension context invalid - skipping message');
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      // Check for errors
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message;
        
        // Check if context was invalidated
        if (error.includes('Extension context invalidated')) {
          extensionValid = false;
          console.log('[Content] Extension was reloaded');
          return;
        }

        console.warn('[Content] Message error:', error);
        return;
      }

      // Execute callback if provided
      if (callback && typeof callback === 'function') {
        callback(response);
      }
    });
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      extensionValid = false;
      console.log('[Content] Extension context lost');
    } else {
      console.error('[Content] Send message error:', error);
    }
  }
}

// Detect when extension is invalidated
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Test if extension is still valid
  if (!isExtensionValid()) {
    console.log('[Content] Extension context invalidated - stopping listeners');
    return false;
  }

  // Continue processing message
  return true;
});

// ============================================
// CONTENT TROUBLESHOOTER CLASS
// ============================================

class ContentTroubleshooter {
  constructor() {
    this.issues = [];
    this.errorCount = 0;
    this.warningCount = 0;
    this.isScanning = false;
    this.performanceObserver = null;
    this.mutationObserver = null;
    this.networkEvents = [];
    this.scanInterval = null;
    this.init();
  }

  // ============= INITIALIZATION =============
  async init() {
    console.log('[Dark Voir] Content troubleshooter initializing...');
    try {
      this.setupErrorHandling();
      this.setupPerformanceMonitoring();
      this.setupDOMObserver();
      this.setupMessageListener();
      this.setupNetworkInterception();

      // Auto-scan after page load
      if (document.readyState === 'complete') {
        setTimeout(() => this.performInitialScan(), 2000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => this.performInitialScan(), 2000);
        });
      }

      console.log('[Dark Voir] Content troubleshooter initialized');
    } catch (error) {
      console.error('[Dark Voir] Init failed:', error);
    }
  }

  // ============= ERROR HANDLING =============
  setupErrorHandling() {
    // Listen for JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event);
    }, true);

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event);
    });

    // Log console errors
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      this.handleConsoleError(args);
    };

    // Log console warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.handleConsoleWarning(args);
    };
  }

  handleJavaScriptError(event) {
    this.errorCount++;
    
    const error = {
      type: 'javascript_error',
      message: event.message || 'JavaScript error occurred',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      severity: this.determineErrorSeverity(event.message),
      timestamp: Date.now(),
      url: window.location.href
    };

    this.reportIssue(error);
  }

  handlePromiseRejection(event) {
    const error = {
      type: 'javascript_error',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      severity: 'high',
      timestamp: Date.now(),
      url: window.location.href
    };

    this.reportIssue(error);
  }

  handleConsoleError(args) {
    this.errorCount++;
    
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const error = {
      type: 'console_error',
      message: message.substring(0, 200),
      severity: 'medium',
      source: 'console',
      timestamp: Date.now(),
      url: window.location.href
    };

    this.reportIssue(error);
  }

  handleConsoleWarning(args) {
    this.warningCount++;
    
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const warning = {
      type: 'console_warning',
      message: message.substring(0, 200),
      severity: 'low',
      source: 'console',
      timestamp: Date.now(),
      url: window.location.href
    };

    this.reportIssue(warning);
  }

  determineErrorSeverity(message) {
    if (!message) return 'low';
    const msg = message.toLowerCase();
    
    if (msg.includes('typeerror') || msg.includes('referenceerror') || msg.includes('syntaxerror')) {
      return 'critical';
    }
    if (msg.includes('networkerror') || msg.includes('timeout') || msg.includes('failed')) {
      return 'high';
    }
    if (msg.includes('warning') || msg.includes('deprecated')) {
      return 'low';
    }
    return 'medium';
  }

  // ============= PERFORMANCE MONITORING =============
  setupPerformanceMonitoring() {
    try {
      if (!window.PerformanceObserver) {
        console.warn('[Dark Voir] PerformanceObserver not available');
        return;
      }

      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.analyzePerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'resource']
      });

      console.log('[Dark Voir] Performance monitoring started');
    } catch (error) {
      console.error('[Dark Voir] Performance monitoring setup failed:', error);
    }
  }

  analyzePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        if (entry.renderTime > 2500) {
          this.reportIssue({
            type: 'performance_issue',
            message: `Slow page load: LCP ${entry.renderTime.toFixed(0)}ms (target: <2500ms)`,
            severity: 'medium',
            metric: 'LCP',
            value: entry.renderTime,
            timestamp: Date.now(),
            url: window.location.href
          });
        }
        break;

      case 'first-input':
        const fid = entry.processingDuration;
        if (fid > 100) {
          this.reportIssue({
            type: 'performance_issue',
            message: `Slow interaction: FID ${fid.toFixed(0)}ms (target: <100ms)`,
            severity: 'low',
            metric: 'FID',
            value: fid,
            timestamp: Date.now(),
            url: window.location.href
          });
        }
        break;

      case 'layout-shift':
        if (entry.value > 0.1 && !entry.hadRecentInput) {
          this.reportIssue({
            type: 'performance_issue',
            message: `Layout shift detected: CLS ${entry.value.toFixed(3)} (target: <0.1)`,
            severity: 'low',
            metric: 'CLS',
            value: entry.value,
            timestamp: Date.now(),
            url: window.location.href
          });
        }
        break;

      case 'resource':
        if (entry.duration > 3000) {
          this.reportIssue({
            type: 'performance_issue',
            message: `Slow resource: ${entry.name.split('/').pop().substring(0, 50)} (${entry.duration.toFixed(0)}ms)`,
            severity: 'low',
            metric: 'Resource Duration',
            value: entry.duration,
            timestamp: Date.now(),
            url: window.location.href
          });
        }
        break;

      case 'paint':
        console.log(`[Dark Voir] ${entry.name}: ${entry.startTime.toFixed(0)}ms`);
        break;
    }
  }

  // ============= DOM OBSERVER =============
  setupDOMObserver() {
    try {
      if (!document.body) {
        setTimeout(() => this.setupDOMObserver(), 100);
        return;
      }

      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              this.checkForErrorElements(node);
            }
          });
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
      });

      console.log('[Dark Voir] DOM observer started');
    } catch (error) {
      console.error('[Dark Voir] DOM observer setup failed:', error);
    }
  }

  checkForErrorElements(element) {
    const errorKeywords = ['error', 'invalid', 'required', 'failed', 'forbidden', 'unauthorized', 'not found'];
    const text = element.textContent?.toLowerCase() || '';
    const className = this.getClassNames(element).toLowerCase();
    const id = (element.id || '').toLowerCase();

    const hasError = errorKeywords.some(keyword =>
      text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
    );

    if (hasError && this.isElementVisible(element) && text.length > 0) {
      this.reportIssue({
        type: 'form_validation',
        message: `Form error detected: ${element.textContent?.substring(0, 100)}`,
        severity: 'medium',
        element: this.generateSelector(element),
        timestamp: Date.now(),
        url: window.location.href
      });
    }
  }

  getClassNames(element) {
    if (typeof element.className === 'string') {
      return element.className;
    }
    if (element.classList) {
      return Array.from(element.classList).join(' ');
    }
    return '';
  }

  isElementVisible(element) {
    try {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    } catch {
      return false;
    }
  }

  generateSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  // ============= NETWORK INTERCEPTION =============
  setupNetworkInterception() {
    try {
      // Intercept fetch requests
      const originalFetch = window.fetch;
      window.fetch = (...args) => {
        const startTime = Date.now();
        return originalFetch.apply(this, args)
          .then(response => {
            const duration = Date.now() - startTime;
            
            // Log network event
            this.networkEvents.push({
              url: args[0],
              status: response.status,
              duration: duration,
              timestamp: Date.now()
            });

            // Report slow requests
            if (duration > 5000) {
              this.reportIssue({
                type: 'network_issue',
                message: `Slow network request: ${duration}ms for ${String(args[0]).substring(0, 50)}`,
                severity: 'low',
                duration: duration,
                status: response.status,
                timestamp: Date.now(),
                url: window.location.href
              });
            }

            // Report errors
            if (!response.ok) {
              this.reportIssue({
                type: 'network_issue',
                message: `HTTP ${response.status}: ${String(args[0]).substring(0, 50)}`,
                severity: response.status >= 500 ? 'high' : 'medium',
                status: response.status,
                timestamp: Date.now(),
                url: window.location.href
              });
            }

            return response;
          })
          .catch(error => {
            const duration = Date.now() - startTime;
            
            this.reportIssue({
              type: 'network_issue',
              message: `Network error: ${error.message} for ${String(args[0]).substring(0, 50)}`,
              severity: 'high',
              error: error.message,
              duration: duration,
              timestamp: Date.now(),
              url: window.location.href
            });

            throw error;
          });
      };

      console.log('[Dark Voir] Network interception started');
    } catch (error) {
      console.error('[Dark Voir] Network interception setup failed:', error);
    }
  }

  // ============= MESSAGE HANDLING =============
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      const action = request.type || request.action;
      
      console.log(`[Dark Voir] Message received: ${action}`);

      switch (action) {
        case 'START_MONITORING':
          this.startRealTimeScanning();
          sendResponse({ success: true });
          break;

        case 'STOP_MONITORING':
          this.stopScanning();
          sendResponse({ success: true });
          break;

        case 'ACTIVATE_VISUAL_GUIDE':
          await this.activateVisualGuideMode(request.query);
          sendResponse({ success: true });
          break;

        case 'EXECUTE_VISUAL_GUIDE':
          if (typeof window.visualGuide !== 'undefined') {
            window.visualGuide.start(request.steps);
          }
          sendResponse({ success: true });
          break;

        case 'GET_ISSUES':
          sendResponse({ success: true, issues: this.issues });
          break;

        case 'GET_PAGE_CONTEXT':
          const context = this.getPageContext();
          sendResponse({ success: true, context });
          break;

        case 'APPLY_FIX':
          await this.applyFix(request.fix);
          sendResponse({ success: true });
          break;

        case 'HIGHLIGHT_ELEMENT':
          this.highlightElement(request.selector);
          sendResponse({ success: true });
          break;

        case 'PERFORM_SCAN':
          this.performFullScan();
          sendResponse({ success: true });
          break;

        default:
          console.warn(`[Dark Voir] Unknown message type: ${action}`);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Dark Voir] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // ============= VISUAL GUIDE =============
  async activateVisualGuideMode(query) {
    console.log('[Dark Voir] Visual guide activated:', query);

    // Find relevant elements
    const elements = this.findRelevantElements(query || '');
    const pageContext = this.getPageContext();

    // Request guide from background
    safeSendMessage({
      type: 'GET_VISUAL_GUIDE',
      data: {
        userQuery: query,
        pageContext,
        elements: elements.slice(0, 10)
      }
    }, (response) => {
      if (response?.success && response.guide?.length > 0) {
        if (typeof window.visualGuide !== 'undefined') {
          window.visualGuide.start(response.guide);
          console.log('[Dark Voir] Visual guide started');
        } else {
          console.warn('[Dark Voir] Visual guide not loaded');
          alert('Visual guide system not loaded. Please refresh the page.');
        }
      } else {
        console.warn('[Dark Voir] No guide generated');
        alert('Could not generate a guide for that request. Try rephrasing your question.');
      }
    });
  }

  findRelevantElements(query) {
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    const elements = [];

    // Find buttons, links, inputs
    document.querySelectorAll('button, input[type="button"], input[type="submit"], a, [role="button"]').forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
      const title = el.title?.toLowerCase() || '';

      if (keywords.some(kw => text.includes(kw) || ariaLabel.includes(kw) || title.includes(kw))) {
        elements.push({
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 50),
          ariaLabel: el.getAttribute('aria-label'),
          id: el.id,
          selector: this.generateSelector(el),
          visible: this.isElementVisible(el)
        });
      }
    });

    return elements;
  }

  getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname,
      hasLogin: !!document.querySelector('[type="password"], [name*="password"], [id*="password"]'),
      hasSearch: !!document.querySelector('[type="search"], [role="search"]'),
      forms: document.querySelectorAll('form').length,
      links: document.querySelectorAll('a').length,
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length,
      readyState: document.readyState
    };
  }

  highlightElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) return;

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const rect = element.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: fixed;
        top: ${rect.top - 4}px;
        left: ${rect.left - 4}px;
        width: ${rect.width + 8}px;
        height: ${rect.height + 8}px;
        border: 3px solid #00d9ff;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 217, 255, 0.6);
        z-index: 999999;
        pointer-events: none;
      `;

      document.body.appendChild(highlight);

      // Remove after 5 seconds
      setTimeout(() => highlight.remove(), 5000);
    } catch (error) {
      console.error('[Dark Voir] Highlight failed:', error);
    }
  }

  async applyFix(fix) {
    try {
      console.log('[Dark Voir] Attempting to apply fix:', fix);
      
      if (fix.code) {
        // Execute fix code
        const fixFunction = new Function(fix.code);
        fixFunction();
        console.log('[Dark Voir] Fix code executed');
      }

      this.reportIssue({
        type: 'fix_applied',
        message: `Applied fix: ${fix.issue?.message || 'Unknown'}`,
        severity: 'info',
        timestamp: Date.now(),
        url: window.location.href
      });
    } catch (error) {
      console.error('[Dark Voir] Fix application failed:', error);
    }
  }

  // ============= SCANNING =============
  startRealTimeScanning() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    console.log('[Dark Voir] Real-time scanning started');

    this.performFullScan();

    this.scanInterval = setInterval(() => {
      this.performFullScan();
    }, 5000);
  }

  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }

    this.isScanning = false;
    console.log('[Dark Voir] Scanning stopped');
  }

  performInitialScan() {
    console.log('[Dark Voir] Performing initial scan...');
    this.performFullScan();
  }

  performFullScan() {
    // Check for broken images
    document.querySelectorAll('img').forEach(img => {
      if (img.complete && img.naturalWidth === 0) {
        this.reportIssue({
          type: 'dom_issue',
          message: `Broken image: ${img.src.substring(0, 50)}`,
          severity: 'low',
          element: this.generateSelector(img),
          timestamp: Date.now(),
          url: window.location.href
        });
      }
    });

    // Check for invalid form fields
    document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').forEach(field => {
      this.reportIssue({
        type: 'form_validation',
        message: `Invalid form field: ${field.name || field.id || 'unnamed'}`,
        severity: 'low',
        element: this.generateSelector(field),
        timestamp: Date.now(),
        url: window.location.href
      });
    });

    // Check for missing alt text on images
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt && img.offsetParent !== null) {
        this.reportIssue({
          type: 'accessibility_issue',
          message: `Image missing alt text: ${img.src.substring(0, 50)}`,
          severity: 'low',
          element: this.generateSelector(img),
          timestamp: Date.now(),
          url: window.location.href
        });
      }
    });

    // Check for links without href
    document.querySelectorAll('a').forEach(link => {
      if (!link.href && !link.getAttribute('onclick')) {
        this.reportIssue({
          type: 'dom_issue',
          message: `Link without href: ${link.textContent.substring(0, 50)}`,
          severity: 'low',
          element: this.generateSelector(link),
          timestamp: Date.now(),
          url: window.location.href
        });
      }
    });
  }

  // ============= ISSUE REPORTING =============
  reportIssue(issue) {
    // Don't report duplicate issues within 5 seconds
    const recentDuplicate = this.issues.some(existing =>
      existing.type === issue.type &&
      existing.message === issue.message &&
      Date.now() - existing.timestamp < 5000
    );

    if (recentDuplicate) {
      return;
    }

    this.issues.push({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...issue,
      timestamp: issue.timestamp || Date.now()
    });

    // Send to background
    safeSendMessage({
      type: 'REPORT_ISSUE',
      issue: issue
    }, (response) => {
      if (response?.success) {
        console.log('[Dark Voir] Issue reported:', issue.type);
      }
    });
  }

  // ============= UTILITIES =============
  getIssues() {
    return this.issues;
  }

  getStatistics() {
    return {
      totalIssues: this.issues.length,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      isScanning: this.isScanning,
      networkEvents: this.networkEvents.length
    };
  }

  clearIssues() {
    this.issues = [];
    this.errorCount = 0;
    this.warningCount = 0;
  }
}

// ============================================
// INITIALIZE CONTENT TROUBLESHOOTER
// ============================================

const contentTroubleshooter = new ContentTroubleshooter();

// Make available globally
window.contentTroubleshooter = contentTroubleshooter;

console.log('[Dark Voir] Content script loaded and ready');

// ============================================
// PERIODIC CONTEXT VALIDATION
// ============================================

let contextCheckInterval = setInterval(() => {
  if (!isExtensionValid()) {
    console.log('[Content] Extension invalidated - cleaning up');

    // Stop the interval
    clearInterval(contextCheckInterval);

    // Stop scanning
    if (contentTroubleshooter) {
      contentTroubleshooter.stopScanning();
    }

    // Remove observers
    if (contentTroubleshooter?.performanceObserver) {
      contentTroubleshooter.performanceObserver.disconnect();
    }
    if (contentTroubleshooter?.mutationObserver) {
      contentTroubleshooter.mutationObserver.disconnect();
    }

    // Notify user
    console.log('[Content] Extension was updated or disabled. Please refresh the page to continue monitoring.');
  }
}, 5000); // Check every 5 seconds

// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================

window.addEventListener('beforeunload', () => {
  if (contentTroubleshooter) {
    contentTroubleshooter.stopScanning();
    
    if (contentTroubleshooter.performanceObserver) {
      contentTroubleshooter.performanceObserver.disconnect();
    }
    
    if (contentTroubleshooter.mutationObserver) {
      contentTroubleshooter.mutationObserver.disconnect();
    }
  }

  clearInterval(contextCheckInterval);
});