/**
 * Dark Voir AI Troubleshooter - Visual Guide System
 * Interactive step-by-step visual guidance with highlights and messages
 * This is the CORE feature for human-like practical guidance
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
    this.setupStyles();
  }

  /**
   * Setup CSS styles for visual guide
   * @private
   */
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
        position: absolute;
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
        0%, 100% { box-shadow: 0 0 0 4px rgba(0, 217, 255, 0.3),
                                0 0 20px 8px rgba(0, 217, 255, 0.5),
                                inset 0 0 20px rgba(0, 217, 255, 0.2); }
        50% { box-shadow: 0 0 0 6px rgba(0, 217, 255, 0.5),
                          0 0 30px 12px rgba(0, 217, 255, 0.7),
                          inset 0 0 30px rgba(0, 217, 255, 0.3); }
      }
      
      .dark-voir-message {
        position: absolute;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        max-width: 300px;
        z-index: 1000000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: dark-voir-message-appear 0.3s ease;
      }
      
      @keyframes dark-voir-message-appear {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .dark-voir-message:before {
        content: '';
        position: absolute;
        border: 10px solid transparent;
      }
      
      .dark-voir-message.position-top:before {
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #667eea;
      }
      
      .dark-voir-message.position-bottom:before {
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #764ba2;
      }
      
      .dark-voir-message.position-left:before {
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: #667eea;
      }
      
      .dark-voir-message.position-right:before {
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: #764ba2;
      }
      
      .dark-voir-pointer {
        position: absolute;
        width: 40px;
        height: 40px;
        font-size: 40px;
        z-index: 1000001;
        animation: dark-voir-pointer-pulse 1s infinite;
        pointer-events: none;
      }
      
      @keyframes dark-voir-pointer-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
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
  }

  /**
   * Start visual guide with steps
   * @param {Array} steps - Array of step objects
   */
  async start(steps) {
    if (this.isActive) {
      this.stop();
    }
    
    this.steps = steps;
    this.currentStep = 0;
    this.isActive = true;
    
    logger.info('Visual guide started', { stepCount: steps.length });
    
    // Create overlay
    this.createOverlay();
    
    // Show first step
    await this.showStep(0);
  }

  /**
   * Create overlay and controls
   * @private
   */
  createOverlay() {
    // Create dark overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'dark-voir-overlay';
    document.body.appendChild(this.overlayElement);
    
    // Create step indicator
    const indicator = document.createElement('div');
    indicator.className = 'dark-voir-step-indicator';
    indicator.id = 'dark-voir-step-indicator';
    indicator.textContent = `Step 1 of ${this.steps.length}`;
    document.body.appendChild(indicator);
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'dark-voir-controls';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.onclick = () => this.previousStep();
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.id = 'dark-voir-next-btn';
    nextBtn.onclick = () => this.nextStep();
    
    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Exit Guide';
    skipBtn.onclick = () => this.stop();
    
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(skipBtn);
    document.body.appendChild(controls);
  }

  /**
   * Show specific step
   * @param {number} stepIndex - Step index to show
   */
  async showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return;
    
    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];
    
    logger.debug('Showing step', step);
    
    // Update step indicator
    const indicator = document.getElementById('dark-voir-step-indicator');
    if (indicator) {
      indicator.textContent = `Step ${stepIndex + 1} of ${this.steps.length}`;
    }
    
    // Find target element
    const element = this.findStepElement(step);
    if (!element) {
      logger.warn('Element not found for step', step);
      this.showErrorMessage('Could not find the element. Skipping to next step...');
      await DarkVoirUtils.sleep(2000);
      return this.nextStep();
    }
    
    // Scroll element into view
    DarkVoirUtils.scrollToElement(element);
    await DarkVoirUtils.sleep(300);
    
    // Highlight element
    this.highlightTargetElement(element);
    
    // Show message
    this.showMessage(element, step.message, step.action);
    
    // Show pointer if needed
    if (step.action === 'click' || step.action === 'hover') {
      this.showPointer(element);
    }
    
    // Auto-execute action if specified
    if (step.autoExecute) {
      await DarkVoirUtils.sleep(1500);
      this.executeStepAction(element, step);
    }
  }

  /**
   * Find element for step
   * @private
   */
  findStepElement(step) {
    if (step.selector) {
      const el = document.querySelector(step.selector);
      if (el) return el;
    }
    
    if (step.text) {
      return DarkVoirUtils.findElement(null, step.text);
    }
    
    return null;
  }

  /**
   * Highlight target element
   * @private
   */
  highlightTargetElement(element) {
    // Remove old highlight
    if (this.highlightElement) {
      this.highlightElement.remove();
    }
    
    const rect = element.getBoundingClientRect();
    
    this.highlightElement = document.createElement('div');
    this.highlightElement.className = 'dark-voir-highlight';
    this.highlightElement.style.top = `${rect.top + window.scrollY - 5}px`;
    this.highlightElement.style.left = `${rect.left + window.scrollX - 5}px`;
    this.highlightElement.style.width = `${rect.width + 10}px`;
    this.highlightElement.style.height = `${rect.height + 10}px`;
    
    document.body.appendChild(this.highlightElement);
  }

  /**
   * Show message bubble
   * @private
   */
  showMessage(element, message, action) {
    // Remove old message
    if (this.messageElement) {
      this.messageElement.remove();
    }
    
    const rect = element.getBoundingClientRect();
    
    this.messageElement = document.createElement('div');
    this.messageElement.className = 'dark-voir-message';
    this.messageElement.textContent = message;
    
    // Determine message position
    const position = this.calculateMessagePosition(rect);
    this.messageElement.classList.add(`position-${position}`);
    
    // Position message
    switch (position) {
      case 'top':
        this.messageElement.style.left = `${rect.left + rect.width / 2}px`;
        this.messageElement.style.top = `${rect.top + window.scrollY - 80}px`;
        this.messageElement.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        this.messageElement.style.left = `${rect.left + rect.width / 2}px`;
        this.messageElement.style.top = `${rect.bottom + window.scrollY + 20}px`;
        this.messageElement.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        this.messageElement.style.left = `${rect.left + window.scrollX - 320}px`;
        this.messageElement.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;
        this.messageElement.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        this.messageElement.style.left = `${rect.right + window.scrollX + 20}px`;
        this.messageElement.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;
        this.messageElement.style.transform = 'translateY(-50%)';
        break;
    }
    
    document.body.appendChild(this.messageElement);
  }

  /**
   * Calculate best position for message
   * @private
   */
  calculateMessagePosition(rect) {
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

  /**
   * Show animated pointer
   * @private
   */
  showPointer(element) {
    if (this.pointerElement) {
      this.pointerElement.remove();
    }
    
    const rect = element.getBoundingClientRect();
    
    this.pointerElement = document.createElement('div');
    this.pointerElement.className = 'dark-voir-pointer';
    this.pointerElement.textContent = '👆';
    this.pointerElement.style.left = `${rect.left + rect.width / 2 - 20 + window.scrollX}px`;
    this.pointerElement.style.top = `${rect.top - 50 + window.scrollY}px`;
    
    document.body.appendChild(this.pointerElement);
  }

  /**
   * Execute step action
   * @private
   */
  executeStepAction(element, step) {
    try {
      switch (step.action) {
        case 'click':
          element.click();
          break;
        case 'type':
          element.focus();
          element.value = step.value || '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        case 'hover':
          element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          break;
        case 'scroll':
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
      }
      
      logger.info('Step action executed', { action: step.action });
    } catch (error) {
      logger.error('Failed to execute step action:', error);
    }
  }

  /**
   * Move to next step
   */
  async nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      await this.showStep(this.currentStep + 1);
    } else {
      this.complete();
    }
  }

  /**
   * Move to previous step
   */
  async previousStep() {
    if (this.currentStep > 0) {
      await this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Complete guide
   */
  complete() {
    this.showSuccessMessage('✅ Guide completed! Great job!');
    setTimeout(() => this.stop(), 2000);
  }

  /**
   * Show success message
   * @private
   */
  showSuccessMessage(message) {
    if (this.messageElement) {
      this.messageElement.textContent = message;
      this.messageElement.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    }
  }

  /**
   * Show error message
   * @private
   */
  showErrorMessage(message) {
    if (this.messageElement) {
      this.messageElement.textContent = message;
      this.messageElement.style.background = 'linear-gradient(135deg, #F44336 0%, #d32f2f 100%)';
    }
  }

  /**
   * Stop visual guide
   */
  stop() {
    this.isActive = false;
    
    // Remove all UI elements
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
    
    document.querySelectorAll('.dark-voir-step-indicator, .dark-voir-controls').forEach(el => el.remove());
    
    logger.info('Visual guide stopped');
  }

  /**
   * Check if guide is currently active
   * @returns {boolean}
   */
  isGuideActive() {
    return this.isActive;
  }
}

// Create global instance
const visualGuide = new VisualGuide();

// Listen for keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (!visualGuide.isGuideActive()) return;
  
  if (e.key === 'Escape') {
    visualGuide.stop();
  } else if (e.key === 'ArrowRight') {
    visualGuide.nextStep();
  } else if (e.key === 'ArrowLeft') {
    visualGuide.previousStep();
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisualGuide, visualGuide };
}

if (typeof window !== 'undefined') {
  window.DarkVoirVisualGuide = VisualGuide;
  window.visualGuide = visualGuide;
}
