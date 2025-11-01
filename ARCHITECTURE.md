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
│  │              │  │                          │ │
│  │ - Handles    │  │ - Persists Issues        │ │
│  │   AI APIs    │  │ - Saves Fixes            │ │
│  │ - Analyzes   │  │ - Caches Data            │ │
│  │   Issues     │  │                          │ │
│  └──────────────┘  └──────────────────────────┘ │
└────────────────┬─────────────────────────────────┘
                 │ Chrome Messages
                 ▼
┌──────────────────────────────────────────────────┐
│         CONTENT SCRIPT (On Webpages)             │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Error Monitor│  │  Performance Monitor     │ │
│  │              │  │                          │ │
│  │ - JS Errors  │  │ - LCP/FID/CLS            │ │
│  │ - Promise    │  │ - Resource Timing        │ │
│  │   Rejection  │  │ - Network Events         │ │
│  │ - Console    │  │                          │ │
│  │   Warnings   │  │                          │ │
│  └──────────────┘  └──────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ DOM Analyzer │  │ Visual Guide System      │ │
│  │              │  │                          │ │
│  │ - Find       │  │ - Interactive Steps      │ │
│  │   Elements   │  │ - Highlighting          │ │
│  │ - Analyze    │  │ - Step Navigation        │ │
│  │   Queries    │  │ - User Guidance          │ │
│  └──────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. popup.js - UI Controller
- **Responsibility**: Manage user interface and interactions
- **Features**:
  - Tab switching (Dashboard, Issues, Fixes, Chat, Settings)
  - Issue filtering and display
  - Chat interface with AI assistant
  - Settings management
  - Real-time updates from background
- **Size**: 1000+ lines
- **Dependencies**: ChromeAIHelper, DarkVoirUtils

### 2. background.js - Service Worker
- **Responsibility**: Core business logic and orchestration
- **Features**:
  - Issue aggregation from content scripts
  - Badge updates for issue counts
  - Message routing between popup and content
  - Storage persistence
  - Error recovery strategies
- **Size**: ~400 lines
- **Dependencies**: None (async operations only)

### 3. content.js - Page Monitoring
- **Responsibility**: Monitor webpages for issues
- **Features**:
  - JavaScript error detection
  - Promise rejection handling
  - Performance monitoring
  - Network request tracking
  - DOM analysis for errors
  - Extension context validation
- **Size**: ~500 lines
- **Dependencies**: DarkVoirUtils, DOMAnalyzer, VisualGuide

### 4. ai-helper.js - Chrome AI Integration
- **Responsibility**: Interface with Chrome Built-in AI APIs
- **Features**:
  - Initialize all 5 AI APIs
  - Issue analysis and fix generation
  - Chat conversations
  - Documentation generation
  - Message improvement
  - Session management
- **Size**: ~400 lines
- **Dependencies**: None (standalone)

### 5. visual-guide.js - Step-by-Step Guidance
- **Responsibility**: Interactive user guidance system
- **Features**:
  - Element highlighting with pulsing glow
  - Message positioning (smart placement)
  - Step navigation
  - Keyboard shortcuts
  - Progress tracking
  - Pointer animation
- **Size**: ~550 lines
- **Dependencies**: DarkVoirUtils

### 6. utils.js - Shared Utilities
- **Responsibility**: Reusable utility functions
- **Features**:
  - Timing (debounce, throttle, sleep)
  - String manipulation
  - Object operations (deep clone, merge)
  - Element utilities (visibility, positioning)
  - Storage helpers
  - Browser detection
- **Size**: ~400 lines
- **Dependencies**: None (standalone)

### 7. logger.js - Logging System
- **Responsibility**: Centralized logging
- **Features**:
  - Multiple log levels (ERROR, WARN, INFO, DEBUG)
  - Color-coded console output
  - Chrome storage persistence
  - Log retrieval and filtering
  - Export formats (JSON, CSV, Text)
  - Statistics generation
- **Size**: ~350 lines
- **Dependencies**: Chrome Storage API

