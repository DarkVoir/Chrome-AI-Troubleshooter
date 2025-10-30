# Chrome Built-in AI APIs - Integration Guide

## Overview

Dark Voir integrates with **all 6 Chrome Built-in AI APIs** (available in Chrome Canary 127+):

1. **Prompt API (Gemini Nano)** - Main AI engine for conversations and analysis
2. **Summarizer API** - Condenses long text (error logs, console output)
3. **Writer API** - Generates content (fix instructions, documentation)
4. **Rewriter API** - Rephrases text (simplifies technical language)
5. **Translator API** - Translates between languages
6. **Language Detector API** - Detects text language

---

## Prerequisites

### Enable Chrome AI

1. Open `chrome://flags` in Chrome Canary
2. Search for each flag and set to **Enabled**:
   - `Prompt API for Gemini Nano`
   - `Summarization API for Gemini Nano`
   - `Writer API for Gemini Nano`
   - `Rewriter API for Gemini Nano`
   - `Translation API`
   - `Language Detection API`
3. Click **Relaunch**

### Download AI Model

1. Go to `chrome://components`
2. Find **"Optimization Guide On Device Model"**
3. Click **"Check for update"**
4. Wait 5-10 minutes for download
5. Status should show "Up-to-date"

---

## API Reference

### 1. Prompt API (Gemini Nano)

**Purpose**: Main conversational AI for troubleshooting and analysis

**Check Availability:**

```javascript
async function checkPromptAPI() {
  if (!window.ai?.assistant) {
    return { available: false, reason: 'API not found' };
  }
  
  const capabilities = await window.ai.assistant.capabilities();
  
  return {
    available: capabilities.available === 'readily',
    needsDownload: capabilities.available === 'after-download',
    status: capabilities.available
  };
}
```

**Create Session:**

```javascript
const session = await window.ai.assistant.create({
  systemPrompt: "You are Dark Voir, an AI troubleshooting assistant. Provide concise, helpful responses.",
  temperature: 0.7,  // 0.0 (deterministic) to 1.0 (creative)
  topK: 40          // Sampling diversity (1-100)
});
```

**Send Prompt:**

```javascript
// Simple prompt
const response = await session.prompt("What causes this JavaScript error?");
console.log(response);

// Streaming response (for real-time display)
const stream = await session.promptStreaming("Explain this issue in detail");
for await (const chunk of stream) {
  console.log(chunk); // Incremental text
  updateUI(chunk);
}
```

**Best Practices:**
- Keep prompts under 1024 tokens (~800 words)
- Include context in system prompt, not every message
- Reuse sessions for multiple prompts
- Always destroy session when done: `await session.destroy()`
- Handle errors gracefully (API may be temporarily unavailable)

**Example Usage in Dark Voir:**

```javascript
async function analyzeError(error) {
  const session = await window.ai.assistant.create({
    systemPrompt: "You are an expert at diagnosing web page errors. Provide brief, actionable explanations."
  });
  
  const prompt = `
Error: ${error.message}
Type: ${error.type}
URL: ${error.url}

Provide:
1. What caused this
2. User impact  
3. How to fix it
`;
  
  const analysis = await session.prompt(prompt);
  await session.destroy();
  
  return analysis;
}
```

---

### 2. Summarizer API

**Purpose**: Condense long text (error logs, console output)

**Check Availability:**

```javascript
async function checkSummarizerAPI() {
  if (!window.ai?.summarizer) {
    return { available: false };
  }
  
  const capabilities = await window.ai.summarizer.capabilities();
  return {
    available: capabilities.available === 'readily'
  };
}
```

**Create Summarizer:**

```javascript
const summarizer = await window.ai.summarizer.create({
  type: 'key-points',  // 'key-points', 'tl;dr', 'teaser', 'headline'
  format: 'markdown',  // 'markdown' or 'plain-text'
  length: 'medium'     // 'short', 'medium', 'long'
});
```

**Summarize Text:**

```javascript
const longText = `[Very long error log or console output]`;
const summary = await summarizer.summarize(longText);
console.log(summary);

await summarizer.destroy();
```

