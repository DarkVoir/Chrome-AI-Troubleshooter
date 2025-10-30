# Dark Voir AI Troubleshooter - Architecture Documentation

## System Architecture Overview

Dark Voir uses a **three-tier architecture** optimized for Chrome Extension Manifest V3:

1. **Content Layer** - Runs on webpages, monitors issues
2. **Service Worker Layer** - Orchestrates AI and storage  
3. **UI Layer** - Popup interface for user interaction

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────┐
│           USER INTERFACE (Popup)                 │
│  ┌─────────────┐           ┌─────────────────┐  │
│  │  Dashboard  │           │ Chat Interface  │  │
│  │   View      │           │                 │  │
│  └─────────────┘           └─────────────────┘  │
└────────────────┬─────────────────────────────────┘
                 │ Chrome Messages
                 ▼
┌──────────────────────────────────────────────────┐
│        BACKGROUND SERVICE WORKER                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  AI Manager  │  │   Storage Manager        │ │
│  └──────────────┘  └──────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ AI Trouble-  │  │   Message Router         │ │
│  │  shooter     │  │                          │ │
│  └──────────────┘  └──────────────────────────┘ │
└────────────────┬─────────────────────────────────┘
                 │ Chrome Messages
                 ▼
┌──────────────────────────────────────────────────┐
│          CONTENT SCRIPTS (On Page)               │
│  ┌────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Content   │  │ Visual Guide │  │  Agent  │ │
│  │Troubleshoot│  │    System    │  │         │ │
│  └────────────┘  └──────────────┘  └─────────┘ │
│  ┌────────────┐  ┌──────────────┐              │
│  │    DOM     │  │    Error     │              │
│  │  Analyzer  │  │   Handler    │              │
│  └────────────┘  └──────────────┘              │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
             ┌──────────────┐
             │   WEBPAGE    │
             │   (Target)   │
             └──────────────┘
```

---

## Component Responsibilities

### Content Layer

**ContentTroubleshooter** (`content.js`)
- Monitors JavaScript errors via `window.addEventListener('error')`
- Tracks performance metrics using PerformanceObserver API
- Detects DOM issues via MutationObserver
- Reports issues to background service
- Coordinates visual guide activation

**VisualGuide** (`visual-guide.js`)
- Creates overlay darkening effect
- Highlights target elements with glowing borders
- Displays message bubbles with instructions
- Animates pointer (👆) showing where to interact
- Manages step-by-step navigation

**DOMAnalyzer** (`dom-analyzer.js`)
- Analyzes page structure and elements
- Finds elements matching user queries
- Extracts element metadata (selector, text, position)
- Detects page features (login forms, search bars, etc.)

**Agent** (`agent.js`)
- Self-monitors extension health every 30 seconds
- Auto-heals when error count exceeds threshold
- Cleans up stuck intervals/observers
- Reports health status

### Service Worker Layer

**BackgroundService** (`background.js`)
- Central message router for all extension communications
- Coordinates tab lifecycle events
- Manages issue storage and badge updates
- Handles keyboard command shortcuts
- Performs periodic health checks

**AIManager** (`ai-manager.js`)
- Manages Chrome AI API sessions (Prompt, Summarizer, Writer, Rewriter, Translator, Language Detector)
- Implements response caching (1 hour TTL)
- Handles AI availability checking
- Gracefully degrades when AI unavailable

**StorageManager** (`storage-manager.js`)
- Abstracts Chrome storage API (`chrome.storage.local` and `chrome.storage.sync`)
- Provides in-memory caching layer
- Manages storage quotas
- Handles storage change listeners

**AITroubleshooter** (`ai-troubleshooter.js`)
- Diagnoses issues using AI analysis
- Generates fix instructions
- Provides fallback diagnostics when AI unavailable

**AIVisualGuideGenerator** (`ai-visual-guide-generator.js`)
- Converts user natural language queries into actionable steps
- Analyzes available page elements
- Generates JSON step sequences

**AISelfDiagnostics** (`ai-self-diagnostics.js`)
- Performs extension health checks
- Collects system state (Chrome version, AI status, storage usage)
- Provides recommendations for issues

### UI Layer

**PopupController** (`popup.js`)
- Manages popup views (Dashboard, Chat)
- Updates statistics and issue lists
- Handles button click events
- Coordinates with background service

**ChatInterface** (`chat-interface.js`)
- Manages chat conversation state
- Builds context from current page and issues
- Formats AI responses

---

## Data Flow Examples

### Issue Detection Flow

```
1. JavaScript error occurs on page
   ↓
