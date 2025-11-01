/**
 * Dark Voir AI Troubleshooter - Complete Popup Controller
 * Full-featured popup with AI integration, chat, filtering, and settings
 */

// ========================================
// USER-FRIENDLY ERROR MESSAGE TRANSLATOR
// ========================================
function getUserFriendlyMessage(technicalMessage, errorType) {
  // Convert technical messages to user-friendly ones
  const messageMappings = {
    // Form/Validation Errors
    'invalid field': 'Please check your input - some fields are not filled correctly',
    'custom_scope_name': 'Missing or invalid information in the form',
    'required': 'Please fill in all required fields',
    'validation': 'Please review the information you entered',
    'form_validation': 'Please complete all required form fields',
    
    // JavaScript Errors
    'undefined': 'A value is missing or not loaded properly',
    'null': 'Expected data is missing',
    'not defined': 'Something this page needs is missing',
    'cannot read property': 'The page tried to access something that doesn\'t exist',
    'is not a function': 'The page tried to run code that isn\'t available',
    'unexpected token': 'There\'s a problem with the page code',
    'syntax error': 'The page has a coding error',
    
    // Network Errors
    'failed to fetch': 'Could not connect to the server',
    'network error': 'Connection problem - please check your internet',
    'timeout': 'Request took too long - please try again',
    '404': 'The requested resource was not found',
    '500': 'Server error - please try again later',
    'cors': 'Security restriction prevented loading content',
    
    // Permission Errors
    'permission denied': 'Browser blocked this action for security',
    'blocked': 'This action was blocked by browser security',
    'not allowed': 'This action is not permitted',
    
    // Resource Errors
    'failed to load': 'Could not load required content',
    'not found': 'Required content is missing',
    'missing': 'Something the page needs is not available',
  };

  // Check if message contains any mapped keywords
  const lowerMessage = technicalMessage.toLowerCase();
  for (const [keyword, friendlyMsg] of Object.entries(messageMappings)) {
    if (lowerMessage.includes(keyword)) {
      return friendlyMsg;
    }
  }

  // Type-specific default messages
  const typeDefaults = {
    'error': 'An error occurred on this page',
    'warning': 'Something needs attention',
    'console': 'The page reported an issue',
    'network': 'Connection or loading problem',
    'validation': 'Please check your input'
  };

  return typeDefaults[errorType.toLowerCase()] || 'Something went wrong on this page';
}

// Get friendly category label
function getFriendlyCategory(errorType) {
  const categories = {
    'error': '⚠️ Error',
    'warning': '⚡ Warning',
    'console': '📋 Page Issue',
    'network': '🌐 Connection',
    'validation': '📝 Form Issue',
    'javascript': '⚙️ Script Issue'
  };
  return categories[errorType.toLowerCase()] || '⚠️ Issue';
}

class PopupController {
  constructor() {
    this.currentTab = 'dashboard';
    this.issues = [];
    this.fixes = [];
    this.chatHistory = [];
    this.settings = {};
    this.aiHelper = new ChromeAIHelper(); // Chrome AI Integration
    this.filters = {
      severity: 'all',
      type: 'all'
    };
    this.init();
  }

  async init() {
    console.log('[Popup] Initializing Dark Voir AI Troubleshooter...');

    // Initialize AI first
    const aiReady = await this.aiHelper.initialize();
    this.updateAIStatus(aiReady);
    this.displayAICapabilities();

    // Setup UI
    this.setupTabSwitching();
    this.setupActions();
    this.setupFilters();
    this.setupChat();
    this.setupSettings();

    // Load data
    await this.loadData();
    this.updateUI();

    console.log('[Popup] Ready!');
  }

  // ============= TAB SWITCHING =============
  setupTabSwitching() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const selectedPane = document.getElementById(tabId);
    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

    if (selectedPane) selectedPane.classList.add('active');
    if (selectedBtn) selectedBtn.classList.add('active');