**Example Usage:**

```javascript
async function summarizeErrorLog(errorLog) {
  const summarizer = await window.ai.summarizer.create({
    type: 'key-points',
    format: 'plain-text',
    length: 'short'
  });
  
  const summary = await summarizer.summarize(errorLog);
  await summarizer.destroy();
  
  return summary;
}
```

---

### 3. Writer API

**Purpose**: Generate content (fix instructions, explanations)

**Check Availability:**

```javascript
async function checkWriterAPI() {
  if (!window.ai?.writer) {
    return { available: false };
  }
  
  const capabilities = await window.ai.writer.capabilities();
  return {
    available: capabilities.available === 'readily'
  };
}
```

**Create Writer:**

```javascript
const writer = await window.ai.writer.create({
  tone: 'friendly',   // 'formal', 'neutral', 'friendly'
  format: 'markdown', // 'markdown' or 'plain-text'
  length: 'medium'    // 'short', 'medium', 'long'
});
```

**Generate Content:**

```javascript
const prompt = "Write step-by-step instructions to fix a CORS error";
const instructions = await writer.write(prompt);
console.log(instructions);

await writer.destroy();
```

**Example Usage:**

```javascript
async function generateFixInstructions(issue) {
  const writer = await window.ai.writer.create({
    tone: 'friendly',
    format: 'markdown',
    length: 'short'
  });
  
  const prompt = `Write instructions to fix: ${issue.message}`;
  const instructions = await writer.write(prompt);
  await writer.destroy();
  
  return instructions;
}
```

---

### 4. Rewriter API

**Purpose**: Rephrase text (simplify technical jargon)

**Check Availability:**

```javascript
async function checkRewriterAPI() {
  if (!window.ai?.rewriter) {
    return { available: false };
  }
  
  const capabilities = await window.ai.rewriter.capabilities();
  return {
    available: capabilities.available === 'readily'
  };
}
```

**Create Rewriter:**

```javascript
const rewriter = await window.ai.rewriter.create({
  tone: 'more-casual', // 'more-formal', 'more-casual'
  length: 'as-is'      // 'shorter', 'longer', 'as-is'
});
```

**Rewrite Text:**

```javascript
const technical = "TypeError: Cannot read property 'map' of undefined at line 42";
const simplified = await rewriter.rewrite(technical);
console.log(simplified);
// Output: "The code tried to use data that doesn't exist yet"

await rewriter.destroy();
```

**Example Usage:**

```javascript
async function simplifyTechnicalError(error) {
  const rewriter = await window.ai.rewriter.create({
    tone: 'more-casual',
    length: 'shorter'
  });
  
  const simplified = await rewriter.rewrite(error);
  await rewriter.destroy();
  
  return simplified;
}
```

---

### 5. Translator API

**Purpose**: Translate text between languages

**Check Availability:**

```javascript
async function checkTranslatorAPI() {
  if (!window.ai?.translator) {
    return { available: false };
  }
  
  const capabilities = await window.ai.translator.capabilities();
  return {
    available: capabilities.available === 'readily'
  };
}
```

**Create Translator:**

```javascript
const translator = await window.ai.translator.create({
  sourceLanguage: 'en',  // ISO 639-1 code
  targetLanguage: 'es'   // ISO 639-1 code
});
```

**Translate Text:**

```javascript
const english = "This page has a JavaScript error";
const spanish = await translator.translate(english);
console.log(spanish);
// Output: "Esta página tiene un error de JavaScript"

await translator.destroy();
```

**Example Usage:**

```javascript
async function translateMessage(message, targetLang) {
  const translator = await window.ai.translator.create({
    sourceLanguage: 'en',
    targetLanguage: targetLang
  });
  
  const translated = await translator.translate(message);
  await translator.destroy();
  
  return translated;
}
```

---

### 6. Language Detector API

**Purpose**: Detect language of text

**Check Availability:**

```javascript
async function checkLanguageDetectorAPI() {
  if (!window.ai?.languageDetector) {
    return { available: false };
  }
  
  const capabilities = await window.ai.languageDetector.capabilities();
  return {
    available: capabilities.available === 'readily'
  };
}
```

