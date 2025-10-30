/**
 * Dark Voir Self-Learning AI Brain
 * Uses free APIs + local learning + self-correction
 */

class AIBrain {
    constructor() {
        this.learningDB = null;
        this.apiKeys = {
            huggingface: 'hf_demo', // Free tier
            cohere: 'free-trial-key', // Sign up at cohere.ai
            openrouter: 'sk-or-v1-demo' // OpenRouter free tier
        };
        this.knowledgeBase = new Map();
        this.errorPatterns = new Map();
        this.successPatterns = new Map();
        this.init();
    }

    async init() {
        await this.loadLearningData();
        console.log('[AI Brain] Initialized with learning capabilities');
    }

    async loadLearningData() {
        try {
            const result = await chrome.storage.local.get('ai_learning_data');
            if (result.ai_learning_data) {
                this.knowledgeBase = new Map(result.ai_learning_data.knowledge || []);
                this.errorPatterns = new Map(result.ai_learning_data.errors || []);
                this.successPatterns = new Map(result.ai_learning_data.success || []);
            }
        } catch (error) {
            console.error('[AI Brain] Failed to load learning data:', error);
        }
    }

    async saveLearningData() {
        try {
            await chrome.storage.local.set({
                'ai_learning_data': {
                    knowledge: Array.from(this.knowledgeBase.entries()),
                    errors: Array.from(this.errorPatterns.entries()),
                    success: Array.from(this.successPatterns.entries()),
                    lastUpdated: Date.now()
                }
            });
        } catch (error) {
            console.error('[AI Brain] Failed to save learning data:', error);
        }
    }

    // Learn from successful fixes
    async learnFromSuccess(issue, fix, userFeedback) {
        const pattern = this.extractPattern(issue);
        const currentSuccess = this.successPatterns.get(pattern) || { count: 0, fixes: [] };
        
        currentSuccess.count++;
        currentSuccess.fixes.push({
            fix: fix,
            feedback: userFeedback,
            timestamp: Date.now()
        });

        this.successPatterns.set(pattern, currentSuccess);
        await this.saveLearningData();
        
        console.log(`[AI Brain] Learned successful pattern: ${pattern}`);
    }

    // Learn from failures
    async learnFromFailure(issue, attemptedFix, reason) {
        const pattern = this.extractPattern(issue);
        const currentError = this.errorPatterns.get(pattern) || { count: 0, failures: [] };
        
        currentError.count++;
        currentError.failures.push({
            fix: attemptedFix,
            reason: reason,
            timestamp: Date.now()
        });

        this.errorPatterns.set(pattern, currentError);
        await this.saveLearningData();
        
        // Auto-correct: If same error happens 3 times, search for solution
        if (currentError.count >= 3) {
            await this.autoCorrect(issue, pattern);
        }
    }

    extractPattern(issue) {
        // Extract key features from issue
        const type = issue.type || 'unknown';
        const keywords = this.extractKeywords(issue.message || '');
        return `${type}:${keywords.join(',')}`;
    }

    extractKeywords(text) {
        // Simple keyword extraction
        const stopWords = ['the', 'a', 'an', 'is', 'was', 'are', 'were', 'in', 'on', 'at'];
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        return words
            .filter(w => w.length > 3 && !stopWords.includes(w))
            .slice(0, 5);
    }

    // Auto-correct by searching internet for solutions
    async autoCorrect(issue, pattern) {
        console.log(`[AI Brain] Auto-correcting pattern: ${pattern}`);
        
        try {
            // Search for solution online
            const solution = await this.searchForSolution(issue);
            
            if (solution) {
                this.knowledgeBase.set(pattern, {
                    solution: solution,
                    confidence: 0.7,
                    source: 'auto-learned',
                    timestamp: Date.now()
                });
                await this.saveLearningData();
                console.log(`[AI Brain] Auto-corrected: ${pattern}`);
            }
        } catch (error) {
            console.error('[AI Brain] Auto-correction failed:', error);
        }
    }

