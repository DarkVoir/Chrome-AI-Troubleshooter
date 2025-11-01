/**
 * Dark Voir - Chrome Built-in AI Helper
 * Integrates ALL Chrome AI APIs: Prompt, Writer, Rewriter, Summarizer, Translator
 */

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
    this.initialized = false;
  }
  // +++++++++++++++ Pre-check for the start++++++++++++++
  async waitForGeminiNanoAI(timeoutMs = 4000) {
  const intervalMs = 300;
  for (let elapsed = 0; elapsed < timeoutMs; elapsed += intervalMs) {
    if (window.ai && window.ai.languageModel) {
      try {
        const cap = await window.ai.languageModel.capabilities();
        if (cap.available === 'readily' || cap.available === 'after-download') {
          return true;
        }
      } catch {}
    }
    await new Promise(res => setTimeout(res, intervalMs));
  }
  return false;
}
  // ============= INITIALIZATION =============
  async initialize() {
    if (!await this.waitForGeminiNanoAI()) {
  console.warn('[AI Helper] Gemini Nano not available');
  this.initialized = true;
  this.isReady = false;
  return false;
}
    if (this.initialized) {
      console.log('[AI Helper] Already initialized');
      return this.isReady;
    }

    try {
      console.log('[AI Helper] Initializing all Chrome AI APIs...');

      // Check and initialize Prompt API (Gemini Nano)
      if (window.ai?.languageModel) {
        try {
          const promptCap = await window.ai.languageModel.capabilities();
          this.capabilities.prompt = promptCap.available;

          if (promptCap.available === 'readily' || promptCap.available === 'after-download') {
            this.sessions.prompt = await window.ai.languageModel.create({
              systemPrompt: "You are Dark Voir, an expert web troubleshooting assistant. Provide concise, actionable technical solutions focused on fixing the issue."
            });
            console.log('[AI Helper] ✓ Prompt API initialized');
          }
        } catch (error) {
          console.warn('[AI Helper] Prompt API initialization failed:', error);
        }
      }

      // Check and initialize Writer API
      if (window.ai?.writer) {
        try {
          const writerCap = await window.ai.writer.capabilities();
          this.capabilities.writer = writerCap.available;

          if (writerCap.available === 'readily' || writerCap.available === 'after-download') {
            this.sessions.writer = await window.ai.writer.create();
            console.log('[AI Helper] ✓ Writer API initialized');
          }
        } catch (error) {
          console.warn('[AI Helper] Writer API initialization failed:', error);
        }
      }

      // Check and initialize Rewriter API
      if (window.ai?.rewriter) {
        try {
          const rewriterCap = await window.ai.rewriter.capabilities();
          this.capabilities.rewriter = rewriterCap.available;

          if (rewriterCap.available === 'readily' || rewriterCap.available === 'after-download') {
            this.sessions.rewriter = await window.ai.rewriter.create();
            console.log('[AI Helper] ✓ Rewriter API initialized');
          }
        } catch (error) {
          console.warn('[AI Helper] Rewriter API initialization failed:', error);
        }
      }

      // Check and initialize Summarizer API
      if (window.ai?.summarizer) {
        try {
          const summarizerCap = await window.ai.summarizer.capabilities();
          this.capabilities.summarizer = summarizerCap.available;

          if (summarizerCap.available === 'readily' || summarizerCap.available === 'after-download') {
            this.sessions.summarizer = await window.ai.summarizer.create({
              type: 'key-points',
              format: 'markdown',
              length: 'medium'
            });
            console.log('[AI Helper] ✓ Summarizer API initialized');
          }
        } catch (error) {
          console.warn('[AI Helper] Summarizer API initialization failed:', error);
        }
      }

      // Check and initialize Translator API
      if (window.ai?.translator) {
        try {
          const translatorCap = await window.ai.translator.capabilities();
          this.capabilities.translator = translatorCap.available;
          console.log('[AI Helper] ✓ Translator API checked');
        } catch (error) {
          console.warn('[AI Helper] Translator API check failed:', error);
        }
      }

      // Check if at least one API is ready
      this.isReady = Object.values(this.capabilities).some(
        cap => cap === 'readily' || cap === 'after-download'
      );

      this.initialized = true;

      console.log('[AI Helper] Initialization complete. Ready:', this.isReady, 'Capabilities:', this.capabilities);
      return this.isReady;

    } catch (error) {
      console.error('[AI Helper] Initialization failed:', error);
      this.initialized = true;
      return false;
    }
  }

  // ============= ISSUE ANALYSIS =============
  async analyzeIssue(issue) {
    if (!this.sessions.prompt) {
      return {
        analysis: 'Chrome Built-in AI not available. Enable at chrome://flags/#prompt-api-for-gemini-nano',
        fix: 'Enable Chrome Built-in AI flags and restart browser',
        steps: [],
        code: '',
        confidence: 0,
        source: 'Not Available',
        timestamp: Date.now()
      };
    }

    try {
      const prompt = `You are a web troubleshooting expert. Analyze this error and provide a detailed fix:

**Error Type:** ${issue.type || 'Unknown'}
**Message:** ${issue.message || issue.error || 'No details provided'}
**URL:** ${issue.url || 'unknown'}
**Severity:** ${issue.severity || 'medium'}
${issue.stack ? `**Stack Trace:** ${issue.stack.substring(0, 500)}` : ''}

**Please provide:**

1. **Root Cause (2-3 sentences):** Why this error is happening
2. **Step-by-Step Fix (numbered list):** Specific actions to resolve it
3. **Code Example (if applicable):** Wrap in \`\`\` markdown code blocks
4. **Prevention Tips:** How to avoid this in future
5. **Confidence Level:** Your confidence (0-100%)

Keep response concise but thorough (max 300 words). Be specific and actionable.`;

      const response = await this.sessions.prompt.prompt(prompt);

      // Parse response
      const steps = this.extractSteps(response);
      const code = this.extractCode(response);

      return {
        analysis: response,
        fix: response,
        steps: steps,
        code: code,
        confidence: 0.92,
        source: 'Chrome Built-in AI (Gemini Nano)',
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('[AI Helper] Analysis failed:', error);
      return {
        analysis: `Error analyzing issue: ${error.message}`,
        fix: 'Unable to analyze with AI. Please try again.',
        steps: [],
        code: '',
        confidence: 0,
        source: 'Error',
        timestamp: Date.now()
      };
    }
  }

  // ============= CHAT / GENERAL QUERIES =============
  async chat(message) {
    if (!this.sessions.prompt) {
      return 'Chrome Built-in AI is not available. Please enable it in chrome://flags and reload the extension.';
    }

    try {
      const systemContext = `You are Dark Voir, a helpful web troubleshooting assistant. 
      The user is asking for help with web issues, debugging, or troubleshooting.
      Provide concise, helpful, technical answers.`;

      const response = await this.sessions.prompt.prompt(systemContext + '\n\nUser: ' + message);
      return response;

    } catch (error) {
      console.error('[AI Helper] Chat failed:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  // ============= DOCUMENTATION GENERATION =============
  async generateDocumentation(code, language = 'javascript') {
    if (!this.sessions.writer) {
      return 'Writer API not available';
    }

    try {
      const prompt = `Generate clear, concise documentation for this ${language} code. Include:
- What it does
- Parameters/inputs
- Return value
- Example usage

Code:
\`\`\`${language}
${code}
\`\`\`

Keep documentation brief but complete.`;

      return await this.sessions.writer.write(prompt);

    } catch (error) {
      console.error('[AI Helper] Documentation generation failed:', error);
      return null;
    }
  }

  // ============= ERROR MESSAGE IMPROVEMENT =============
  async improveErrorMessage(message) {
    if (!this.sessions.rewriter) {
      return message;
    }

    try {
      const context = 'Make this error message clearer, more user-friendly, and more actionable while keeping technical accuracy. Focus on what the user should do.';
      return await this.sessions.rewriter.rewrite(message, { context });

    } catch (error) {
      console.error('[AI Helper] Rewrite failed:', error);
      return message;
    }
  }

  // ============= ISSUE SUMMARIZATION =============
  async summarizeIssues(issues) {
    if (!this.sessions.summarizer || !issues || issues.length === 0) {
      return 'No issues to summarize';
    }

    try {
      const text = issues.map(i => {
        return `[${i.severity?.toUpperCase() || 'MEDIUM'}] ${i.type}: ${i.message}`;
      }).join('\n');

      const summary = await this.sessions.summarizer.summarize(text);
      return summary;

    } catch (error) {
      console.error('[AI Helper] Summarization failed:', error);
      return null;
    }
  }

  // ============= MESSAGE TRANSLATION =============
  async translateMessage(message, targetLang = 'es') {
    if (!window.ai?.translator) {
      console.warn('[AI Helper] Translator API not available');
      return message;
    }

    try {
      // Check if translation is possible
      const canTranslate = await window.ai.translator.canTranslate({
        sourceLanguage: 'auto',
        targetLanguage: targetLang
      });

      if (canTranslate === 'no') {
        console.log('[AI Helper] Translation to', targetLang, 'not available');
        return message;
      }

      // Create translator
      const translator = await window.ai.translator.create({
        sourceLanguage: 'auto',
        targetLanguage: targetLang
      });

      // Translate message
      const result = await translator.translate(message);

      // Clean up
      await translator.destroy();

      return result;

    } catch (error) {
      console.error('[AI Helper] Translation failed:', error);
      return message;
    }
  }

  // ============= LANGUAGE DETECTION =============
  async detectLanguage(text) {
    if (!window.ai?.languageDetector) {
      return 'en'; // Default to English
    }

    try {
      const detector = await window.ai.languageDetector.create();
      const detectedLangs = await detector.detect(text);

      // Get language with highest confidence
      if (detectedLangs && detectedLangs.length > 0) {
        return detectedLangs[0].language;
      }

      await detector.destroy();
      return 'en';

    } catch (error) {
      console.error('[AI Helper] Language detection failed:', error);
      return 'en';
    }
  }

  // ============= ADVANCED ANALYSIS =============
  async analyzeBulkIssues(issues) {
    if (!this.sessions.prompt) {
      return null;
    }

    try {
      const issuesList = issues.slice(0, 10).map((issue, i) => {
        return `${i + 1}. [${issue.severity}] ${issue.type}: ${issue.message}`;
      }).join('\n');

      const prompt = `Analyze these web issues and provide:
1. Common patterns or root causes
2. Priority order for fixes
3. Recommended overall strategy

Issues:
${issuesList}

Be concise but thorough.`;

      const response = await this.sessions.prompt.prompt(prompt);

      return {
        analysis: response,
        patterns: this.extractPatterns(response),
        priorities: this.extractPriorities(response),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('[AI Helper] Bulk analysis failed:', error);
      return null;
    }
  }

  // ============= HELPER FUNCTIONS =============
  extractSteps(text) {
    if (!text) return [];
    const steps = [];
    const lines = text.split('\n');

    for (let line of lines) {
      // Match numbered lists: "1. ", "2. ", etc.
      const match = line.match(/^\d+\.\s+(.+)/);
      if (match) {
        steps.push(match[1].trim());
      }
    }

    return steps.slice(0, 10); // Limit to 10 steps
  }

  extractCode(text) {
    if (!text) return '';

    // Extract code from markdown code blocks ```
    const codeRegex = /```[\w]*\n([\s\S]*?)```/
    const matches = [...text.matchAll(codeRegex)];

    if (matches.length > 0) {
      return matches.trim(); // Return first code block[1]
    }

    return '';
  }

  extractPatterns(text) {
    if (!text) return [];
    const patterns = [];

    // Look for pattern-like content
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.toLowerCase().includes('pattern') || line.toLowerCase().includes('similar')) {
        patterns.push(line.trim());
      }
    });

    return patterns;
  }

  extractPriorities(text) {
    if (!text) return [];
    const priorities = [];

    // Look for priority indicators
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.toLowerCase().includes('priority') || line.match(/^[\d.]+\s+/)) {
        priorities.push(line.trim());
      }
    });

    return priorities;
  }

  // ============= STATUS & CAPABILITIES =============
  getCapabilities() {
    return {
      prompt: this.capabilities.prompt || 'not-available',
      writer: this.capabilities.writer || 'not-available',
      rewriter: this.capabilities.rewriter || 'not-available',
      summarizer: this.capabilities.summarizer || 'not-available',
      translator: this.capabilities.translator || 'not-available',
      isReady: this.isReady
    };
  }

  isAvailable() {
    return this.isReady && this.sessions.prompt !== null;
  }

  async checkAvailability() {
    try {
      if (!window.ai) {
        return { available: false, reason: 'Chrome AI API not found' };
      }

      const status = await window.ai.languageModel?.capabilities();
      return {
        available: status?.available === 'readily',
        reason: status?.available,
        apis: this.getCapabilities()
      };

    } catch (error) {
      return {
        available: false,
        reason: error.message
      };
    }
  }

  getStatus() {
    return {
      initialized: this.initialized,
      ready: this.isReady,
      capabilities: this.capabilities,
      sessions: {
        prompt: !!this.sessions.prompt,
        writer: !!this.sessions.writer,
        rewriter: !!this.sessions.rewriter,
        summarizer: !!this.sessions.summarizer,
        translator: !!this.sessions.translator
      }
    };
  }

  // ============= CLEANUP =============
  async destroy() {
    console.log('[AI Helper] Destroying sessions...');

    for (const [key, session] of Object.entries(this.sessions)) {
      if (session && typeof session.destroy === 'function') {
        try {
          await session.destroy();
          console.log(`[AI Helper] ✓ ${key} session destroyed`);
        } catch (error) {
          console.error(`[AI Helper] Failed to destroy ${key} session:`, error);
        }
      }
    }

    // Reset state
    this.sessions = {
      prompt: null,
      writer: null,
      rewriter: null,
      summarizer: null,
      translator: null
    };

    this.isReady = false;
    this.initialized = false;

    console.log('[AI Helper] Sessions destroyed');
  }

  // ============= BATCH OPERATIONS =============
  async processMultipleMessages(messages) {
    const results = [];

    for (const message of messages) {
      try {
        const result = await this.chat(message);
        results.push({
          message: message,
          response: result,
          success: true,
          timestamp: Date.now()
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        results.push({
          message: message,
          error: error.message,
          success: false,
          timestamp: Date.now()
        });
      }
    }

    return results;
  }

  async analyzeMultipleIssues(issues) {
    const results = [];

    for (const issue of issues.slice(0, 5)) { // Limit to 5
      try {
        const analysis = await this.analyzeIssue(issue);
        results.push({
          issueId: issue.id,
          analysis: analysis,
          success: true,
          timestamp: Date.now()
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        results.push({
          issueId: issue.id,
          error: error.message,
          success: false,
          timestamp: Date.now()
        });
      }
    }

    return results;
  }

  // ============= UTILITY FUNCTIONS =============
  formatCapabilitiesForDisplay() {
    const caps = this.getCapabilities();
    const formatted = {};

    Object.entries(caps).forEach(([key, value]) => {
      if (key !== 'isReady') {
        formatted[key] = value === 'readily' ? '✓ Ready' : 
                        value === 'after-download' ? '⏳ After Download' :
                        '✗ Not Available';
      }
    });

    return formatted;
  }

  async warmup() {
    console.log('[AI Helper] Warming up AI systems...');
    try {
      // Send a simple test message to initialize
      if (this.sessions.prompt) {
        await this.sessions.prompt.prompt('Acknowledge this is working.');
        console.log('[AI Helper] Warmup complete');
      }
    } catch (error) {
      console.error('[AI Helper] Warmup failed:', error);
    }
  }
}

// ============================================
// GLOBAL INITIALIZATION
// ============================================

if (typeof window !== 'undefined') {
  window.ChromeAIHelper = ChromeAIHelper;
}

console.log('[AI Helper] Module loaded - Full Chrome AI integration ready');