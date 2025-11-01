# Chrome Built-in AI APIs - Complete Integration Guide

## Overview

Dark Voir integrates with **all 5 Chrome Built-in AI APIs** (available in Chrome Canary 127+):

1. **Prompt API (Gemini Nano)** - Main AI engine for conversations and analysis
2. **Summarizer API** - Condenses long text (error logs, console output)
3. **Writer API** - Generates content (fix instructions, documentation)
4. **Rewriter API** - Rephrases text (simplifies technical language)
5. **Translator API** - Translates between languages

---

## Prerequisites

### Enable Chrome AI

1. Open `chrome://flags` in Chrome Canary (127+)
2. Search for each flag and set to **Enabled**:
   - `Prompt API for Gemini Nano`
   - `Summarization API for Gemini Nano`
   - `Writer API for Gemini Nano`
   - `Rewriter API for Gemini Nano`
   - `Translation API`
3. Click **Relaunch**

### Download AI Model

1. Go to `chrome://components`
2. Find **"Optimization Guide On Device Model"**
3. Click **Check for update**
4. Wait for download (~400MB)
5. Restart browser

---

## API Reference

### 1. Prompt API (Gemini Nano)

**Purpose**: Text generation and conversation

**Example Usage**:

```javascript
// Check availability
const capabilities = await window.ai.languageModel.capabilities();

if (capabilities.available === 'readily') {
  // Create session
  const session = await window.ai.languageModel.create({
    systemPrompt: "You are a helpful troubleshooting assistant."
  });
  
  // Use session
  const response = await session.prompt("What's wrong with my code?");
  console.log(response);
  
  // Cleanup
  await session.destroy();
}
```

**Status Values**:
- `'readily'` - Ready to use immediately
- `'after-download'` - Will download model, then ready
- `'no'` - Not available

**Use Cases in Dark Voir**:
- Issue analysis and explanation
- Fix generation with code examples
- Chat conversations
- Code suggestions and debugging tips

---

### 2. Summarizer API

**Purpose**: Condense long text into key points

**Example Usage**:

```javascript
// Check availability
const capabilities = await window.ai.summarizer.capabilities();

if (capabilities.available !== 'no') {
  // Create summarizer
  const summarizer = await window.ai.summarizer.create({
    type: 'key-points',
    format: 'markdown',
    length: 'medium'
  });
  
  // Summarize
  const longErrorLog = "Error: ..."; // Long text
  const summary = await summarizer.summarize(longErrorLog);
  
  // Cleanup
  await summarizer.destroy();
}
```

**Parameters**:
- `type`: 
  - `'key-points'` - Extract main points
  - `'tl;dr'` - Brief summary
- `format`: 
  - `'markdown'` - Formatted output
  - `'plain-text'` - Plain text
- `length`: 
  - `'short'` - Brief summary
  - `'medium'` - Balanced
  - `'long'` - Detailed

**Use Cases**:
- Summarize error logs
- Condense console output
- Extract key issues from stack traces

---

### 3. Writer API

**Purpose**: Generate written content

**Example Usage**:

```javascript
const capabilities = await window.ai.writer.capabilities();

if (capabilities.available !== 'no') {
  const writer = await window.ai.writer.create({
    tone: 'professional',
    length: 'medium'
  });
  
  const content = await writer.write(
    "Generate step-by-step fix instructions for a network timeout error"
  );
  
  await writer.destroy();
}
```

**Parameters**:
- `tone`: 
  - `'professional'` - Formal language
  - `'casual'` - Conversational
  - `'friendly'` - Warm and approachable
- `length`: 
  - `'short'` - Concise
  - `'medium'` - Balanced
  - `'long'` - Detailed

**Use Cases**:
- Generate fix instructions
- Write documentation for fixes
- Create error explanations

---

### 4. Rewriter API

**Purpose**: Rephrase and improve text

**Example Usage**:

```javascript
const capabilities = await window.ai.rewriter.capabilities();

if (capabilities.available !== 'no') {
  const rewriter = await window.ai.rewriter.create({
    tone: 'casual',
    format: 'plain-text'
  });
  
  const technical = "Uncaught TypeError: Cannot read property 'map' of undefined";
  const userFriendly = await rewriter.rewrite(
    technical,
    { context: "Make this error message user-friendly" }
  );
  
  await rewriter.destroy();
}
```

**Context Options**:
- Change tone (formal → casual)
- Improve clarity
- Adjust length (expand or condense)

**Use Cases**:
- Simplify technical error messages
- Make jargon user-friendly
- Improve fix explanations

---

### 5. Translator API

**Purpose**: Translate text between languages

**Example Usage**:

```javascript
// Check if translation is possible
const canTranslate = await window.ai.translator.canTranslate({
  sourceLanguage: 'auto',
  targetLanguage: 'es'
});

if (canTranslate !== 'no') {
  const translator = await window.ai.translator.create({
    sourceLanguage: 'auto',
    targetLanguage: 'es'
  });
  
  const translated = await translator.translate(
    "This error occurred because the network request timed out"
  );
  
  await translator.destroy();
}
```

**Language Codes**:
- `'auto'` - Auto-detect source language
- `'en'` - English
- `'es'` - Spanish
- `'fr'` - French
- `'de'` - German
- `'ja'` - Japanese
- `'zh'` - Chinese
- And many more...

**Use Cases**:
- Translate error messages
- Multilingual support
- Global user assistance

---

## Integration Patterns

### Pattern 1: Safe Capability Checking