**Create Detector:**

```javascript
const detector = await window.ai.languageDetector.create();
```

**Detect Language:**

```javascript
const text = "Bonjour le monde";
const results = await detector.detect(text);
console.log(results);
// Output: [{ detectedLanguage: 'fr', confidence: 0.95 }]

await detector.destroy();
```

**Example Usage:**

```javascript
async function detectAndTranslate(text) {
  const detector = await window.ai.languageDetector.create();
  const results = await detector.detect(text);
  await detector.destroy();
  
  if (results[0].detectedLanguage !== 'en') {
    return await translateMessage(text, 'en');
  }
  
  return text;
}
```

---

## Error Handling

### Common Errors

```javascript
try {
  const session = await window.ai.assistant.create();
  const response = await session.prompt(query);
} catch (error) {
  if (error.name === 'NotSupportedError') {
    console.error('AI not available on this device');
    // Fallback to alternative approach
  } else if (error.name === 'InvalidStateError') {
    console.error('AI model not downloaded yet');
    // Guide user to chrome://components
  } else if (error.name === 'QuotaExceededError') {
    console.error('Rate limit exceeded');
    // Implement retry with backoff
  } else {
    console.error('AI error:', error);
  }
}
```

### Retry Strategy

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = 1000 * Math.pow(2, i); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const response = await retryWithBackoff(() => 
  session.prompt("Analyze this error")
);
```

---

## Performance Optimization

### Caching Strategy

```javascript
class AICache {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 3600000; // 1 hour
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }
}

const aiCache = new AICache();

// Usage
async function cachedPrompt(text) {
  const cached = aiCache.get(text);
  if (cached) return cached;
  
  const response = await session.prompt(text);
  aiCache.set(text, response);
  
  return response;
}
```

### Session Reuse

```javascript
class AISessionManager {
  constructor() {
    this.session = null;
  }
  
  async getSession() {
    if (!this.session) {
      this.session = await window.ai.assistant.create({
        systemPrompt: "You are a helpful assistant"
      });
    }
    return this.session;
  }
  
  async destroySession() {
    if (this.session) {
      await this.session.destroy();
      this.session = null;
    }
  }
}
```

---

## Testing AI Integration

### Check All APIs

```javascript
async function checkAllAPIs() {
  const status = {
    prompt: await checkPromptAPI(),
    summarizer: await checkSummarizerAPI(),
    writer: await checkWriterAPI(),
    rewriter: await checkRewriterAPI(),
    translator: await checkTranslatorAPI(),
    languageDetector: await checkLanguageDetectorAPI()
  };
  
  console.table(status);
  return status;
}

// Run in console
checkAllAPIs();
```

---

## Fallback Strategies

When AI is unavailable, Dark Voir uses fallback logic:

```javascript
async function diagnoseWithFallback(error) {
  try {
    // Try AI first
    return await diagnoseWithAI(error);
  } catch (aiError) {
    console.warn('AI unavailable, using fallback');
    return getFallbackDiagnosis(error);
  }
}

function getFallbackDiagnosis(error) {
  // Rule-based diagnosis
  if (error.type === 'javascript_error') {
    return {
      cause: 'JavaScript code error',
      fix: 'Refresh the page or clear browser cache'
    };
  }
  // ... more rules
}
```

---

## Best Practices Summary

1. **Always check availability** before using an API
2. **Reuse sessions** when making multiple requests
3. **Implement caching** to reduce API calls
4. **Handle errors gracefully** with fallback logic
5. **Destroy sessions** when done to free resources
6. **Use appropriate API** for each task (don't use Prompt API for everything)
7. **Keep prompts concise** (< 1024 tokens)
8. **Implement retry logic** for transient failures
9. **Monitor rate limits** and implement backoff
10. **Test without AI** to ensure fallbacks work

---

For complete implementation examples, see:
- `ai-manager.js` - Unified AI session management
- `background.js` - AI integration in service worker
- `ARCHITECTURE.md` - System design
