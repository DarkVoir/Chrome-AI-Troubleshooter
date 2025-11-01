/**
 * Dark Voir AI Troubleshooter - Visual Guide System
 * Interactive step-by-step visual guidance with highlights and messages
 * CORE feature for human-like practical guidance
 */

class VisualGuide {
  constructor() {
    this.isActive = false;
    this.currentStep = 0;
    this.steps = [];
    this.overlayElement = null;
    this.highlightElement = null;
    this.messageElement = null;
    this.pointerElement = null;
    this.controlsElement = null;
    this.indicatorElement = null;
    this.guideHistory = [];
    this.setupStyles();
  }

  // ============= STYLE SETUP =============
  setupStyles() {
    if (document.getElementById('dark-voir-visual-guide-styles')) return;

    const style = document.createElement('style');
    style.id = 'dark-voir-visual-guide-styles';
    style.textContent = `
      .dark-voir-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 999998;
        pointer-events: none;
      }

      .dark-voir-highlight {
        position: fixed;
        border: 3px solid #00d9ff;
        border-radius: 8px;
        box-shadow: 0 0 0 4px rgba(0, 217, 255, 0.3),
                    0 0 20px 8px rgba(0, 217, 255, 0.5),
                    inset 0 0 20px rgba(0, 217, 255, 0.2);
        z-index: 999999;
        pointer-events: none;
        animation: dark-voir-pulse 2s infinite;
        transition: all 0.3s ease;
      }

      @keyframes dark-voir-pulse {
        0%, 100% {
          box-shadow: 0 0 0 4px rgba(0, 217, 255, 0.3),
                      0 0 20px 8px rgba(0, 217, 255, 0.5),
                      inset 0 0 20px rgba(0, 217, 255, 0.2);
        }
        50% {
          box-shadow: 0 0 0 6px rgba(0, 217, 255, 0.5),
                      0 0 30px 12px rgba(0, 217, 255, 0.7),
                      inset 0 0 30px rgba(0, 217, 255, 0.3);
        }
      }

      .dark-voir-message {
        position: fixed;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        max-width: 320px;
        z-index: 1000000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: dark-voir-message-appear 0.3s ease;
        word-wrap: break-word;
      }

      @keyframes dark-voir-message-appear {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dark-voir-message::before {
        content: '';
        position: absolute;
        border: 10px solid transparent;
      }

      .dark-voir-message.position-top::before {
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #667eea;
      }

      .dark-voir-message.position-bottom::before {
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #764ba2;
      }

      .dark-voir-message.position-left::before {
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: #667eea;
      }

      .dark-voir-message.position-right::before {
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: #764ba2;
      }

      .dark-voir-message.success {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      }

      .dark-voir-message.success::before {
        border-top-color: #4CAF50;
        border-bottom-color: #45a049;
        border-left-color: #4CAF50;
        border-right-color: #45a049;
      }

      .dark-voir-message.error {
        background: linear-gradient(135deg, #F44336 0%, #d32f2f 100%);
      }

      .dark-voir-message.error::before {
        border-top-color: #F44336;
        border-bottom-color: #d32f2f;
        border-left-color: #F44336;
        border-right-color: #d32f2f;
      }

      .dark-voir-pointer {
        position: fixed;
        width: 50px;
        height: 50px;
        font-size: 40px;
        z-index: 1000001;
        animation: dark-voir-pointer-pulse 1s infinite;
        pointer-events: none;
        text-align: center;
        line-height: 1.25;
      }

      @keyframes dark-voir-pointer-pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
      }

      .dark-voir-step-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        z-index: 1000002;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .dark-voir-controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 12px 16px;
        border-radius: 30px;
        display: flex;
        gap: 12px;
        z-index: 1000002;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      }

      .dark-voir-controls button {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .dark-voir-controls button:hover {
        background: #764ba2;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .dark-voir-controls button:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
      }
    `;

    document.head.appendChild(style);
    console.log('[Visual Guide] Styles initialized');
  }

  // ============= GUIDE CONTROL =============
  async start(steps) {
    if (this.isActive) {
      console.log('[Visual Guide] Guide already active, stopping current guide');
      this.stop();
    }

    if (!steps || steps.length === 0) {
      console.warn('[Visual Guide] No steps provided');
      return;
    }

    this.steps = steps;
    this.currentStep = 0;
    this.isActive = true;
    this.guideHistory = [];

    console.log('[Visual Guide] Started with', steps.length, 'steps');

    // Create overlay and controls
    this.createOverlay();

    // Show first step
    await this.showStep(0);
  }

