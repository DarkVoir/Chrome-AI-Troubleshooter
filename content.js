/**
 * Dark Voir AI Troubleshooter - Complete Content Script
 */

class ContentTroubleshooter {
  constructor() {
    this.issues = [];
    this.errorCount = 0;
    this.isScanning = false;
    this.performanceObserver = null;
    this.mutationObserver = null;
    this.init();
  }

  async init() {
    console.log('[Dark Voir] Content troubleshooter initializing...');
    
    try {
      this.setupErrorHandling();
      this.setupPerformanceMonitoring();
      this.setupDOMObserver();
      this.setupMessageListener();
      
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

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event);
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event);
    });
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
      timestamp: Date.now()
    };

    this.reportIssue(error);
  }

  handlePromiseRejection(event) {
    const error = {
      type: 'javascript_error',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      severity: 'high',
      timestamp: Date.now()
    };

    this.reportIssue(error);
  }

  determineErrorSeverity(message) {
    if (!message) return 'low';
    
    const msg = message.toLowerCase();
    if (msg.includes('typeerror') || msg.includes('referenceerror')) {
      return 'critical';
    }
    if (msg.includes('networkerror') || msg.includes('timeout')) {
      return 'high';
    }
    return 'medium';
  }

  setupPerformanceMonitoring() {
    try {
      if (!window.PerformanceObserver) return;
      
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.analyzePerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
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
            message: `Slow page load: ${entry.renderTime.toFixed(0)}ms`,
            severity: 'medium',
            data: { lcp: entry.renderTime },
            timestamp: Date.now()
          });
        }
        break;

      case 'first-input':
        const fid = entry.processingStart - entry.startTime;
        if (fid > 100) {
          this.reportIssue({
            type: 'performance_issue',
            message: `Slow interaction response: ${fid.toFixed(0)}ms`,
            severity: 'low',
            data: { fid },
            timestamp: Date.now()
          });
        }
        break;

      case 'layout-shift':
        if (entry.value > 0.1) {
          this.reportIssue({
            type: 'performance_issue',
            message: `Layout shift detected: ${entry.value.toFixed(3)}`,
            severity: 'low',
            data: { cls: entry.value },
            timestamp: Date.now()
          });
        }
        break;
    }
  }

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
        subtree: true
      });
    } catch (error) {
      console.error('[Dark Voir] DOM observer setup failed:', error);
    }
  }

  checkForErrorElements(element) {
    const errorKeywords = ['error', 'invalid', 'required', 'failed'];
    const text = element.textContent?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    
    const hasError = errorKeywords.some(keyword => 
      text.includes(keyword) || className.includes(keyword)
    );

    if (hasError && this.isElementVisible(element)) {
      this.reportIssue({
        type: 'form_validation',
        message: `Form error: ${element.textContent?.substring(0, 100)}`,
        severity: 'medium',
        element: this.generateSelector(element),
        timestamp: Date.now()
      });
    }
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
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'START_MONITORING':
          this.startRealTimeScanning();
          sendResponse({ success: true });
          break;

        case 'STOP_MONITORING':
          this.stopScanning();
          sendResponse({ success: true });
          break;

        case 'ACTIVATE_VISUAL_GUIDE':
          await this.activateVisualGuideMode();
          sendResponse({ success: true });
          break;

        case 'EXECUTE_VISUAL_GUIDE':
          if (typeof window.visualGuide !== 'undefined') {
            window.visualGuide.start(request.steps);
          }
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Dark Voir] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async activateVisualGuideMode() {
    const userQuery = prompt('What would you like help with?\n\nExamples:\n- "How do I sign in?"\n- "Where is the submit button?"\n- "Show me the search bar"');
    
    if (!userQuery) return;

    console.log('[Dark Voir] Visual guide activated:', userQuery);

    // Analyze page
    const elements = this.findRelevantElements(userQuery);
    const pageContext = this.getPageContext();

    // Request guide from background
    chrome.runtime.sendMessage({
      type: 'GET_VISUAL_GUIDE',
      data: {
        userQuery,
        pageContext,
        elements: elements.slice(0, 10)
      }
    }, (response) => {
      if (response?.success && response.guide?.length > 0) {
        if (typeof window.visualGuide !== 'undefined') {
          window.visualGuide.start(response.guide);
        } else {
          alert('Visual guide system not loaded. Please refresh the page.');
        }
      } else {
        alert('Could not generate a guide for that request. Try rephrasing your question.');
      }
    });
  }

  findRelevantElements(query) {
    const keywords = query.toLowerCase().split(/\s+/);
    const elements = [];
    
    // Find buttons
    document.querySelectorAll('button, input[type="button"], input[type="submit"], a').forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (keywords.some(kw => text.includes(kw) || ariaLabel.includes(kw))) {
        elements.push({
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 50),
          ariaLabel: el.getAttribute('aria-label'),
          id: el.id,
          selector: this.generateSelector(el)
        });
      }
    });
    
    return elements;
  }

  getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      hasLogin: !!document.querySelector('[type="password"], [name*="password"], [id*="password"]'),
      hasSearch: !!document.querySelector('[type="search"], [role="search"]'),
      forms: document.querySelectorAll('form').length,
      links: document.querySelectorAll('a').length,
      buttons: document.querySelectorAll('button').length
    };
  }

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
          timestamp: Date.now()
        });
      }
    });

    // Check for invalid form fields
    document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').forEach(field => {
      this.reportIssue({
        type: 'form_validation',
        message: `Invalid field: ${field.name || field.id || 'unnamed'}`,
        severity: 'low',
        element: this.generateSelector(field),
        timestamp: Date.now()
      });
    });
  }

  reportIssue(issue) {
    this.issues.push(issue);
    
    // Send to background
    chrome.runtime.sendMessage({
      type: 'REPORT_ISSUE',
      data: issue
    }).catch(error => {
      console.error('[Dark Voir] Failed to report issue:', error);
    });
  }

  getIssues() {
    return this.issues;
  }
}

// Initialize
const contentTroubleshooter = new ContentTroubleshooter();

// Make available globally
window.contentTroubleshooter = contentTroubleshooter;

console.log('[Dark Voir] Content script loaded');