```javascript
async function checkAIAvailable() {
  try {
    if (!window.ai?.languageModel) {
      return false;
    }
    
    const cap = await window.ai.languageModel.capabilities();
    return cap.available === 'readily' || cap.available === 'after-download';
  } catch (error) {
    console.error('AI check failed:', error);
    return false;
  }
}
```

### Pattern 2: Proper Session Lifecycle

```javascript
async function generateFix(issue) {
  let session = null;
  
  try {
    // Create session
    const cap = await window.ai.languageModel.capabilities();
    if (cap.available === 'no') {
      throw new Error('AI not available');
    }
    
    session = await window.ai.languageModel.create({
      systemPrompt: "You are a helpful troubleshooter."
    });
    
    // Use session
    const prompt = `Fix this error: ${issue.message}`;
    const fix = await session.prompt(prompt);
    
    return fix;
    
  } finally {
    // Always cleanup
    if (session && typeof session.destroy === 'function') {
      await session.destroy();
    }
  }
}
```

### Pattern 3: Fallback Chain

```javascript
async function analyzeIssue(issue) {
  // Try Prompt API first
  try {
    const fix = await analyzeWithPrompt(issue);
    return { success: true, fix, api: 'Prompt' };
  } catch (error) {
    console.warn('Prompt API failed:', error);
  }
  
  // Try Writer API
  try {
    const fix = await generateWithWriter(issue);
    return { success: true, fix, api: 'Writer' };
  } catch (error) {
    console.warn('Writer API failed:', error);
  }
  
  // Fallback to static response
  return {
    success: false,
    message: 'AI unavailable. Enable at chrome://flags',
    api: 'None'
  };
}
```

### Pattern 4: Error Recovery

```javascript
async function robustAnalysis(issue, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzeIssue(issue);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      const delay = 1000 * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Dark Voir Implementation

### ChromeAIHelper Class Structure

```javascript
class ChromeAIHelper {
  constructor() {
    this.sessions = {
      prompt: null,
      writer: null,
      rewriter: null,
      summarizer: null,
      translator: null
    };
    this.capabilities = {};
    this.isReady = false;
  }
  
  async initialize() {
    // Check and initialize all APIs
    // Prompt API
    if (window.ai?.languageModel) {
      const cap = await window.ai.languageModel.capabilities();
      this.capabilities.prompt = cap.available;
      if (cap.available === 'readily') {
        this.sessions.prompt = await window.ai.languageModel.create({
          systemPrompt: "You are Dark Voir, a web troubleshooting expert."
        });
      }
    }
    // Similar for other APIs...
  }
  
  async analyzeIssue(issue) {
    if (!this.sessions.prompt) {
      return { message: 'AI unavailable' };
    }
    
    const response = await this.sessions.prompt.prompt(
      `Analyze and fix: ${issue.message}`
    );
    return { analysis: response };
  }
}
```

---

## Performance Tips

### 1. Reuse Sessions

```javascript
// ✅ Good: Reuse session
const session = await window.ai.languageModel.create({});
const fix1 = await session.prompt("Fix this...");
const fix2 = await session.prompt("Fix that...");
await session.destroy();

// ❌ Bad: Create new session each time
for (const issue of issues) {
  const session = await window.ai.languageModel.create({});
  await session.prompt("Fix: " + issue);
  await session.destroy();
}
```

### 2. Parallel Requests

```javascript
// ✅ Good: Parallel processing
const [fix1, fix2, fix3] = await Promise.all([
  session.prompt("Fix 1"),
  session.prompt("Fix 2"),
  session.prompt("Fix 3")
]);

// ❌ Bad: Sequential
const fix1 = await session.prompt("Fix 1");
const fix2 = await session.prompt("Fix 2");
const fix3 = await session.prompt("Fix 3");
```

### 3. Lazy Initialization

```javascript
let session = null;

async function getSession() {
  if (!session) {
    session = await window.ai.languageModel.create({});
  }
  return session;
}
```

---

## Error Messages & Solutions

| Error | Solution |
|-------|----------|
| `window.ai is undefined` | Enable AI flags at chrome://flags |
| `capabilities.available === 'no'` | AI not available in your region/version |
| `Model not available` | Download model at chrome://components |
| `Permission denied` | Check extension permissions |
| `Session destroyed` | Create new session before use |
| `Request timeout` | Reduce prompt length or retry |

---

## Best Practices

### 1. Always Check Capabilities

```javascript
const cap = await window.ai.languageModel.capabilities();
if (cap.available === 'no') {
  return defaultBehavior();
}
```

### 2. Proper Error Handling

```javascript
try {
  const response = await session.prompt(message);
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied permission
  } else if (error.name === 'UnknownError') {
    // Network or other error
  }
}
```

### 3. Clean Up Resources

```javascript
// Always destroy sessions when done
try {
  // Use session
} finally {
  if (session) await session.destroy();
}
```

---

## Testing Your Integration

### 1. Check AI Availability

```javascript
async function testAI() {
  console.log('Testing Chrome AI...');
  
  if (!window.ai) {
    console.error('❌ window.ai not found');
    return;
  }
  
  const cap = await window.ai.languageModel.capabilities();
  console.log('✅ Prompt API:', cap.available);
}

testAI();
```

### 2. Test Session Creation

```javascript
async function testSession() {
  const session = await window.ai.languageModel.create({});
  const response = await session.prompt("Hello!");
  console.log('Response:', response);
  await session.destroy();
}
```

---

## Additional Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/)
- [Gemini Nano Overview](https://developers.google.com/machine-learning/nano)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

---

**Version**: 3.0.0  
**Last Updated**: October 2025  
**Minimum Chrome Version**: 127 (Canary)