### 8. dom-analyzer.js - DOM Analysis
- **Responsibility**: Analyze and find DOM elements
- **Features**:
  - Intent detection from queries
  - Keyword extraction
  - Element finding by multiple strategies
  - Metadata generation
  - CSS selector generation
  - Page structure analysis
- **Size**: ~400 lines
- **Dependencies**: DarkVoirUtils

### 9. error-handler.js - Error Management
- **Responsibility**: Centralized error handling
- **Features**:
  - Error categorization
  - Recovery strategies
  - Error callbacks
  - Statistics and reporting
  - Multiple export formats
  - Storage persistence
- **Size**: ~350 lines
- **Dependencies**: Chrome Storage API, Logger

### 10. manifest.json - Configuration
- **Responsibility**: Extension configuration
- **Contains**:
  - Permissions and host permissions
  - Background service worker spec
  - Content scripts configuration
  - Web accessible resources
  - Keyboard commands
  - Icons for different sizes
  - Minimum Chrome version (127)

---

## Data Flow

### User Reports Issue → Fix Generation

```
1. Content Script (page)
   ↓ Detects JavaScript error
   ↓
2. Background Service Worker
   ↓ Receives issue via message
   ↓ Stores in memory and Chrome Storage
   ↓ Updates badge count
   ↓
3. Popup UI
   ↓ Receives update notification
   ↓ Refreshes issues list
   ↓ User clicks "Get AI Fix"
   ↓
4. AI Helper
   ↓ Calls Chrome AI Prompt API
   ↓ Generates analysis and fix steps
   ↓
5. Popup UI
   ↓ Displays fix with code example
   ↓ User can apply, copy, or export
```

### User Asks Question → Chat Response

```
1. Popup Chat UI
   ↓ User types message
   ↓ Sends to AI Helper
   ↓
2. AI Helper
   ↓ Calls Chrome AI API
   ↓ Formats response with markdown
   ↓
3. Popup Chat UI
   ↓ Displays response as message bubble
   ↓ Updates chat history
```

### Visual Guide Activation

```
1. User clicks "Visual Guide" button
   ↓ Enters question/request
   ↓
2. DOM Analyzer
   ↓ Analyzes query intent
   ↓ Finds relevant elements
   ↓
3. Visual Guide System
   ↓ Creates step-by-step guide
   ↓ Highlights elements
   ↓ Shows messages
   ↓ Allows navigation
   ↓
4. User follows guide
   ↓ Can go back/forward
   ↓ Can exit anytime
```

---

## Communication Patterns

### Chrome Message Format

```javascript
// From content to background
{
  type: 'REPORT_ISSUE',
  issue: {
    type: 'javascript_error',
    message: 'Cannot read property...',
    severity: 'high',
    timestamp: 1730000000000,
    url: 'https://example.com',
    stack: '...'
  }
}

// From popup to background
{
  type: 'GET_ISSUES',
  tabId: 12345
}

// Response from background
{
  success: true,
  issues: [...]
}
```

---

## Storage Schema

### Chrome Local Storage

```javascript
{
  // Issue tracking
  "dark_voir_issues": [
    {
      id: "timestamp_random",
      type: "javascript_error",
      message: "...",
      severity: "high",
      timestamp: 1730000000000,
      url: "https://example.com",
      resolved: false
    }
  ],

  // Generated fixes
  "dark_voir_fixes": [
    {
      issueId: "timestamp_random",
      solution: "...",
      code: "...",
      confidence: 0.92,
      timestamp: 1730000000000
    }
  ],

  // User settings
  "dark_voir_settings": {
    autoGenerateFixes: true,
    showAISuggestions: true,
    monitorConsole: true,
    notificationsEnabled: false
  },

  // Logs
  "dark_voir_logs": [
    {
      timestamp: 1730000000000,
      level: "INFO",
      component: "Content",
      message: "Issue detected",
      data: {}
    }
  ],

  // Chat history
  "dark_voir_chat_history": [
    {
      role: "user",
      content: "What's wrong with this page?",
      timestamp: 1730000000000
    }
  ]
}
```

---

## Version History

- **v3.0.0** (Oct 2025) - Complete AI integration with visual guide system