    async searchForSolution(issue) {
        // Search multiple sources
        const searchQuery = `${issue.type} ${issue.message} solution fix`;
        
        try {
            // Try Stack Overflow API
            const stackOverflow = await this.searchStackOverflow(searchQuery);
            if (stackOverflow) return stackOverflow;

            // Try GitHub API
            const github = await this.searchGitHub(searchQuery);
            if (github) return github;

            // Try web scraping (MDN, W3C)
            const webDocs = await this.searchWebDocs(searchQuery);
            if (webDocs) return webDocs;

        } catch (error) {
            console.error('[AI Brain] Search failed:', error);
        }

        return null;
    }

    async searchStackOverflow(query) {
        try {
            const response = await fetch(
                `https://api.stackexchange.com/2.3/search/advanced?` +
                `order=desc&sort=relevance&q=${encodeURIComponent(query)}&` +
                `site=stackoverflow&filter=withbody`
            );
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const topAnswer = data.items[0];
                return {
                    title: topAnswer.title,
                    solution: this.extractSolution(topAnswer.body),
                    link: topAnswer.link,
                    source: 'stackoverflow'
                };
            }
        } catch (error) {
            console.error('[AI Brain] Stack Overflow search failed:', error);
        }
        return null;
    }

    async searchGitHub(query) {
        try {
            const response = await fetch(
                `https://api.github.com/search/issues?` +
                `q=${encodeURIComponent(query)}+is:issue+is:closed&` +
                `sort=relevance&per_page=5`
            );
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const topIssue = data.items[0];
                return {
                    title: topIssue.title,
                    solution: topIssue.body,
                    link: topIssue.html_url,
                    source: 'github'
                };
            }
        } catch (error) {
            console.error('[AI Brain] GitHub search failed:', error);
        }
        return null;
    }

    async searchWebDocs(query) {
        // Search MDN or other documentation
        try {
            const searchUrl = `https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(query)}`;
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (data.documents && data.documents.length > 0) {
                const topDoc = data.documents[0];
                return {
                    title: topDoc.title,
                    solution: topDoc.summary,
                    link: `https://developer.mozilla.org${topDoc.mdn_url}`,
                    source: 'mdn'
                };
            }
        } catch (error) {
            console.error('[AI Brain] Web docs search failed:', error);
        }
        return null;
    }

    extractSolution(htmlText) {
        // Extract text from HTML
        const div = document.createElement('div');
        div.innerHTML = htmlText;
        return div.textContent || div.innerText || '';
    }

    // Main analysis function with AI
    async analyzeIssue(issue) {
        const pattern = this.extractPattern(issue);
        
        // Check if we already learned this
        if (this.knowledgeBase.has(pattern)) {
            const learned = this.knowledgeBase.get(pattern);
            console.log(`[AI Brain] Using learned solution for: ${pattern}`);
            return learned.solution;
        }

        // Check success patterns
        if (this.successPatterns.has(pattern)) {
            const successData = this.successPatterns.get(pattern);
            if (successData.count >= 2) {
                // Use most successful fix
                const bestFix = successData.fixes
                    .sort((a, b) => (b.feedback || 0) - (a.feedback || 0))[0];
                return bestFix.fix;
            }
        }

        // Try multiple AI APIs in parallel
        const analyses = await Promise.allSettled([
            this.analyzeWithHuggingFace(issue),
            this.analyzeWithCohere(issue),
            this.analyzeWithLocalAI(issue)
        ]);

        // Return best result
        for (const result of analyses) {
            if (result.status === 'fulfilled' && result.value) {
                return result.value;
            }
        }

        // Fallback: search internet
        const solution = await this.searchForSolution(issue);
        if (solution) {
            return {
                technical: solution.solution,
                simplified: solution.title,
                source: solution.source,
                link: solution.link
            };
        }

        // Last resort: rule-based analysis
        return this.ruleBasedAnalysis(issue);
    }

    async analyzeWithHuggingFace(issue) {
        try {
            const response = await fetch(
                'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKeys.huggingface}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: `Analyze this web issue and provide a fix: ${issue.type} - ${issue.message}`,
                        parameters: {
                            max_length: 200,
                            min_length: 50
                        }
                    })
                }
            );

            const data = await response.json();
            if (data && data[0] && data[0].summary_text) {
                return {
                    technical: data[0].summary_text,
                    simplified: data[0].summary_text,
                    source: 'huggingface'
                };
            }
        } catch (error) {
            console.error('[AI Brain] Hugging Face failed:', error);
        }
        return null;
    }

    async analyzeWithCohere(issue) {
        try {
            const response = await fetch(
                'https://api.cohere.ai/v1/generate',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKeys.cohere}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'command',
                        prompt: `You are a web troubleshooting expert. Analyze this issue and provide a concise fix:\n\nIssue Type: ${issue.type}\nError: ${issue.message}\n\nProvide:
1. What caused it
2. How to fix it
3. Prevention tips`,
                        max_tokens: 200,
                        temperature: 0.5
                    })
                }
            );

            const data = await response.json();
            if (data && data.generations && data.generations[0]) {
                const text = data.generations[0].text;
                return {
                    technical: text,
                    simplified: text.split('\n')[0],
                    source: 'cohere'
                };
            }
        } catch (error) {
            console.error('[AI Brain] Cohere failed:', error);
        }
        return null;
    }

    async analyzeWithLocalAI(issue) {
        // Use our built-in rules + learning
        return this.ruleBasedAnalysis(issue);
    }

    ruleBasedAnalysis(issue) {
        const rules = {
            'javascript_error': {
                'undefined': 'Variable is being used before it\'s defined. Check variable declarations and script load order.',
                'ResizeObserver': 'Common browser issue during layout calculations. Usually harmless, but can be fixed with requestAnimationFrame.',
                'null': 'Trying to access property of null/undefined. Add null checks before accessing properties.',
                'default': 'JavaScript error detected. Check console for full stack trace and verify all dependencies are loaded.'
            },
            'performance_issue': {
                'Layout shift': 'Reserve space for dynamic content using width/height attributes or CSS aspect-ratio.',
                'default': 'Performance can be improved by optimizing images, lazy loading, and reducing JavaScript execution time.'
            },
            'network_error': {
                'default': 'Network request failed. Check connection, URL, and implement retry logic with exponential backoff.'
            }
        };

        const type = issue.type || 'unknown';
        const message = issue.message || '';

        if (rules[type]) {
            for (const [keyword, solution] of Object.entries(rules[type])) {
                if (message.includes(keyword) || keyword === 'default') {
                    return {
                        technical: solution,
                        simplified: solution,
                        source: 'rule-based'
                    };
                }
            }
        }

        return {
            technical: 'Unable to analyze this specific issue automatically.',
            simplified: 'This issue requires manual investigation. Check DevTools for more details.',
            source: 'fallback'
        };
    }

    // Self-update mechanism
    async checkForUpdates() {
        try {
            // Check for new patterns from community
            const communityData = await this.fetchCommunityLearning();
            if (communityData) {
                await this.mergeCommunityLearning(communityData);
            }

            // Update API keys if needed
            await this.refreshAPIKeys();

            console.log('[AI Brain] Self-update completed');
        } catch (error) {
            console.error('[AI Brain] Self-update failed:', error);
        }
    }

    async fetchCommunityLearning() {
        // Could connect to a central server or GitHub repo
        // For now, returns null (implement based on your setup)
        return null;
    }

    async mergeCommunityLearning(data) {
        // Merge learned patterns from community
        for (const [pattern, solution] of data.patterns) {
            if (!this.knowledgeBase.has(pattern)) {
                this.knowledgeBase.set(pattern, solution);
            }
        }
        await this.saveLearningData();
    }

    async refreshAPIKeys() {
        // Could fetch updated keys from secure storage
        // Implement based on your setup
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIBrain;
}