2. window.addEventListener('error') catches it
   ↓
3. ContentTroubleshooter.handleJavaScriptError()
   ↓
4. chrome.runtime.sendMessage({ type: 'REPORT_ISSUE', data: error })
   ↓
5. Background receives message
   ↓
6. Background stores in chrome.storage.local
   ↓
7. Background updates badge: chrome.action.setBadgeText()
   ↓
8. User opens popup
   ↓
9. Popup loads issues from storage
   ↓
10. Issues displayed in dashboard
```

### Visual Guide Flow

```
1. User presses Ctrl+Shift+G
   ↓
2. chrome.commands.onCommand listener triggered
   ↓
3. Background sends message to content script
   ↓
4. Content script prompts user for query
   ↓
5. DOMAnalyzer finds relevant elements
   ↓
6. Send to background: GET_VISUAL_GUIDE message
   ↓
7. Background asks AI to generate steps
   ↓
8. AI returns JSON array of steps
   ↓
9. Background validates steps
   ↓
10. Returns steps to content script
   ↓
11. VisualGuide.start(steps) creates overlay
   ↓
12. Highlight first element, show message
   ↓
13. User clicks "Next" or presses arrow key
   ↓
14. Repeat until guide complete
```

### Chat Message Flow

```
1. User types message in chat input
   ↓
2. PopupController.sendChatMessage()
   ↓
3. chrome.runtime.sendMessage({ type: 'SEND_CHAT_MESSAGE' })
   ↓
4. Background receives message
   ↓
5. Background builds context (page, history)
   ↓
6. AIManager.prompt() called
   ↓
7. window.ai.assistant.create() creates session
   ↓
8. session.prompt() sends to Gemini Nano
   ↓
9. AI response returned
   ↓
10. Background sends response to popup
   ↓
11. ChatInterface adds message to UI
   ↓
12. Message saved to chat history
   ↓
13. chrome.storage.local.set() persists history
```

---

## Storage Schema

### Local Storage (chrome.storage.local)

```javascript
{
  "dark_voir_issues": [
    {
      "id": "1698012345_abc123",
      "type": "javascript_error",
      "message": "TypeError: Cannot read property 'map' of undefined",
      "severity": "critical",
      "timestamp": 1698012345000,
      "tabId": 123,
      "url": "https://example.com"
    }
  ],
  
  "dark_voir_chat_history": [
    {
      "role": "user",
      "content": "Why is this page slow?",
      "timestamp": 1698012346000
    },
    {
      "role": "assistant",
      "content": "The page has slow performance...",
      "timestamp": 1698012347000
    }
  ],
  
  "dark_voir_health": {
    "timestamp": 1698012350000,
    "aiAvailable": true,
    "issueCount": 5,
    "storageUsage": { "used": 1024, "percentage": "0.01" }
  }
}
```

### Sync Storage (chrome.storage.sync)

```javascript
{
  "dark_voir_settings": {
    "theme": "auto",
    "autoScan": true,
    "scanInterval": 5000,
    "visualGuide": {
      "highlightColor": "#00d9ff",
      "animationSpeed": 500
    }
  }
}
```

---

## Message Passing Protocol

All messages follow this format:

```javascript
{
  type: "MESSAGE_TYPE",  // From CONSTANTS
  data: {
    // Message-specific payload
  }
}
```

**Response Format:**

```javascript
{
  success: true|false,
  data: { ... },        // Present if success = true
  error: "message"      // Present if success = false
}
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| REPORT_ISSUE | Content → Background | Report detected issue |
| REQUEST_AI_ANALYSIS | Content/Popup → Background | Request AI diagnosis |
| GET_VISUAL_GUIDE | Content → Background | Generate visual guide |
| SEND_CHAT_MESSAGE | Popup → Background | Send chat message |
| GET_ISSUES | Popup → Background | Fetch all issues |
| TRIGGER_SCAN | Popup → Background | Start page scan |
| START_MONITORING | Background → Content | Begin monitoring |
| ACTIVATE_VISUAL_GUIDE | Background → Content | Activate guide mode |
| EXECUTE_VISUAL_GUIDE | Background → Content | Run guide steps |

