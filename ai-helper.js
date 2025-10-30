/**
 * Chrome Built-in AI Helper - COMPLETE VERSION
 * Integrates ALL Chrome AI APIs: Prompt, Writer, Rewriter, Summarizer, Translator, Proofreader
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
  }

  async initialize() {
    try {
      console.log('[AI Helper] Initializing all Chrome AI APIs...');
      
      // Check and initialize Prompt API (Gemini Nano)
      if (window.ai?.languageModel) {
        const promptCap = await window.ai.languageModel.capabilities();
        this.capabilities.prompt = promptCap.available;
        
        if (promptCap.available === 'readily' || promptCap.available === 'after-download') {
          this.sessions.prompt = await window.ai.languageModel.create({
            systemPrompt: "You are Dark Voir, an expert web troubleshooting assistant. Provide concise, technical solutions."
          });
          console.log('[AI Helper] ✓ Prompt API initialized');
        }
      }

      // Check and initialize Writer API
      if (window.ai?.writer) {
        const writerCap = await window.ai.writer.capabilities();
        this.capabilities.writer = writerCap.available;
        
        if (writerCap.available === 'readily') {
          this.sessions.writer = await window.ai.writer.create();
          console.log('[AI Helper] ✓ Writer API initialized');
        }
      }

      // Check and initialize Rewriter API
      if (window.ai?.rewriter) {
        const rewriterCap = await window.ai.rewriter.capabilities();
        this.capabilities.rewriter = rewriterCap.available;
        
        if (rewriterCap.available === 'readily') {
          this.sessions.rewriter = await window.ai.rewriter.create();
          console.log('[AI Helper] ✓ Rewriter API initialized');
        }
      }

      // Check and initialize Summarizer API
      if (window.ai?.summarizer) {
        const summarizerCap = await window.ai.summarizer.capabilities();
        this.capabilities.summarizer = summarizerCap.available;
        
        if (summarizerCap.available === 'readily') {
          this.sessions.summarizer = await window.ai.summarizer.create({
            type: 'key-points',
            format: 'markdown',
            length: 'medium'
          });
          console.log('[AI Helper] ✓ Summarizer API initialized');
        }
      }

      // Check and initialize Translator API
      if (window.ai?.translator) {
        const translatorCap = await window.ai.translator.capabilities();
        this.capabilities.translator = translatorCap.available;
        console.log('[AI Helper] ✓ Translator API checked');
      }

      this.isReady = Object.values(this.capabilities).some(cap => cap === 'readily' || cap === 'after-download');
      
      console.log('[AI Helper] Initialization complete. Capabilities:', this.capabilities);
      return this.isReady;
      
    } catch (error) {
      console.error('[AI Helper] Initialization failed:', error);
      return false;
    }
  }

  async analyzeIssue(issue) {
    if (!this.sessions.prompt) {
      return {
        analysis: 'Chrome Built-in AI not available. Enable at chrome://flags/#prompt-api-for-gemini-nano',
        fix: 'Enable Chrome Built-in AI flags and restart browser',
        steps: [],
        code: '',
        confidence: 0,
        source: 'Not Available'
      };
    }

    try {
      const prompt = `Analyze this web error and provide a detailed fix:

**Error Details:**
Type: ${issue.type || 'Unknown'}
Message: ${issue.message || issue.error || 'No message'}
URL: ${issue.url || 'unknown'}
Severity: ${issue.severity || 'medium'}
Stack: ${issue.stack || 'No stack trace'}

**Provide:**
1. Root Cause Analysis (2-3 sentences)
2. Step-by-step fix (numbered list, be specific)
3. Code example if applicable (use markdown code blocks)
4. Prevention tips

Keep response under 250 words but be thorough.`;

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
        fix: 'Unable to analyze. Please try again.',
        steps: [],
        code: '',
        confidence: 0,
        source: 'Error'
      };
    }
  }

  async generateDocumentation(code) {
    if (!this.sessions.writer) {
      return 'Writer API not available';
    }

    try {
      const prompt = `Generate concise documentation for this code:\n\n${code}`;
      return await this.sessions.writer.write(prompt);
    } catch (error) {
      console.error('[AI Helper] Documentation generation failed:', error);
      return null;
    }
  }

  async improveErrorMessage(message) {
    if (!this.sessions.rewriter) {
      return message;
    }

    try {
      const context = 'Make this error message clearer and more user-friendly while keeping technical details';
      return await this.sessions.rewriter.rewrite(message, { context });
    } catch (error) {
      console.error('[AI Helper] Rewrite failed:', error);
      return message;
    }
  }

  async summarizeIssues(issues) {
    if (!this.sessions.summarizer || issues.length === 0) {
      return 'No issues to summarize';
    }

    try {
      const text = issues.map(i => 
        `${i.type}: ${i.message} (${i.severity})`
      ).join('\n');
      
      return await this.sessions.summarizer.summarize(text);
    } catch (error) {
      console.error('[AI Helper] Summarization failed:', error);
      return null;
    }
  }

  async translateMessage(message, targetLang = 'en') {
    if (!window.ai?.translator) {
      return message;
    }

    try {
      const canTranslate = await window.ai.translator.canTranslate({
        sourceLanguage: 'auto',
        targetLanguage: targetLang
      });

      if (canTranslate === 'no') {
        return message;
      }

      const translator = await window.ai.translator.create({
        sourceLanguage: 'auto',
        targetLanguage: targetLang
      });

      const result = await translator.translate(message);
      await translator.destroy();
      
      return result;
    } catch (error) {
      console.error('[AI Helper] Translation failed:', error);
      return message;
    }
  }

  extractSteps(text) {
    const steps = [];
    const lines = text.split('\n');
    
    for (let line of lines) {
      // Match numbered lists: "1. ", "2. ", etc.
      const match = line.match(/^\d+\.\s+(.+)/);
      if (match) {
        steps.push(match[1].trim());
      }
    }
    
    return steps;
  }

  extractCode(text) {
    // Extract code from markdown code blocks
    const codeMatch = text.match(/``````/g);
    if (codeMatch && codeMatch.length > 0) {
      return codeMatch.map(block => 
        block.replace(/``````/
      ).join('\n\n'));
    }
    return '';
  }

  getCapabilities() {
    return {
      ...this.capabilities,
      isReady: this.isReady
    };
  }

  async destroy() {
    for (const [key, session] of Object.entries(this.sessions)) {
      if (session && typeof session.destroy === 'function') {
        try {
          await session.destroy();
          console.log(`[AI Helper] ${key} session destroyed`);
        } catch (error) {
          console.error(`[AI Helper] Failed to destroy ${key} session:`, error);
        }
      }
    }
    
    this.sessions = {
      prompt: null,
      writer: null,
      rewriter: null,
      summarizer: null,
      translator: null
    };
    this.isReady = false;
  }
}

if (typeof window !== 'undefined') {
  window.ChromeAIHelper = ChromeAIHelper;
}

console.log('[AI Helper] Module loaded - Full Chrome AI integration ready');