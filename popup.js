/**
 * Dark Voir AI Troubleshooter - Complete Popup Controller
 * Full-featured popup with AI integration, chat, filtering, and settings
 */

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
        'dark_voir_chat_history'
      ]);
      
      this.issues = result.dark_voir_issues || [];
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
      return `<li style="color: ${color}">${icon} ${api.name}</li>`;
    }).join('');
  }

  // ============= UI UPDATES =============
  updateUI() {
    // Update metrics
    const errorCount = this.issues.filter(i => 
      i.severity === 'critical' || i.severity === 'high'
    ).length;
    const warningCount = this.issues.filter(i =>
      i.severity === 'medium' || i.severity === 'low'
    ).length;

    const errorCountEl = document.getElementById('error-count');
    const warningCountEl = document.getElementById('warning-count');
    const statusValueEl = document.getElementById('status-value');

    if (errorCountEl) errorCountEl.textContent = errorCount;
    if (warningCountEl) warningCountEl.textContent = warningCount;
    if (statusValueEl) {
      statusValueEl.textContent = errorCount > 0 ? 'Issues Found' : 'Good';
    }

    // Update badges
    const issuesBadge = document.getElementById('issues-badge');
    const fixesBadge = document.getElementById('fixes-badge');

    if (issuesBadge) {
      issuesBadge.textContent = this.issues.length;
      issuesBadge.style.display = this.issues.length > 0 ? 'inline' : 'none';
    }
    if (fixesBadge) {
      fixesBadge.textContent = this.fixes.length;
      fixesBadge.style.display = this.fixes.length > 0 ? 'inline' : 'none';
    }

    // Render lists
    this.renderIssues();
    this.renderRecentActivity();
    this.renderFixes();
  }

  // ============= RENDERING =============
  renderIssues() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) return;

    let filteredIssues = this.issues;

    // Apply filters
    if (this.filters.severity !== 'all') {
      filteredIssues = filteredIssues.filter(i => i.severity === this.filters.severity);
    }
    if (this.filters.type !== 'all') {
      filteredIssues = filteredIssues.filter(i => i.type === this.filters.type);
    }

    if (filteredIssues.length === 0) {
      issuesList.innerHTML = '<div class="empty-state">No issues detected</div>';
      return;
    }

    issuesList.innerHTML = filteredIssues.map(issue => `
      <div class="issue-card" data-severity="${issue.severity}">
        <div class="issue-header">
          <div class="issue-icon ${issue.severity}">${this.getIssueIcon(issue.severity)}</div>
          <div class="issue-title">${this.escapeHtml(issue.message || issue.error || 'Unknown error')}</div>
          <span class="issue-severity-badge ${issue.severity}">${issue.severity || 'medium'}</span>
        </div>
        <div class="issue-details">
          <div class="issue-meta">
            <span class="issue-type">${issue.type || 'Error'}</span>
            <span class="issue-time">${this.formatTime(issue.timestamp)}</span>
          </div>
          ${issue.url ? `<div class="issue-url">${this.escapeHtml(issue.url)}</div>` : ''}
          ${issue.stack ? `<details class="issue-stack">
            <summary>Stack Trace</summary>
            <pre>${this.escapeHtml(issue.stack)}</pre>
          </details>` : ''}
        </div>
        <div class="issue-actions">
          <button class="btn-fix" data-issue-id="${issue.id}">
            <span>🔧</span> Get AI Fix
          </button>
          <button class="btn-dismiss" data-issue-id="${issue.id}">
            <span>✗</span> Dismiss
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.btn-fix').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const issueId = e.currentTarget.getAttribute('data-issue-id');
        this.generateFix(issueId);
      });
    });

    document.querySelectorAll('.btn-dismiss').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const issueId = e.currentTarget.getAttribute('data-issue-id');
        this.dismissIssue(issueId);
      });
    });
  }

  renderRecentActivity() {
    const activityEl = document.getElementById('recent-activity');
    if (!activityEl) return;

    if (this.issues.length === 0) {
      activityEl.innerHTML = '<div class="empty-state">No recent activity</div>';
      return;
    }

    const recent = this.issues.slice(-5).reverse();
    activityEl.innerHTML = recent.map(issue => `
      <div class="activity-item">
        <div class="activity-icon ${issue.severity}">${this.getIssueIcon(issue.severity)}</div>
        <div class="activity-content">
          <div class="activity-title">${this.escapeHtml(issue.message || issue.error)}</div>
          <div class="activity-meta">
            <span>${issue.type || 'Error'}</span>
            <span>•</span>
            <span>${this.formatTime(issue.timestamp)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderFixes() {
    const fixesList = document.getElementById('fixes-list');
    if (!fixesList) return;

    if (this.fixes.length === 0) {
      fixesList.innerHTML = `
        <div class="empty-state">
          <p>No fixes generated yet</p>
          <p class="empty-state-help">Click "Get AI Fix" on any issue to generate a solution</p>
        </div>
      `;
      return;
    }

    fixesList.innerHTML = this.fixes.map(fix => `
      <div class="fix-card">
        <div class="fix-header">
          <h4>Fix for Issue #${fix.issueId.substr(-6)}</h4>
          <div class="fix-meta">
            <span class="fix-confidence">${(fix.confidence * 100).toFixed(0)}% confidence</span>
            <span class="fix-source">${fix.source || 'Chrome Built-in AI'}</span>
          </div>
        </div>
        <div class="fix-content">
          <div class="fix-analysis">
            ${this.formatMarkdown(fix.analysis || fix.description || 'No analysis available')}
          </div>
          ${fix.steps && fix.steps.length > 0 ? `
            <div class="fix-steps">
              <h5>Fix Steps:</h5>
              <ol>
                ${fix.steps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
          ${fix.code ? `
            <div class="fix-code">
              <h5>Code Example:</h5>
              <pre><code>${this.escapeHtml(fix.code)}</code></pre>
              <button class="btn-copy" data-code="${this.escapeHtml(fix.code)}">
                <span>📋</span> Copy Code
              </button>
            </div>
          ` : ''}
        </div>
        <div class="fix-actions">
          <button class="btn-apply" data-fix-id="${fix.id}">
            <span>✓</span> Mark as Applied
          </button>
        </div>
      </div>
    `).join('');

    // Add copy code event listeners
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = e.currentTarget.getAttribute('data-code');
        navigator.clipboard.writeText(code);
        this.showNotification('Code copied to clipboard', 'success');
      });
    });
  }

  renderChatHistory() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    if (this.chatHistory.length === 0) {
      chatMessages.innerHTML = `
        <div class="chat-welcome">
          <h3>👋 Hi! I'm Dark Voir AI</h3>
          <p>Ask me anything about the issues on this page, or get help troubleshooting web problems.</p>
        </div>
      `;
      return;
    }

    chatMessages.innerHTML = this.chatHistory.map(msg => `
      <div class="chat-message ${msg.role}">
        <div class="chat-message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
        <div class="chat-message-content">
          ${this.formatMarkdown(msg.content)}
        </div>
      </div>
    `).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ============= AI INTERACTIONS =============
  async generateFix(issueId) {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) return;

    const fixBtn = document.querySelector(`[data-issue-id="${issueId}"]`);
    if (fixBtn) {
      fixBtn.textContent = '⏳ Generating...';
      fixBtn.disabled = true;
    }

    try {
      // Use AI helper to analyze issue
      const result = await this.aiHelper.analyzeIssue(issue);

      const fix = {
        id: Date.now() + '_fix_' + Math.random().toString(36).substr(2, 9),
        issueId: issueId,
        analysis: result.analysis,
        description: result.fix,
        steps: result.steps || [],
        code: result.code || '',
        confidence: result.confidence || 0.85,
        source: result.source || 'Chrome Built-in AI',
        timestamp: Date.now()
      };

      this.fixes.push(fix);
      await this.saveFixes();
      this.renderFixes();

      // Switch to fixes tab
      this.switchTab('fixes');

      this.showNotification('Fix generated successfully!', 'success');
    } catch (error) {
      console.error('[Popup] Fix generation failed:', error);
      this.showNotification('Failed to generate fix', 'error');
    } finally {
      if (fixBtn) {
        fixBtn.innerHTML = '<span>🔧</span> Get AI Fix';
        fixBtn.disabled = false;
      }
    }
  }

  async generateAllFixes() {
    if (this.issues.length === 0) {
      this.showNotification('No issues to fix', 'info');
      return;
    }

    const unfixedIssues = this.issues.filter(issue =>
      !this.fixes.some(fix => fix.issueId === issue.id)
    );

    if (unfixedIssues.length === 0) {
      this.showNotification('All issues already have fixes', 'info');
      return;
    }

    this.showNotification(`Generating ${unfixedIssues.length} fixes...`, 'info');

    for (const issue of unfixedIssues) {
      await this.generateFix(issue.id);
      // Small delay to avoid overwhelming the AI
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.showNotification('All fixes generated!', 'success');
  }

  async sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput || !chatInput.value.trim()) return;

    const message = chatInput.value.trim();
    chatInput.value = '';

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    this.renderChatHistory();

    try {
      // Build context from issues
      let context = '';
      if (this.issues.length > 0) {
        context = `Current issues on the page:\n${this.issues.slice(0, 5).map(i =>
          `- ${i.type}: ${i.message}`
        ).join('\n')}\n\n`;
      }

      const fullPrompt = context + `User: ${message}\n\nProvide a helpful, concise response (under 200 words):`;

      let response;
      if (this.aiHelper.sessions.prompt) {
        response = await this.aiHelper.sessions.prompt.prompt(fullPrompt);
      } else {
        response = "I'm sorry, Chrome Built-in AI is not available. Please enable it in chrome://flags/#prompt-api-for-gemini-nano";
      }

      // Add AI response to history
      this.chatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      await this.saveChatHistory();
      this.renderChatHistory();
    } catch (error) {
      console.error('[Popup] Chat error:', error);
      this.chatHistory.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      });
      this.renderChatHistory();
    }
  }

  // ============= ACTIONS =============
  async triggerScan() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.runtime.sendMessage({ type: 'TRIGGER_SCAN', tabId: tabs[0].id });
        this.showNotification('Page scan started', 'success');
        
        // Refresh data after a short delay
        setTimeout(() => this.refreshData(), 2000);
      }
    } catch (error) {
      console.error('[Popup] Scan trigger failed:', error);
      this.showNotification('Scan failed', 'error');
    }
  }

  async activateVisualGuide() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, { type: 'ACTIVATE_VISUAL_GUIDE' });
        this.showNotification('Visual guide activated', 'success');
      }
    } catch (error) {
      console.error('[Popup] Visual guide failed:', error);
      this.showNotification('Visual guide not available on this page', 'error');
    }
  }

  async performSelfCheck() {
    this.showNotification('Running self-check...', 'info');
    
    // Check AI capabilities
    const capabilities = this.aiHelper.getCapabilities();
    const aiWorking = capabilities.isReady;
    
    // Check storage
    let storageWorking = false;
    try {
      await chrome.storage.local.set({ test: 'test' });
      await chrome.storage.local.remove('test');
      storageWorking = true;
    } catch (error) {
      storageWorking = false;
    }

    // Check messaging
    let messagingWorking = false;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      messagingWorking = tabs.length > 0;
    } catch (error) {
      messagingWorking = false;
    }

    const results = `
Self-Check Results:
✓ Extension loaded
${aiWorking ? '✓' : '✗'} Chrome AI available
${storageWorking ? '✓' : '✗'} Storage working
${messagingWorking ? '✓' : '✗'} Messaging working
    `.trim();

    alert(results);
  }

  async clearAllIssues() {
    if (!confirm('Clear all issues? This cannot be undone.')) {
      return;
    }

    this.issues = [];
    this.fixes = [];
    
    try {
      await chrome.storage.local.set({
        dark_voir_issues: [],
        dark_voir_fixes: []
      });
      await chrome.runtime.sendMessage({ type: 'CLEAR_ISSUES' });
      
      this.updateUI();
      this.showNotification('All issues cleared', 'success');
    } catch (error) {
      console.error('[Popup] Clear failed:', error);
      this.showNotification('Failed to clear issues', 'error');
    }
  }

  async dismissIssue(issueId) {
    this.issues = this.issues.filter(i => i.id !== issueId);
    await chrome.storage.local.set({ dark_voir_issues: this.issues });
    this.updateUI();
    this.showNotification('Issue dismissed', 'success');
  }

  async refreshData() {
    await this.loadData();
    this.updateUI();
    this.showNotification('Data refreshed', 'success');
  }

  // ============= EXPORT FUNCTIONS =============
  async exportReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        critical: this.issues.filter(i => i.severity === 'critical').length,
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        low: this.issues.filter(i => i.severity === 'low').length
      },
      issues: this.issues,
      fixes: this.fixes
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dark-voir-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Report exported', 'success');
  }

  async exportFixes() {
    if (this.fixes.length === 0) {
      this.showNotification('No fixes to export', 'info');
      return;
    }

    const fixesMarkdown = this.fixes.map(fix => `
# Fix for Issue #${fix.issueId.substr(-6)}

**Confidence:** ${(fix.confidence * 100).toFixed(0)}%  
**Source:** ${fix.source}  
**Generated:** ${new Date(fix.timestamp).toLocaleString()}

## Analysis
${fix.analysis}

${fix.steps && fix.steps.length > 0 ? `
## Steps
${fix.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
` : ''}

${fix.code ? `
## Code Example
\`\`\`javascript
${fix.code}
\`\`\`
` : ''}

---
    `).join('\n');

    const blob = new Blob([fixesMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dark-voir-fixes-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Fixes exported', 'success');
  }

  viewLogs() {
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  }

  // ============= STORAGE =============
  async saveFixes() {
    try {
      await chrome.storage.local.set({ dark_voir_fixes: this.fixes });
    } catch (error) {
      console.error('[Popup] Failed to save fixes:', error);
    }
  }

  async saveChatHistory() {
    try {
      // Keep only last 50 messages
      const trimmedHistory = this.chatHistory.slice(-50);
      await chrome.storage.local.set({ dark_voir_chat_history: trimmedHistory });
    } catch (error) {
      console.error('[Popup] Failed to save chat history:', error);
    }
  }

  // ============= UTILITY FUNCTIONS =============
  getIssueIcon(severity) {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: 'ℹ️'
    };
    return icons[severity] || '⚠️';
  }

  formatTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatMarkdown(text) {
    if (!text) return '';
    
    // Simple markdown formatting
    let formatted = this.escapeHtml(text);
    
    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Code inline
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Code blocks
    formatted = formatted.replace(/``````/g, '<pre><code>$1</code></pre>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-size: 14px;
      max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Dark Voir] Popup loading...');
  new PopupController();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .notification {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;
document.head.appendChild(style);

console.log('[Dark Voir] Popup script loaded');