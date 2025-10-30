/**
 * Dark Voir AI Troubleshooter - Complete Background Service Worker
 * Handles all issue tracking, AI interactions, and badge management
 */

// Clear tab error and badge on navigation
chrome.webNavigation.onCompleted.addListener(function(details) {
  chrome.storage.local.remove("tab_error_" + details.tabId);
  chrome.action.setBadgeText({ text: "", tabId: details.tabId });
});

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

// Main Background Service Worker Class
class AITroubleshooterBackground {
  constructor() {
    this.issues = new Map();
    this.aiSessions = new Map();
    this.init();
  }

  init() {
    console.log('[Background] Dark Voir AI Troubleshooter initialized');
    
    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Initialize tab monitoring
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.initializeTabMonitoring(tabId);
      }
    });

    // Clean up closed tabs
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.issues.delete(tabId);
      this.cleanupAISessions();
    });

    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action || request.type) {
        case 'reportIssue':
        case 'REPORT_ISSUE':
          await this.processIssue(request.issue || request.data, sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'updateBadge':
          await this.updateBadge(sender.tab?.id, request.count);
          sendResponse({ success: true });
          break;

        case 'getTabIssues':
        case 'GET_ISSUES':
          const tabId = request.tabId || sender.tab?.id;
          const issues = this.issues.get(tabId) || [];
          sendResponse({ success: true, issues });
          break;

        case 'generateFix':
          const fix = await this.generateAIFix(request.issue);
          sendResponse({ success: true, fix });
          break;

        case 'clearTabIssues':
        case 'CLEAR_ISSUES':
          const clearTabId = request.tabId || sender.tab?.id;
          this.issues.set(clearTabId, []);
          await this.updateBadge(clearTabId, 0);
          await chrome.storage.local.set({ dark_voir_issues: [] });
          sendResponse({ success: true });
          break;

        case 'TRIGGER_SCAN':
          await this.triggerScan(request.tabId || sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'START_MONITORING':
          this.initializeTabMonitoring(sender.tab?.id);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('[Background] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async processIssue(issue, tabId) {
    if (!tabId) return;
    
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
      const processedIssue = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...issue,
        timestamp: now,
        tabId
      };
      
      tabIssues.push(processedIssue);
      this.issues.set(tabId, tabIssues);
      
      // Update badge
      await this.updateBadge(tabId, tabIssues.length);
      
      // Store in chrome.storage
      try {
        const allIssues = Array.from(this.issues.values()).flat().slice(-100);
        await chrome.storage.local.set({ dark_voir_issues: allIssues });
      } catch (error) {
        console.error('[Background] Storage error:', error);
      }
    }
  }

  async updateBadge(tabId, count) {
    if (!tabId) return;
    
    const badgeText = count > 0 ? count.toString() : '';
    const badgeColor = this.getBadgeColor(count);
    
    await chrome.action.setBadgeText({ text: badgeText, tabId });
    await chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
  }

  getBadgeColor(count) {
    if (count === 0) return '#4CAF50'; // Green
    if (count <= 3) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  async generateAIFix(issue) {
    // Note: AI APIs are not available in service workers
    // This will be handled by popup/content scripts
    // Return a message to indicate AI should be called from popup
    return {
      explanation: 'AI fix generation requires popup context',
      steps: ['Open extension popup', 'Click "Get Fix" on the issue'],
      prevention: ['Monitor console regularly', 'Use Chrome DevTools'],
      requiresPopup: true,
      generated: Date.now()
    };
  }

  async triggerScan(tabId) {
    if (!tabId) return;
    
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'START_MONITORING' });
      console.log('[Background] Scan triggered for tab:', tabId);
    } catch (error) {
      console.error('[Background] Scan trigger failed:', error);
    }
  }

  initializeTabMonitoring(tabId) {
    if (!this.issues.has(tabId)) {
      this.issues.set(tabId, []);
    }
    this.updateBadge(tabId, 0);
  }

  async handleCommand(command) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;

    switch (command) {
      case 'activate-visual-guide':
        try {
          await chrome.tabs.sendMessage(tabs[0].id, { 
            type: 'ACTIVATE_VISUAL_GUIDE' 
          });
        } catch (error) {
          console.error('[Background] Visual guide activation failed:', error);
        }
        break;

      case 'quick-troubleshoot':
        await this.triggerScan(tabs[0].id);
        break;
    }
  }

  cleanupAISessions() {
    // Cleanup unused AI sessions if any
    // Service workers can't directly use AI APIs, but we keep this for future
    const sessionKeys = Array.from(this.aiSessions.keys());
    if (sessionKeys.length > 5) {
      const oldest = sessionKeys[0];
      this.aiSessions.delete(oldest);
    }
  }
}

// Initialize the background service worker
const troubleshooterBackground = new AITroubleshooterBackground();

// Helper function for spotlight effect (used by content scripts via messaging)
function spotlightElement(el, shape = "circle") {
  if (!el) return;
  
  document.querySelectorAll('.ai-spotlight-glow').forEach(e => e.remove());
  
  const rect = el.getBoundingClientRect();
  const spotlight = document.createElement('div');
  spotlight.className = 'ai-spotlight-glow';
  spotlight.style.position = 'fixed';
  spotlight.style.zIndex = '9999';
  spotlight.style.pointerEvents = 'none';
  
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
  
  spotlight.style.boxShadow = "0 0 24px 8px #8B5CF6, 0 0 48px 24px #F59E42, 0 0 64px 32px #60A5FA";
  spotlight.style.background = "radial-gradient(circle, rgba(236,72,153,0.25) 40%, transparent 100%)";
  spotlight.style.transition = "box-shadow 0.3s";
  
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

console.log('[Dark Voir] Background service worker ready');