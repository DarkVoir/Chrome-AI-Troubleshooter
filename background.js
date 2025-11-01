/**
 * Dark Voir AI Troubleshooter - Complete Background Service Worker
 * Handles all issue tracking, AI interactions, and badge management
 */

// ============================================
// CHROME NAVIGATION EVENT LISTENERS
// ============================================

// Clear tab error and badge on navigation complete
chrome.webNavigation.onCompleted.addListener(function(details) {
  chrome.storage.local.remove("tab_error_" + details.tabId);
  chrome.action.setBadgeText({ text: "", tabId: details.tabId });
});

// Clear tab error before new navigation
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  chrome.storage.local.remove("tab_error_" + details.tabId);
  chrome.action.setBadgeText({ text: "", tabId: details.tabId });
});

// Handle navigation errors
chrome.webNavigation.onErrorOccurred.addListener(function(details) {
  chrome.action.setBadgeText({ text: "!", tabId: details.tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#F44336", tabId: details.tabId });
  chrome.storage.local.set({ ["tab_error_" + details.tabId]: details });
});

// ============================================
// MAIN BACKGROUND SERVICE WORKER CLASS
// ============================================

class AITroubleshooterBackground {
  constructor() {
    this.issues = new Map();
    this.aiSessions = new Map();
    this.tabErrorLogs = new Map();
    this.performanceMetrics = new Map();
    this.networkMonitoring = new Map();
    this.init();
  }

  // ============= INITIALIZATION =============
  init() {
    console.log('[Background] Dark Voir AI Troubleshooter initialized');

    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Initialize tab monitoring when page loads
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.initializeTabMonitoring(tabId);
      }
    });

    // Clean up closed tabs
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.issues.delete(tabId);
      this.tabErrorLogs.delete(tabId);
      this.performanceMetrics.delete(tabId);
      this.networkMonitoring.delete(tabId);
      this.cleanupAISessions();
    });

    // Handle keyboard shortcuts/commands
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Listen for alarms (background tasks)
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    console.log('[Background] Event listeners registered');
  }

  // ============= MESSAGE HANDLING =============
  async handleMessage(request, sender, sendResponse) {
    try {
      const action = request.action || request.type;
      const tabId = sender.tab?.id;

      console.log(`[Background] Message received: ${action} from tab ${tabId}`);

      switch (action) {
        // Report Issue Cases
        case 'reportIssue':
        case 'REPORT_ISSUE':
          await this.processIssue(request.issue || request.data, tabId);
          sendResponse({ success: true });
          break;

        // Update Badge
        case 'updateBadge':
          await this.updateBadge(tabId, request.count);
          sendResponse({ success: true });
          break;

        // Get Issues for Tab
        case 'getTabIssues':
        case 'GET_ISSUES':
          const issues = this.issues.get(tabId) || [];
          sendResponse({ success: true, issues });
          break;

        // Get All Issues (for popup)
        case 'getAllIssues':
          const allIssuesArray = Array.from(this.issues.values()).flat();
          sendResponse({ success: true, issues: allIssuesArray });
          break;

        // Generate AI Fix
        case 'generateFix':
        case 'GENERATE_FIX':
          const fix = await this.generateAIFix(request.issue || request.data);
          sendResponse({ success: true, fix });
          break;

        // Clear Issues
        case 'clearTabIssues':
        case 'CLEAR_ISSUES':
          this.issues.set(tabId, []);
          await this.updateBadge(tabId, 0);
          await chrome.storage.local.set({ dark_voir_issues: [] });
          sendResponse({ success: true });
          break;

        // Trigger Scan
        case 'TRIGGER_SCAN':
          await this.triggerScan(tabId || request.tabId);
          sendResponse({ success: true });
          break;

        // Start Monitoring
        case 'START_MONITORING':
          this.initializeTabMonitoring(tabId);
          sendResponse({ success: true });
          break;

        // Get Statistics
        case 'getStatistics':
        case 'GET_STATS':
          const stats = this.getStatistics();
          sendResponse({ success: true, stats });
          break;

        // Get Tab Status
        case 'getTabStatus':
          const status = {
            tabId: tabId,
            issueCount: (this.issues.get(tabId) || []).length,
            isMonitoring: true,
            lastUpdate: Date.now()
          };
          sendResponse({ success: true, status });
          break;

        // Get Performance Metrics
        case 'getPerformanceMetrics':
          const metrics = this.performanceMetrics.get(tabId) || {};
          sendResponse({ success: true, metrics });
          break;

        // Clear All Data
        case 'clearAllData':
          await this.clearAllData();
          sendResponse({ success: true });
          break;

        // Export Data
        case 'exportData':
          const exportData = this.exportData();
          sendResponse({ success: true, data: exportData });
          break;

        // Unknown action
        default:
          console.warn(`[Background] Unknown action: ${action}`);
          sendResponse({ success: false, error: 'Unknown action: ' + action });
      }
    } catch (error) {
      console.error('[Background] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // ============= ISSUE PROCESSING =============
  async processIssue(issue, tabId) {
    if (!tabId || !issue) {
      console.warn('[Background] Invalid issue or tabId');
      return;
    }

    try {
      // Initialize tab issues array if needed
      if (!this.issues.has(tabId)) {
        this.issues.set(tabId, []);
      }

      const tabIssues = this.issues.get(tabId);

      // Check for duplicate issues within last 30 seconds
      const now = Date.now();
      const isDuplicate = tabIssues.some(existing =>
        existing.type === issue.type &&
        (existing.title === issue.title || existing.message === issue.message) &&
        now - existing.timestamp < 30000
      );

      if (!isDuplicate) {
        // Create processed issue with unique ID
        const processedIssue = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...issue,
          timestamp: now,
          tabId: tabId,
          resolved: false,
          severity: issue.severity || 'medium',
          type: issue.type || 'unknown'
        };

        // Add to issues
        tabIssues.push(processedIssue);
        this.issues.set(tabId, tabIssues);

        // Update badge with issue count
        await this.updateBadge(tabId, tabIssues.length);

        // Store in chrome.storage for persistence
        try {
          // Get last 100 issues across all tabs
          const allIssues = Array.from(this.issues.values()).flat().slice(-100);
          await chrome.storage.local.set({ dark_voir_issues: allIssues });

          // Also store fixes if they exist
          const existingFixes = await chrome.storage.local.get('dark_voir_fixes');
          if (!existingFixes.dark_voir_fixes) {
            await chrome.storage.local.set({ dark_voir_fixes: [] });
          }
        } catch (storageError) {
          console.error('[Background] Storage error:', storageError);
        }

        // Log the issue
        console.log(`[Background] Issue processed: ${issue.type} for tab ${tabId}`);
      } else {
        console.log('[Background] Duplicate issue ignored');
      }
    } catch (error) {
      console.error('[Background] Error processing issue:', error);
    }
  }

  // ============= BADGE MANAGEMENT =============
  async updateBadge(tabId, count) {
    if (!tabId) {
      console.warn('[Background] Invalid tabId for badge update');
      return;
    }

    try {
      // Set badge text
      const badgeText = count > 0 ? count.toString() : '';
      await chrome.action.setBadgeText({ text: badgeText, tabId: tabId });

      // Set badge color based on issue count
      const badgeColor = this.getBadgeColor(count);
      await chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tabId });

      console.log(`[Background] Badge updated for tab ${tabId}: count=${count}, color=${badgeColor}`);
    } catch (error) {
      console.error('[Background] Badge update error:', error);
    }
  }

  getBadgeColor(count) {
    if (count === 0) return '#4CAF50';      // Green - No issues
    if (count <= 3) return '#FF9800';       // Orange - Few issues
    return '#F44336';                       // Red - Many issues
  }

  // ============= AI FIX GENERATION =============
  async generateAIFix(issue) {
    try {
      // Note: AI APIs are not directly available in service workers
      // This message indicates that AI should be called from popup context
      // The popup will handle actual AI analysis

      const fix = {
        id: `fix_${Date.now()}`,
        issueId: issue.id,
        explanation: 'Analyzing with Chrome AI...',
        steps: [],
        codeExample: '',
        relatedDocs: [],
        confidence: 0.8,
        generated: Date.now(),
        source: 'popup', // Will be generated by popup
        status: 'pending'
      };

      return fix;
    } catch (error) {
      console.error('[Background] AI fix generation error:', error);
      return {
        error: error.message,
        status: 'failed'
      };
    }
  }

  // ============= SCAN TRIGGERING =============
  async triggerScan(tabId) {
    if (!tabId) {
      console.warn('[Background] Invalid tabId for scan');
      return;
    }

    try {
      // Get tab information
      const tab = await chrome.tabs.get(tabId);

      // Don't inject into special Chrome pages
      if (!tab.url ||
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('chrome-extension://')) {
        console.log('[Background] Cannot scan special Chrome page:', tab.url);
        return;
      }

      // Send message to content script to start monitoring
      await chrome.tabs.sendMessage(tabId, { type: 'START_MONITORING' });
      console.log('[Background] Scan triggered for tab:', tabId);

    } catch (error) {
      // If content script isn't loaded, try to inject it
      if (error.message && error.message.includes('Receiving end does not exist')) {
        console.log('[Background] Content script not found, attempting injection...');
        await this.injectContentScript(tabId);
      } else {
        console.error('[Background] Scan trigger failed:', error);
      }
    }
  }

  async injectContentScript(tabId) {
    try {
      // Define scripts to inject in order
      const scripts = ['constants.js', 'utils.js', 'logger.js', 'error-handler.js', 'dom-analyzer.js', 'visual-guide.js', 'content.js'];

      for (const script of scripts) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: [script]
          });
          console.log(`[Background] Injected ${script}`);
        } catch (scriptError) {
          // Continue with next script if one fails
          console.warn(`[Background] Failed to inject ${script}:`, scriptError);
        }
      }

      // Wait for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try sending monitor message again
      await chrome.tabs.sendMessage(tabId, { type: 'START_MONITORING' });
      console.log('[Background] Scan triggered after content script injection');

    } catch (injectionError) {
      console.error('[Background] Content script injection failed:', injectionError);
    }
  }

  // ============= TAB MONITORING =============
  initializeTabMonitoring(tabId) {
    try {
      // Initialize data for this tab
      if (!this.issues.has(tabId)) {
        this.issues.set(tabId, []);
      }
      if (!this.performanceMetrics.has(tabId)) {
        this.performanceMetrics.set(tabId, {});
      }
      if (!this.networkMonitoring.has(tabId)) {
        this.networkMonitoring.set(tabId, {});
      }

      // Update badge
      this.updateBadge(tabId, 0);

      console.log('[Background] Tab monitoring initialized for tab:', tabId);
    } catch (error) {
      console.error('[Background] Error initializing tab monitoring:', error);
    }
  }

  // ============= COMMAND HANDLING =============
  async handleCommand(command) {
    try {
      console.log('[Background] Command received:', command);

      // Get active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        console.warn('[Background] No active tab found');
        return;
      }

      const activeTabId = tabs[0].id;

      switch (command) {
        case 'activate-visual-guide':
          await this.activateVisualGuideCommand(activeTabId);
          break;

        case 'quick-troubleshoot':
          await this.triggerScan(activeTabId);
          break;

        case 'show-popup':
          // Open popup (browser handles this automatically)
          break;

        default:
          console.warn('[Background] Unknown command:', command);
      }
    } catch (error) {
      console.error('[Background] Command handling error:', error);
    }
  }

  async activateVisualGuideCommand(tabId) {
    try {
      const query = 'Visual guide activated via keyboard shortcut';
      await chrome.tabs.sendMessage(tabId, {
        type: 'ACTIVATE_VISUAL_GUIDE',
        query: query
      });
      console.log('[Background] Visual guide activated for tab:', tabId);
    } catch (error) {
      console.error('[Background] Visual guide activation failed:', error);
    }
  }

  // ============= ALARM HANDLING =============
  handleAlarm(alarm) {
    console.log('[Background] Alarm triggered:', alarm.name);

    switch (alarm.name) {
      case 'cleanupOldIssues':
        this.cleanupOldIssues();
        break;

      case 'optimizeStorage':
        this.optimizeStorage();
        break;

      default:
        console.warn('[Background] Unknown alarm:', alarm.name);
    }
  }

  // ============= CLEANUP FUNCTIONS =============
  cleanupAISessions() {
    try {
      // Cleanup unused AI sessions
      const sessionKeys = Array.from(this.aiSessions.keys());
      const now = Date.now();

      sessionKeys.forEach(key => {
        const session = this.aiSessions.get(key);
        // Remove sessions older than 1 hour
        if (now - session.created > 3600000) {
          this.aiSessions.delete(key);
          console.log('[Background] Cleaned up old AI session:', key);
        }
      });

      // Keep max 10 sessions
      if (this.aiSessions.size > 10) {
        const oldestKey = sessionKeys[0];
        this.aiSessions.delete(oldestKey);
        console.log('[Background] Removed oldest session to maintain limit');
      }
    } catch (error) {
      console.error('[Background] AI session cleanup error:', error);
    }
  }

  cleanupOldIssues() {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      this.issues.forEach((tabIssues, tabId) => {
        const filteredIssues = tabIssues.filter(issue => now - issue.timestamp < maxAge);
        this.issues.set(tabId, filteredIssues);
      });

      console.log('[Background] Old issues cleaned up');
    } catch (error) {
      console.error('[Background] Cleanup error:', error);
    }
  }

  async optimizeStorage() {
    try {
      // Get current storage usage
      const storage = await chrome.storage.local.get(null);
      const storageSize = JSON.stringify(storage).length;

      console.log(`[Background] Storage size: ${(storageSize / 1024).toFixed(2)} KB`);

      // If storage is getting large, clean up old data
      if (storageSize > 5242880) { // 5MB
        console.log('[Background] Storage limit approaching, cleaning up...');
        
        // Remove issues older than 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const allIssues = storage.dark_voir_issues || [];
        const recentIssues = allIssues.filter(issue => issue.timestamp > sevenDaysAgo);

        await chrome.storage.local.set({ dark_voir_issues: recentIssues });
        console.log('[Background] Storage optimized');
      }
    } catch (error) {
      console.error('[Background] Storage optimization error:', error);
    }
  }

  // ============= DATA MANAGEMENT =============
  async clearAllData() {
    try {
      this.issues.clear();
      this.aiSessions.clear();
      this.tabErrorLogs.clear();
      this.performanceMetrics.clear();
      this.networkMonitoring.clear();

      await chrome.storage.local.clear();
      console.log('[Background] All data cleared');
    } catch (error) {
      console.error('[Background] Clear all data error:', error);
      throw error;
    }
  }

  exportData() {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        issues: Array.from(this.issues.entries()).map(([tabId, issues]) => ({
          tabId,
          issues
        })),
        statistics: this.getStatistics()
      };

      return exportData;
    } catch (error) {
      console.error('[Background] Export data error:', error);
      return null;
    }
  }

  getStatistics() {
    try {
      const allIssues = Array.from(this.issues.values()).flat();

      return {
        totalIssues: allIssues.length,
        issuesBySeverity: {
          critical: allIssues.filter(i => i.severity === 'critical').length,
          high: allIssues.filter(i => i.severity === 'high').length,
          medium: allIssues.filter(i => i.severity === 'medium').length,
          low: allIssues.filter(i => i.severity === 'low').length
        },
        issuesByType: {
          javascript: allIssues.filter(i => i.type === 'javascript').length,
          network: allIssues.filter(i => i.type === 'network').length,
          performance: allIssues.filter(i => i.type === 'performance').length,
          validation: allIssues.filter(i => i.type === 'validation').length
        },
        monitoredTabs: this.issues.size,
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('[Background] Statistics calculation error:', error);
      return null;
    }
  }
}