---

## Security Model

### Content Script Isolation

Content scripts run in an **isolated world**:
- Cannot directly access page's JavaScript variables
- Shares DOM with page but separate execution context
- Must use `postMessage` for page communication

### Permissions

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### AI Safety

1. **Code Sanitization**: All AI-generated code is sanitized before execution
2. **Dangerous Operations Blocked**: `eval()`, `Function()`, `innerHTML =` are prohibited
3. **Local Processing**: All AI runs on-device, no external servers

---

## Performance Optimizations

### Caching Strategy

1. **AI Response Cache**: 1 hour TTL
2. **DOM Analysis Cache**: 5 seconds TTL
3. **Storage Cache**: In-memory map synced with chrome.storage

### Debouncing & Throttling

```javascript
// DOM mutations debounced (500ms)
const callback = debounce((mutations) => {
  // Process mutations
}, 500);

// Performance entries throttled
const observer = new PerformanceObserver((list) => {
  // Throttled processing
});
```

### Resource Cleanup

```javascript
// On navigation
chrome.webNavigation.onBeforeNavigate.addListener(() => {
  // Clear tab-specific data
  // Disconnect observers
  // Clear intervals
});

// On tab close
chrome.tabs.onRemoved.addListener(() => {
  // Remove from issues map
  // Clear storage
  // Reset badge
});
```

---

## Error Handling Strategy

### Graceful Degradation

When Chrome AI unavailable:
1. Show clear message to user
2. Use fallback diagnostic logic
3. Disable AI-dependent features gracefully
4. Guide user to enable AI in chrome://flags

### Error Recovery

```javascript
// Automatic retry with backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}
```

---

## Extension Lifecycle

### On Install

```javascript
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dark Voir installed');
  // Initialize default settings
  // Show welcome page (optional)
});
```

### On Startup

```javascript
chrome.runtime.onStartup.addListener(() => {
  // Restore state
  // Check AI availability
  // Resume health monitoring
});
```

### On Page Load

```javascript
// Content script injection
if (document.readyState === 'complete') {
  initializeExtension();
} else {
  window.addEventListener('load', initializeExtension);
}
```

---

## Testing Strategy

### Unit Testing

Test individual components in isolation:
- Utility functions (`utils.js`)
- Error severity classification
- DOM analysis logic

### Integration Testing

Test component interactions:
- Content ↔ Background communication
- Storage operations
- AI API integration

### Manual Testing

Test user workflows:
- Visual guide generation
- Issue detection
- Chat functionality
- Self-check

---

## Deployment Checklist

- [ ] All files present and named correctly
- [ ] manifest.json valid (no syntax errors)
- [ ] Icons in .png format
- [ ] Chrome Canary 127+
- [ ] AI flags enabled
- [ ] AI model downloaded
- [ ] Extension loads without errors
- [ ] All features tested
- [ ] Console clean (no errors)
- [ ] Self-check passes

---

**For implementation details, see:**
- `API_GUIDE.md` - Chrome AI API usage
- `DEVELOPER_GUIDE.md` - Development setup
- `TROUBLESHOOTING.md` - Common issues
