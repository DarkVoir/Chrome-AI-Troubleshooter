# 🔍 Dark Voir Chrome AI Troubleshooter

> Intelligent web debugging powered by Chrome Built-in AI (Gemini Nano)

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%20Nano-purple)](https://developer.chrome.com/docs/ai/built-in)

## 🎯 Overview

Dark Voir AI is a Chrome extension that revolutionizes web debugging by using Chrome's Built-in AI APIs to automatically detect, analyze, and fix web errors in real-time.

### ✨ Key Features

- 🤖 **AI-Powered Fix Generation** - Gemini Nano analyzes errors and generates code fixes
- 📊 **Real-time Dashboard** - Monitor errors, warnings, and page health
- 💬 **Intelligent Chat** - Ask questions about issues and get instant AI responses
- 🔧 **Auto-Detection** - Automatically catches JavaScript, network, and console errors
- 👁️ **Visual Troubleshooting** - On-page visual guides for complex issues
- 📤 **Export Reports** - Save issue reports and fixes for documentation

## 🚀 Installation

### Prerequisites

**Enable Chrome Built-in AI:**

1. Open `chrome://flags/#prompt-api-for-gemini-nano`
2. Set to **Enabled**
3. Open `chrome://flags/#optimization-guide-on-device-model`
4. Set to **Enabled BypassPerfRequirement**
5. Restart Chrome
6. Open DevTools Console and run:
   
await ai.languageModel.create();

### Install Extension
1. Download/clone this repository
2. Open chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension folder

## 📖 Usage
### Quick Start

1. **Click the extension icon** in your toolbar
2. **Navigate to any webpage** with JavaScript
3. **View Dashboard** to see detected issues
4. **Click "Get AI Fix"** on any issue for AI-generated solutions
5. **Use AI Chat** to ask questions about your page

### Dashboard

- **Status Card**: Overall page health (Good/Issues)
- **Errors**: Critical JavaScript errors count
- **Warnings**: Non-critical warnings
- **AI Status**: Chrome AI availability indicator

### Issues Tab

- Filter by severity (Critical, High, Medium, Low)
- Filter by type (Error, Warning, Console, Network)
- Click "Get AI Fix" for instant solutions
- View stack traces and error details

### Fixes Tab

- AI-generated explanations for each issue
- Step-by-step fix instructions
- Code examples with copy button
- Confidence scores for each fix

### AI Chat

- Ask natural language questions
- Context-aware responses based on page issues
- Suggestion chips for common queries

## 🧠 Chrome AI Integration

This extension uses **5 Chrome Built-in AI APIs**:

| API | Purpose |
|-----|---------|
| **Prompt API** | Main AI chat and analysis |
| **Writer API** | Generate fix documentation |
| **Rewriter API** | Improve error messages |
| **Summarizer API** | Condense long error logs |
| **Translator API** | Multi-language support |

### Fallback Behavior

If Chrome AI is unavailable (unsupported region or not enabled):
- Extension continues working for error detection
- AI features show helpful setup instructions
- All non-AI features remain functional

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Chrome Built-in AI (Gemini Nano)
- **Architecture**: MV3 Extension Architecture
- **Storage**: Chrome Storage API
- **Messaging**: Chrome Runtime Messaging

## 📁 Project Structure

| manifest.json | Extension configuration |
|-----|---------|
| **popup.html/css/js** | Main UI and logic |
| **ai-helper.js** | Chrome AI integration layer |
| **background.js** | Background service worker |
| **content.js** | Page context script |
| **visual-guide.js** | Visual troubleshooting |
| **utils.js** | Utility functions |

## 🔧 Development

### Prerequisites
- Chrome 127+ (Dev/Canary recommended)
- Node.js 18+ (optional, for testing)

### Setup

git clone https://github.com/DarkVoir/Chrome-AI-Troubleshooter.git

cd Chrome-Ai-Troubleshooter

Load in Chrome
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select this folder

### Testing
Test on pages with errors
1. Navigate to any webpage
2. Open extension popup
3. Check Dashboard for detected issues
4. Test AI fix generation


## 🌍 Regional Availability

**Chrome Built-in AI** is currently available in:
- United States
- Select European countries
- Japan, Singapore, Taiwan

**For unsupported regions**: Extension will work for error detection, but AI features will be unavailable until Google expands regional support.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🏆 Acknowledgments

- Built for **Google Chrome Built-in AI Challenge 2025**
- Powered by **Chrome Built-in AI (Gemini Nano)**
- Inspired by developer pain points in web debugging

## 📧 Contact

- **Author**: Krishna Lamichhane
- **Email**: klamichhane1@myseneca.ca
- **GitHub**: [@DarkVoir](https://github.com/DarkVoir)
- **Devpost**: [Project Link](https://devpost.com/software/dark-voir-ai) ------------------------------Need update <<<<<<<<<<<<<<<<<<<<<<

---

**Made with Passion for developers by developers**