// ============================================
// SPOTLIGHT EFFECT HELPER
// ============================================

function spotlightElement(el, shape = "circle") {
  if (!el) return;

  // Remove existing spotlights
  document.querySelectorAll('.ai-spotlight-glow').forEach(e => e.remove());

  const rect = el.getBoundingClientRect();
  const spotlight = document.createElement('div');
  spotlight.className = 'ai-spotlight-glow';

  // Set base styles
  spotlight.style.position = 'fixed';
  spotlight.style.zIndex = '9999';
  spotlight.style.pointerEvents = 'none';

  // Set shape-specific styles
  if (shape === "circle") {
    spotlight.style.left = (rect.left + rect.width / 2 - 60) + 'px';
    spotlight.style.top = (rect.top + rect.height / 2 - 60) + 'px';
    spotlight.style.width = '120px';
    spotlight.style.height = '120px';
    spotlight.style.borderRadius = '50%';
  } else {
    spotlight.style.left = (rect.left - 8) + 'px';
    spotlight.style.top = (rect.top - 8) + 'px';
    spotlight.style.width = (rect.width + 16) + 'px';
    spotlight.style.height = (rect.height + 16) + 'px';
    spotlight.style.borderRadius = '20px';
  }

  // Set glow effects
  spotlight.style.boxShadow = "0 0 24px 8px #8B5CF6, 0 0 48px 24px #F59E42, 0 0 64px 32px #60A5FA";
  spotlight.style.background = "radial-gradient(circle, rgba(236,72,153,0.25) 40%, transparent 100%)";
  spotlight.style.transition = "box-shadow 0.3s";

  // Add pulsing animation
  spotlight.animate([
    { boxShadow: "0 0 24px 8px #8B5CF6, 0 0 48px 24px #F59E42, 0 0 64px 32px #60A5FA" },
    { boxShadow: "0 0 40px 20px #A5B4FC, 0 0 60px 28px #F9A8D4, 0 0 80px 40px #4ADE80" }
  ], {
    duration: 1500,
    direction: "alternate",
    iterations: Infinity
  });

  document.body.appendChild(spotlight);
}

// ============================================
// INITIALIZE BACKGROUND SERVICE WORKER
// ============================================

const troubleshooterBackground = new AITroubleshooterBackground();

console.log('[Dark Voir] Background service worker ready');