    this.currentTab = tabId;
  }

  // ============= ACTION SETUP =============
  setupActions() {
    // Scan button
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.triggerScan());
    }

    // Visual guide button
    const guideBtn = document.getElementById('visual-guide-btn');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => this.activateVisualGuide());
    }

    // Self-check button
    const selfCheckBtn = document.getElementById('self-check-btn');
    if (selfCheckBtn) {
      selfCheckBtn.addEventListener('click', () => this.performSelfCheck());
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportReport());
    }

    // Generate all fixes button
    const generateAllBtn = document.getElementById('generate-all-fixes-btn');
    if (generateAllBtn) {
      generateAllBtn.addEventListener('click', () => this.generateAllFixes());
    }

    // Export fixes button
    const exportFixesBtn = document.getElementById('export-fixes-btn');
    if (exportFixesBtn) {
      exportFixesBtn.addEventListener('click', () => this.exportFixes());
    }

    // Clear issues button
    const clearBtn = document.getElementById('clear-issues-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllIssues());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // View logs button
    const viewLogsBtn = document.getElementById('view-logs-btn');
    if (viewLogsBtn) {
      viewLogsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.viewLogs();
      });
    }
  }

  // ============= FILTER SETUP =============
  setupFilters() {
    const severityFilter = document.getElementById('severity-filter');
    if (severityFilter) {
      severityFilter.addEventListener('change', (e) => {
        this.filters.severity = e.target.value;
        this.renderIssues();
      });
    }

    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.filters.type = e.target.value;
        this.renderIssues();
      });
    }
  }

  // ============= CHAT SETUP =============
  setupChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', () => this.sendChatMessage());
    }

    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });
    }

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.getAttribute('data-suggestion');
        if (chatInput) {
          chatInput.value = suggestion;
          this.sendChatMessage();
        }
      });
    });
  }

  // ============= SETTINGS SETUP =============
  setupSettings() {
    const settings = [
      'auto-generate-fixes',
      'show-ai-suggestions',
      'monitor-console',
      'monitor-network',
      'monitor-performance',
      'show-visual-guides',
      'show-notifications'
    ];

    settings.forEach(settingId => {
      const element = document.getElementById(settingId);
      if (element) {
        element.addEventListener('change', () => this.saveSettings());
      }
    });
  }

  // ============= DATA LOADING =============
  async loadData() {
    try {
      const result = await chrome.storage.local.get([
        'dark_voir_issues',
        'dark_voir_settings',
        'dark_voir_chat_history',
        'dark_voir_fixes'
      ]);

      this.issues = result.dark_voir_issues || [];
      this.fix = result.dark_voir_fixes || [];
      this.settings = result.dark_voir_settings || this.getDefaultSettings();
      this.chatHistory = result.dark_voir_chat_history || [];

      this.applySettings();
      this.renderChatHistory();
    } catch (error) {
      console.error('[Popup] Failed to load data:', error);
    }
  }

  getDefaultSettings() {
    return {
      autoGenerateFixes: true,
      showAISuggestions: true,
      monitorConsole: true,
      monitorNetwork: true,
      monitorPerformance: true,
      showVisualGuides: true,
      showNotifications: false
    };
  }

  applySettings() {
    const settingMap = {
      'auto-generate-fixes': this.settings.autoGenerateFixes,
      'show-ai-suggestions': this.settings.showAISuggestions,
      'monitor-console': this.settings.monitorConsole,
      'monitor-network': this.settings.monitorNetwork,
      'monitor-performance': this.settings.monitorPerformance,
      'show-visual-guides': this.settings.showVisualGuides,
      'show-notifications': this.settings.showNotifications
    };

    for (const [id, value] of Object.entries(settingMap)) {
      const element = document.getElementById(id);
      if (element) {
        element.checked = value !== false;
      }
    }
  }

  async saveSettings() {
    this.settings = {
      autoGenerateFixes: document.getElementById('auto-generate-fixes')?.checked,
      showAISuggestions: document.getElementById('show-ai-suggestions')?.checked,
      monitorConsole: document.getElementById('monitor-console')?.checked,
      monitorNetwork: document.getElementById('monitor-network')?.checked,
      monitorPerformance: document.getElementById('monitor-performance')?.checked,
      showVisualGuides: document.getElementById('show-visual-guides')?.checked,
      showNotifications: document.getElementById('show-notifications')?.checked
    };

    try {
      await chrome.storage.local.set({ dark_voir_settings: this.settings });
      this.showNotification('Settings saved', 'success');
    } catch (error) {
      console.error('[Popup] Failed to save settings:', error);
      this.showNotification('Failed to save settings', 'error');
    }
  }

  // ============= AI STATUS =============
  updateAIStatus(available) {
    const statusIndicator = document.getElementById('ai-status-indicator');
    const statusText = document.getElementById('ai-status-text');
    const aiCapability = document.getElementById('ai-capability');

    if (available) {
      if (statusIndicator) {
        statusIndicator.style.backgroundColor = '#4CAF50';
      }
      if (statusText) {
        statusText.textContent = 'AI Ready';
        statusText.style.color = '#4CAF50';
      }
      if (aiCapability) {
        aiCapability.textContent = '✓';
        aiCapability.style.color = '#4CAF50';
      }
    } else {
      if (statusIndicator) {
        statusIndicator.style.backgroundColor = '#F44336';
      }
      if (statusText) {
        statusText.textContent = 'AI Unavailable';
        statusText.style.color = '#F44336';
      }
      if (aiCapability) {
        aiCapability.textContent = '✗';
        aiCapability.style.color = '#F44336';
      }
    }
  }

  displayAICapabilities() {
    const capabilitiesEl = document.getElementById('api-capabilities');
    if (!capabilitiesEl) return;

    const capabilities = this.aiHelper.getCapabilities();
    const apiList = [
      { name: 'Prompt API', key: 'prompt' },
      { name: 'Writer API', key: 'writer' },
      { name: 'Rewriter API', key: 'rewriter' },
      { name: 'Summarizer API', key: 'summarizer' },
      { name: 'Translator API', key: 'translator' }
    ];

    capabilitiesEl.innerHTML = apiList.map(api => {
      const status = capabilities[api.key];
      const icon = status === 'readily' ? '✓' : '✗';
      const color = status === 'readily' ? '#4CAF50' : '#9E9E9E';
      
      return `<div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>${api.name}</span>
        <span style="color: ${color};">${icon}</span>
      </div>`;
    }).join('');
  }

  // ============= UI UPDATE =============
  updateUI() {
    this.renderIssues();
    this.renderFixes();
    this.updateStatistics();
  }

  updateStatistics() {
    const totalIssuesEl = document.getElementById('total-issues');
    const criticalIssuesEl = document.getElementById('critical-issues');
    const resolvedIssuesEl = document.getElementById('resolved-issues');

    if (totalIssuesEl) {
      totalIssuesEl.textContent = this.issues.length;
    }

    if (criticalIssuesEl) {
      const criticalCount = this.issues.filter(i => 
        i.severity === 'critical' || i.severity === 'high'
      ).length;
      criticalIssuesEl.textContent = criticalCount;
    }

    if (resolvedIssuesEl) {
      const resolvedCount = this.fixes.length;
      resolvedIssuesEl.textContent = resolvedCount;
    }
  }

  // ============= RENDER ISSUES =============
  renderIssues() {
    const container = document.getElementById('issues-list');
    if (!container) return;

    let filteredIssues = this.issues;

    // Apply filters
    if (this.filters.severity !== 'all') {
      filteredIssues = filteredIssues.filter(i => i.severity === this.filters.severity);
    }
    if (this.filters.type !== 'all') {
      filteredIssues = filteredIssues.filter(i => i.type === this.filters.type);
    }

    if (filteredIssues.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #999;">
          <p style="font-size: 16px;">✓ No issues detected</p>
          <p style="font-size: 12px;">Click "Scan Page" to check for problems</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredIssues.map((issue, index) => {
      const friendlyMessage = getUserFriendlyMessage(issue.message || '', issue.type || '');
      const category = getFriendlyCategory(issue.type || '');
      const severityColor = this.getSeverityColor(issue.severity);

      return `
        <div class="issue-card" style="
          border-left: 4px solid ${severityColor};
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 6px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #fff;">${category}</span>
            <span style="
              background: ${severityColor};
              color: white;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 10px;
              text-transform: uppercase;
            ">${issue.severity || 'medium'}</span>
          </div>
          
          <p style="color: #ccc; font-size: 13px; margin: 6px 0; line-height: 1.4;">
            ${this.escapeHtml(friendlyMessage)}
          </p>
          
          ${issue.stack ? `
            <details style="margin-top: 8px;">
              <summary style="color: #999; font-size: 11px; cursor: pointer;">Technical Details</summary>
              <pre style="
                background: rgba(0, 0, 0, 0.3);
                padding: 8px;
                border-radius: 4px;
                font-size: 10px;
                color: #ddd;
                overflow-x: auto;
                margin-top: 6px;
              ">${this.escapeHtml(issue.stack.substring(0, 200))}...</pre>
            </details>
          ` : ''}
          
          <div style="
            display: flex;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
          ">
            <button 
              onclick="popupController.getAIFix(${index})" 
              style="
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
              "
            >
              🤖 Get AI Fix
            </button>
            <button 
              onclick="popupController.copyIssue(${index})" 
              style="
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
              "
            >
              📋 Copy
            </button>
            <button 
              onclick="popupController.dismissIssue(${index})" 
              style="
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
              "
            >
              ✕ Dismiss
            </button>
          </div>
          
          <div style="color: #666; font-size: 10px; margin-top: 8px;">
            ${new Date(issue.timestamp).toLocaleString()}
          </div>
        </div>
      `;
    }).join('');
  }

  // ============= RENDER FIXES =============
  renderFixes() {
    const container = document.getElementById('fixes-list');
    if (!container) return;

    if (this.fixes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #999;">
          <p style="font-size: 16px;">No fixes generated yet</p>
          <p style="font-size: 12px;">Click "Get AI Fix" on any issue to generate a solution</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.fixes.map((fix, index) => `
      <div class="fix-card" style="
        background: rgba(255, 255, 255, 0.05);
        padding: 14px;
        margin-bottom: 12px;
        border-radius: 6px;
        border-left: 4px solid #4CAF50;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <h4 style="color: #4CAF50; margin: 0; font-size: 14px;">
            ✓ Fix #${index + 1}
          </h4>
          <span style="
            background: rgba(76, 175, 80, 0.2);
            color: #4CAF50;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 10px;
          ">
            ${(fix.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
        
        <p style="color: #ddd; font-size: 13px; margin: 8px 0; line-height: 1.5;">
          ${this.escapeHtml(fix.solution)}
        </p>
        
        ${fix.code ? `
          <div style="margin-top: 12px;">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            ">
              <span style="color: #999; font-size: 11px;">Code Example:</span>
              <button 
                onclick="popupController.copyFixCode(${index})"
                style="
                  background: rgba(255, 255, 255, 0.1);
                  color: white;
                  border: none;
                  padding: 4px 10px;
                  border-radius: 4px;
                  font-size: 10px;
                  cursor: pointer;
                "
              >
                📋 Copy Code
              </button>
            </div>
            <pre style="
              background: rgba(0, 0, 0, 0.4);
              padding: 12px;
              border-radius: 6px;
              overflow-x: auto;
              font-size: 11px;
              color: #a9b7c6;
              line-height: 1.4;
            ">${this.escapeHtml(fix.code)}</pre>
          </div>
        ` : ''}
        
        <div style="
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        ">
          <button 
            onclick="popupController.applyFix(${index})" 
            style="
              background: #4CAF50;
              color: white;
              border: none;
              padding: 6px 14px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
            "
          >
            ✓ Apply Fix
          </button>
          <button 
            onclick="popupController.copyFix(${index})" 
            style="
              background: rgba(255, 255, 255, 0.1);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 6px 14px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
            "
          >
            📋 Copy All
          </button>
        </div>
        
        <div style="color: #666; font-size: 10px; margin-top: 10px;">
          Generated: ${new Date(fix.timestamp).toLocaleString()}
        </div>
      </div>
    `).join('');
  }

  // ============= CHAT =============
  async sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    this.addChatMessage('user', message);
    input.value = '';

    // Show thinking indicator
    this.addChatMessage('assistant', 'Thinking...');

    try {
      const response = await this.aiHelper.chat(message);
      
      // Remove thinking indicator
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer && messagesContainer.lastChild) {
        messagesContainer.removeChild(messagesContainer.lastChild);
      }

      // Add AI response
      this.addChatMessage('assistant', response);

      // Save chat history
      this.chatHistory.push(
        { role: 'user', content: message, timestamp: Date.now() },
        { role: 'assistant', content: response, timestamp: Date.now() }
      );
      
      await chrome.storage.local.set({ dark_voir_chat_history: this.chatHistory });
    } catch (error) {
      console.error('[Popup] Chat error:', error);
      this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  }

  addChatMessage(role, content) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    messageDiv.style.cssText = `
      background: #000;
      color: #fff;
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 12px;
      max-width: 85%;
      ${role === 'user' ? 'margin-left: auto; background: linear-gradient(45deg, #667eea, #764ba2);' : 'background: rgba(255, 255, 255, 0.05);'}
      font-size: 13px;
      line-height: 1.5;
      word-wrap: break-word;
    `;

    // Format the content
    messageDiv.innerHTML = this.formatChatMessage(content);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  formatChatMessage(content) {
    let formatted = this.escapeHtml(content);
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; font-size: 12px;">$1</code>');
    
    // Code blocks
    formatted = formatted.replace(/``````/gs, '<pre style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; overflow-x: auto; margin: 8px 0;"><code>$1</code></pre>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  renderChatHistory() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';
    
    this.chatHistory.forEach(msg => {
      this.addChatMessage(msg.role, msg.content);
    });
  }

  // ============= ACTIONS =============
  async triggerScan() {
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
      scanBtn.textContent = '⏳ Scanning...';
      scanBtn.disabled = true;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { type: 'START_MONITORING' });
        
        // Wait and refresh data
        setTimeout(async () => {
          await this.refreshData();
          if (scanBtn) {
            scanBtn.textContent = '✓ Scan Complete';
            setTimeout(() => {
              scanBtn.textContent = '🔍 Scan Page';
              scanBtn.disabled = false;
            }, 2000);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('[Popup] Scan error:', error);
      if (scanBtn) {
        scanBtn.textContent = '✗ Scan Failed';
        setTimeout(() => {
          scanBtn.textContent = '🔍 Scan Page';
          scanBtn.disabled = false;
        }, 2000);
      }
    }
  }

  async activateVisualGuide() {
    const query = prompt('What do you need help with?\nExample: "How to submit the form" or "Where is the login button"');
    if (!query) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'ACTIVATE_VISUAL_GUIDE',
          query: query
        });
        this.showNotification('Visual guide activated!', 'success');
      }
    } catch (error) {
      console.error('[Popup] Visual guide error:', error);
      this.showNotification('Could not activate visual guide', 'error');
    }
  }

  async performSelfCheck() {
    const selfCheckBtn = document.getElementById('self-check-btn');
    if (selfCheckBtn) {
      selfCheckBtn.textContent = '⏳ Checking...';
      selfCheckBtn.disabled = true;
    }

    try {
      // Check AI availability
      const aiStatus = await this.aiHelper.checkAvailability();
      
      // Check extension permissions
      const hasPermissions = await chrome.permissions.contains({
        permissions: ['activeTab', 'storage', 'scripting'],
        origins: ['<all_urls>']
      });

      // Check storage
      const storage = await chrome.storage.local.get(null);
      const storageSize = JSON.stringify(storage).length;

      // Display results
      const results = `
Self-Check Results:
✓ Extension loaded
${aiStatus ? '✓' : '✗'} Chrome AI available
${hasPermissions ? '✓' : '✗'} Required permissions granted
✓ Storage: ${(storageSize / 1024).toFixed(2)} KB used
✓ Issues tracked: ${this.issues.length}
✓ Fixes generated: ${this.fixes.length}
      `;

      alert(results);

      if (selfCheckBtn) {
        selfCheckBtn.textContent = '✓ Check Complete';
        setTimeout(() => {
          selfCheckBtn.textContent = '🔧 Self-Check';
          selfCheckBtn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('[Popup] Self-check error:', error);
      alert('Self-check failed: ' + error.message);
      
      if (selfCheckBtn) {
        selfCheckBtn.textContent = '🔧 Self-Check';
        selfCheckBtn.disabled = false;
      }
    }
  }

  async exportReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        url: (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.url,
        issues: this.issues,
        fixes: this.fixes,
        statistics: {
          totalIssues: this.issues.length,
          criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
          fixesGenerated: this.fixes.length
        }
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dark-voir-report-${Date.now()}.json`;
      a.click();

      this.showNotification('Report exported successfully', 'success');
    } catch (error) {
      console.error('[Popup] Export error:', error);
      this.showNotification('Failed to export report', 'error');
    }
  }

  async generateAllFixes() {
    if (this.issues.length === 0) {
      this.showNotification('No issues to fix', 'info');
      return;
    }

    const generateBtn = document.getElementById('generate-all-fixes-btn');
    if (generateBtn) {
      generateBtn.textContent = '⏳ Generating...';
      generateBtn.disabled = true;
    }

    try {
      for (const [index, issue] of this.issues.entries()) {
        await this.getAIFix(index);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.showNotification(`Generated ${this.fixes.length} fixes`, 'success');
      
      if (generateBtn) {
        generateBtn.textContent = '✓ Complete';
        setTimeout(() => {
          generateBtn.textContent = '🤖 Generate All Fixes';
          generateBtn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('[Popup] Generate all fixes error:', error);
      this.showNotification('Failed to generate some fixes', 'error');
      
      if (generateBtn) {
        generateBtn.textContent = '🤖 Generate All Fixes';
        generateBtn.disabled = false;
      }
    }
  }

  async exportFixes() {
    if (this.fixes.length === 0) {
      this.showNotification('No fixes to export', 'info');
      return;
    }

    try {
      const fixesText = this.fixes.map((fix, index) => `
═══════════════════════════════════════
FIX #${index + 1} - Confidence: ${(fix.confidence * 100).toFixed(0)}%
═══════════════════════════════════════

Solution:
${fix.solution}

${fix.code ? `Code:
${fix.code}` : ''}

Generated: ${new Date(fix.timestamp).toLocaleString()}
      `).join('\n\n');

      const blob = new Blob([fixesText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dark-voir-fixes-${Date.now()}.txt`;
      a.click();

      this.showNotification('Fixes exported successfully', 'success');
    } catch (error) {
      console.error('[Popup] Export fixes error:', error);
      this.showNotification('Failed to export fixes', 'error');
    }
  }

  async clearAllIssues() {
    if (!confirm('Clear all issues and fixes? This cannot be undone.')) return;

    try {
      this.issues = [];
      this.fixes = [];
      
      await chrome.storage.local.set({
        dark_voir_issues: [],
        dark_voir_fixes: []
      });

      this.updateUI();
      this.showNotification('All issues cleared', 'success');
    } catch (error) {
      console.error('[Popup] Clear error:', error);
      this.showNotification('Failed to clear issues', 'error');
    }
  }

  async refreshData() {
    await this.loadData();
    this.updateUI();
    this.showNotification('Data refreshed', 'success');
  }

  viewLogs() {
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  }

  // ============= ISSUE ACTIONS =============
  async getAIFix(index) {
    const issue = this.issues[index];
    if (!issue) return;

    try {
      const fix = await this.aiHelper.analyzeIssue(issue);
      
      this.fixes.push({
        issueIndex: index,
        issue: issue,
        solution: fix.analysis,
        code: fix.code || '',
        confidence: fix.confidence || 0.8,
        timestamp: Date.now()
      });

      await chrome.storage.local.set({ dark_voir_fixes: this.fixes });

      this.renderFixes();
      this.updateStatistics();
      this.showNotification('Fix generated successfully', 'success');

      // Auto-switch to fixes tab
      this.switchTab('fixes');
    } catch (error) {
      console.error('[Popup] Get fix error:', error);
      this.showNotification('Failed to generate fix', 'error');
    }
  }

  copyIssue(index) {
    const issue = this.issues[index];
    if (!issue) return;

    const text = `Type: ${issue.type}
Message: ${issue.message}
Severity: ${issue.severity}
Timestamp: ${new Date(issue.timestamp).toLocaleString()}
${issue.stack ? '\nStack:\n' + issue.stack : ''}`;

    navigator.clipboard.writeText(text).then(() => {
      this.showNotification('Issue copied to clipboard', 'success');
    }).catch(error => {
      console.error('[Popup] Copy error:', error);
      this.showNotification('Failed to copy issue', 'error');
    });
  }

  dismissIssue(index) {
    if (!confirm('Dismiss this issue?')) return;

    this.issues.splice(index, 1);
    chrome.storage.local.set({ dark_voir_issues: this.issues });
    
    this.renderIssues();
    this.updateStatistics();
    this.showNotification('Issue dismissed', 'success');
  }

  // ============= FIX ACTIONS =============
  copyFixCode(index) {
    const fix = this.fixes[index];
    if (!fix || !fix.code) return;

    navigator.clipboard.writeText(fix.code).then(() => {
      this.showNotification('Code copied to clipboard', 'success');
    }).catch(error => {
      console.error('[Popup] Copy error:', error);
      this.showNotification('Failed to copy code', 'error');
    });
  }

  copyFix(index) {
    const fix = this.fixes[index];
    if (!fix) return;

    const text = `Fix #${index + 1} - Confidence: ${(fix.confidence * 100).toFixed(0)}%

Solution:
${fix.solution}

${fix.code ? 'Code:\n' + fix.code : ''}

Generated: ${new Date(fix.timestamp).toLocaleString()}`;

    navigator.clipboard.writeText(text).then(() => {
      this.showNotification('Fix copied to clipboard', 'success');
    }).catch(error => {
      console.error('[Popup] Copy error:', error);
      this.showNotification('Failed to copy fix', 'error');
    });
  }

  async applyFix(index) {
    const fix = this.fixes[index];
    if (!fix) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_FIX',
          fix: fix
        });
        this.showNotification('Fix applied to page', 'success');
      }
    } catch (error) {
      console.error('[Popup] Apply fix error:', error);
      this.showNotification('Could not apply fix automatically', 'error');
    }
  }

  // ============= UTILITIES =============
  getSeverityColor(severity) {
    const colors = {
      critical: '#F44336',
      high: '#FF5722',
      medium: '#FF9800',
      low: '#FFC107',
      info: '#2196F3'
    };
    return colors[severity] || colors.medium;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-size: 13px;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Initialize popup controller when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.popupController = new PopupController();
  });
} else {
  window.popupController = new PopupController();
}