  createOverlay() {
    // Create dark overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'dark-voir-overlay';
    document.body.appendChild(this.overlayElement);

    // Create step indicator
    this.indicatorElement = document.createElement('div');
    this.indicatorElement.className = 'dark-voir-step-indicator';
    this.indicatorElement.id = 'dark-voir-step-indicator';
    this.indicatorElement.textContent = `Step 1 of ${this.steps.length}`;
    document.body.appendChild(this.indicatorElement);

    // Create controls
    this.controlsElement = document.createElement('div');
    this.controlsElement.className = 'dark-voir-controls';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = true;
    prevBtn.onclick = () => this.previousStep();
    prevBtn.id = 'dark-voir-prev-btn';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.id = 'dark-voir-next-btn';
    nextBtn.onclick = () => this.nextStep();

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Exit Guide';
    skipBtn.style.background = '#999';
    skipBtn.onclick = () => this.stop();

    this.controlsElement.appendChild(prevBtn);
    this.controlsElement.appendChild(nextBtn);
    this.controlsElement.appendChild(skipBtn);
    document.body.appendChild(this.controlsElement);

    console.log('[Visual Guide] Overlay created');
  }

  async showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      console.warn('[Visual Guide] Invalid step index:', stepIndex);
      return;
    }

    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];

    console.log('[Visual Guide] Showing step', stepIndex + 1, 'of', this.steps.length);

    // Update indicator
    if (this.indicatorElement) {
      this.indicatorElement.textContent = `Step ${stepIndex + 1} of ${this.steps.length}`;
    }

    // Update button states
    this.updateButtonStates();

    // Find target element
    const element = this.findStepElement(step);

    if (!element) {
      console.warn('[Visual Guide] Element not found for step:', step);
      this.showErrorMessage('Could not find the element. Moving to next step...');
      await this.sleep(2000);
      return this.nextStep();
    }

    // Scroll into view
    this.scrollToElement(element);
    await this.sleep(300);

    // Highlight element
    this.highlightElement(element);

    // Show message
    this.showMessage(element, step.message, step.description);

    // Show pointer
    if (step.action === 'click' || step.action === 'hover' || step.action === 'type') {
      this.showPointer(element);
    }

    // Store in history
    this.guideHistory.push({
      step: stepIndex,
      timestamp: Date.now(),
      element: step
    });

    // Auto-execute if specified
    if (step.autoExecute) {
      await this.sleep(1500);
      this.executeAction(element, step);
    }
  }

  findStepElement(step) {
    if (!step) return null;

    // Try selector first
    if (step.selector) {
      try {
        const el = document.querySelector(step.selector);
        if (el && this.isElementVisible(el)) {
          return el;
        }
      } catch (error) {
        console.warn('[Visual Guide] Selector query failed:', step.selector, error);
      }
    }

    // Try finding by text
    if (step.text) {
      const text = step.text.toLowerCase();
      const elements = document.querySelectorAll('button, a, input, [role="button"], label');

      for (let el of elements) {
        if (el.textContent?.toLowerCase().includes(text) && this.isElementVisible(el)) {
          return el;
        }
      }
    }

    // Try finding by aria-label
    if (step.ariaLabel) {
      const el = document.querySelector(`[aria-label="${step.ariaLabel}"]`);
      if (el && this.isElementVisible(el)) {
        return el;
      }
    }

    return null;
  }

  isElementVisible(element) {
    if (!element) return false;

    try {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return rect.width > 0 &&
             rect.height > 0 &&
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0';
    } catch (error) {
      return false;
    }
  }

  highlightElement(element) {
    if (!element) return;

    // Remove old highlight
    if (this.highlightElement) {
      this.highlightElement.remove();
    }

    // Create new highlight
    const rect = element.getBoundingClientRect();
    this.highlightElement = document.createElement('div');
    this.highlightElement.className = 'dark-voir-highlight';
    this.highlightElement.style.top = (rect.top + window.scrollY - 5) + 'px';
    this.highlightElement.style.left = (rect.left + window.scrollX - 5) + 'px';
    this.highlightElement.style.width = (rect.width + 10) + 'px';
    this.highlightElement.style.height = (rect.height + 10) + 'px';

    document.body.appendChild(this.highlightElement);
  }

  showMessage(element, message, description) {
    if (!element) return;

    // Remove old message
    if (this.messageElement) {
      this.messageElement.remove();
    }

    // Create message
    const rect = element.getBoundingClientRect();
    this.messageElement = document.createElement('div');
    this.messageElement.className = 'dark-voir-message';

    // Combine message and description
    const fullMessage = description ? `${message}\n\n${description}` : message;
    this.messageElement.textContent = fullMessage;

    // Calculate best position
    const position = this.calculateBestPosition(rect);
    this.messageElement.classList.add(`position-${position}`);

    // Position message
    this.positionMessage(position, rect);

    document.body.appendChild(this.messageElement);
  }

  calculateBestPosition(rect) {
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    const spaces = [
      { position: 'top', space: spaceTop },
      { position: 'bottom', space: spaceBottom },
      { position: 'left', space: spaceLeft },
      { position: 'right', space: spaceRight }
    ];

    spaces.sort((a, b) => b.space - a.space);
    return spaces[0].position;
  }

  positionMessage(position, rect) {
    const offset = 20;
    const msgWidth = 320;
    const msgHeight = 100;

    switch (position) {
      case 'top':
        this.messageElement.style.left = (rect.left + rect.width / 2 - msgWidth / 2) + 'px';
        this.messageElement.style.top = (rect.top + window.scrollY - msgHeight - offset) + 'px';
        break;

      case 'bottom':
        this.messageElement.style.left = (rect.left + rect.width / 2 - msgWidth / 2) + 'px';
        this.messageElement.style.top = (rect.bottom + window.scrollY + offset) + 'px';
        break;

      case 'left':
        this.messageElement.style.left = (rect.left + window.scrollX - msgWidth - offset) + 'px';
        this.messageElement.style.top = (rect.top + window.scrollY + rect.height / 2 - msgHeight / 2) + 'px';
        break;

      case 'right':
        this.messageElement.style.left = (rect.right + window.scrollX + offset) + 'px';
        this.messageElement.style.top = (rect.top + window.scrollY + rect.height / 2 - msgHeight / 2) + 'px';
        break;
    }
  }

  showPointer(element) {
    if (!element) return;

    // Remove old pointer
    if (this.pointerElement) {
      this.pointerElement.remove();
    }

    // Create pointer
    const rect = element.getBoundingClientRect();
    this.pointerElement = document.createElement('div');
    this.pointerElement.className = 'dark-voir-pointer';
    this.pointerElement.textContent = '👆';
    this.pointerElement.style.left = (rect.left + rect.width / 2 - 25 + window.scrollX) + 'px';
    this.pointerElement.style.top = (rect.top - 60 + window.scrollY) + 'px';

    document.body.appendChild(this.pointerElement);
  }

  executeAction(element, step) {
    if (!element || !step.action) return;

    try {
      switch (step.action) {
        case 'click':
          element.click();
          console.log('[Visual Guide] Clicked element');
          break;

        case 'type':
          element.focus();
          if (step.value) {
            element.value = step.value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
          console.log('[Visual Guide] Typed in element');
          break;

        case 'hover':
          element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          console.log('[Visual Guide] Hovered over element');
          break;

        case 'scroll':
          this.scrollToElement(element);
          console.log('[Visual Guide] Scrolled to element');
          break;

        case 'focus':
          element.focus();
          console.log('[Visual Guide] Focused element');
          break;
      }
    } catch (error) {
      console.error('[Visual Guide] Failed to execute action:', error);
    }
  }

  // ============= NAVIGATION =============
  async nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      await this.showStep(this.currentStep + 1);
    } else {
      this.complete();
    }
  }

  async previousStep() {
    if (this.currentStep > 0) {
      await this.showStep(this.currentStep - 1);
    }
  }

  updateButtonStates() {
    const prevBtn = document.getElementById('dark-voir-prev-btn');
    const nextBtn = document.getElementById('dark-voir-next-btn');

    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 0;
    }

    if (nextBtn) {
      nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Complete' : 'Next →';
    }
  }

  complete() {
    this.showSuccessMessage('✅ Guide completed successfully!');
    console.log('[Visual Guide] Guide completed');
    setTimeout(() => this.stop(), 2000);
  }

  // ============= MESSAGES =============
  showSuccessMessage(message) {
    if (this.messageElement) {
      this.messageElement.textContent = message;
      this.messageElement.classList.add('success');
      this.messageElement.classList.remove('error');
    }
  }

  showErrorMessage(message) {
    if (this.messageElement) {
      this.messageElement.textContent = message;
      this.messageElement.classList.add('error');
      this.messageElement.classList.remove('success');
    }
  }

  // ============= CLEANUP =============
  stop() {
    this.isActive = false;

    // Remove all elements
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }

    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }

    if (this.messageElement) {
      this.messageElement.remove();
      this.messageElement = null;
    }

    if (this.pointerElement) {
      this.pointerElement.remove();
      this.pointerElement = null;
    }

    if (this.indicatorElement) {
      this.indicatorElement.remove();
      this.indicatorElement = null;
    }

    if (this.controlsElement) {
      this.controlsElement.remove();
      this.controlsElement = null;
    }

    this.steps = [];
    this.currentStep = 0;
    this.guideHistory = [];

    console.log('[Visual Guide] Guide stopped and cleaned up');
  }

  // ============= UTILITIES =============
  scrollToElement(element) {
    if (!element) return;

    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    } catch (error) {
      console.warn('[Visual Guide] Scroll failed:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isGuideActive() {
    return this.isActive;
  }

  getCurrentStep() {
    return this.currentStep;
  }

  getTotalSteps() {
    return this.steps.length;
  }

  getHistory() {
    return [...this.guideHistory];
  }

  getStatus() {
    return {
      isActive: this.isActive,
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      progress: this.steps.length > 0 ? ((this.currentStep + 1) / this.steps.length * 100).toFixed(0) + '%' : '0%'
    };
  }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (event) => {
  if (!window.visualGuide || !window.visualGuide.isGuideActive()) return;

  if (event.key === 'Escape') {
    window.visualGuide.stop();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    window.visualGuide.nextStep();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    window.visualGuide.previousStep();
  }
});

// ============================================
// INITIALIZE GLOBAL INSTANCE
// ============================================

const visualGuide = new VisualGuide();

if (typeof window !== 'undefined') {
  window.VisualGuide = VisualGuide;
  window.visualGuide = visualGuide;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisualGuide, visualGuide };
}

console.log('[Visual Guide] Module loaded and ready');