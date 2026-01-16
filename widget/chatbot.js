/**
 * AI Chatbot Widget
 * Version: 2.0.0 - AI Powered Real Estate Chatbot
 * Embeddable chatbot widget with AI capabilities, lead capture, and property recommendations
 */

(function() {
    'use strict';

    class ChatbotWidget {
        constructor(config) {
            // Determine default API URL based on current script location or fallback
            const defaultApiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:5000'
                : 'https://api.your-production-domain.com'; // REPLACE WITH PRODUCTION URL

            this.config = {
                botId: config.botId || '',
                apiUrl: config.apiUrl || defaultApiUrl,
                primaryColor: config.primaryColor || '#4A90E2',
                position: config.position || 'bottom-right',
                theme: config.theme || 'light',
                ...config
            };

            this.sessionId = this.getOrCreateSessionId();
            this.isOpen = false;
            this.isLoading = false;
            this.messages = [];

            this.init();
        }

        init() {
            this.injectStyles();
            this.createWidget();
            this.attachEventListeners();
            this.loadChatbot();
        }

        getOrCreateSessionId() {
            let sessionId = localStorage.getItem('chatbot_session_id_' + this.config.botId);
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
                localStorage.setItem('chatbot_session_id_' + this.config.botId, sessionId);
            }
            return sessionId;
        }

        async loadChatbot() {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/chatbot/${this.config.botId}`);
                const data = await response.json();
                
                if (data.chatbot) {
                    this.chatbotData = data.chatbot;
                    this.updateWidgetStyles();
                    this.addWelcomeMessage();
                }
            } catch (error) {
                console.error('Failed to load chatbot:', error);
            }
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .chatbot-widget-container {
                    position: fixed;
                    ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                }

                .chatbot-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: ${this.config.primaryColor};
                    border: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .chatbot-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                }

                .chatbot-button svg {
                    width: 28px;
                    height: 28px;
                    fill: white;
                }

                .chatbot-window {
                    position: fixed;
                    ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    ${this.config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
                    width: 380px;
                    height: 550px;
                    max-height: calc(100vh - 120px);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease-out;
                }

                .chatbot-window.open {
                    display: flex;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chatbot-header {
                    background: ${this.config.primaryColor};
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .chatbot-header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .chatbot-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }

                .chatbot-name {
                    font-weight: 600;
                    font-size: 16px;
                }

                .chatbot-status {
                    font-size: 12px;
                    opacity: 0.9;
                }

                .chatbot-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    font-size: 24px;
                    line-height: 1;
                }

                .chatbot-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: #f8f9fa;
                }

                .chatbot-message {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    animation: messageSlide 0.3s ease-out;
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chatbot-message.user {
                    flex-direction: row-reverse;
                }

                .chatbot-message-bubble {
                    max-width: 75%;
                    padding: 10px 14px;
                    border-radius: 12px;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                    line-height: 1.5;
                }

                .chatbot-message.bot .chatbot-message-bubble {
                    background: white;
                    color: #333;
                    border: 1px solid #e0e0e0;
                }

                .chatbot-message.user .chatbot-message-bubble {
                    background: ${this.config.primaryColor};
                    color: white;
                }

                .chatbot-typing {
                    display: flex;
                    gap: 4px;
                    padding: 10px 14px;
                    background: white;
                    border-radius: 12px;
                    width: fit-content;
                    border: 1px solid #e0e0e0;
                }

                .chatbot-typing span {
                    width: 8px;
                    height: 8px;
                    background: #999;
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }

                .chatbot-typing span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .chatbot-typing span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                    }
                    30% {
                        transform: translateY(-10px);
                    }
                }

                .chatbot-property-card {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 8px;
                }

                .chatbot-property-card h4 {
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    color: #333;
                }

                .chatbot-property-card p {
                    margin: 4px 0;
                    font-size: 13px;
                    color: #666;
                }

                .chatbot-input-container {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 8px;
                }

                .chatbot-ad {
                    padding: 8px;
                    background: #f0f0f0;
                    text-align: center;
                    font-size: 11px;
                    color: #666;
                    border-top: 1px solid #e0e0e0;
                }

                .chatbot-ad a {
                    color: ${this.config.primaryColor};
                    text-decoration: none;
                    font-weight: bold;
                }

                .chatbot-input {
                    flex: 1;
                    padding: 10px 14px;
                    border: 1px solid #ddd;
                    border-radius: 24px;
                    outline: none;
                    font-size: 14px;
                    font-family: inherit;
                }

                .chatbot-input:focus {
                    border-color: ${this.config.primaryColor};
                }

                .chatbot-send-button {
                    background: ${this.config.primaryColor};
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.2s;
                }

                .chatbot-send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .chatbot-send-button svg {
                    width: 20px;
                    height: 20px;
                    fill: white;
                }

                @media (max-width: 480px) {
                    .chatbot-window {
                        width: calc(100vw - 40px);
                        height: calc(100vh - 120px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createWidget() {
            const container = document.createElement('div');
            container.className = 'chatbot-widget-container';
            
            const widgetSettings = this.chatbotData ? this.chatbotData.widgetSettings : {};
            const showAds = widgetSettings && widgetSettings.showAds;
            const adContent = (widgetSettings && widgetSettings.adContent) || 'Powered by Chatbot Builder';
            const adLink = (widgetSettings && widgetSettings.adLink) || '#';

            container.innerHTML = `
                <button class="chatbot-button" id="chatbot-toggle">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.69-.28-3.88-.78l-.28-.11-2.91.49.49-2.91-.11-.28C4.78 14.69 4.5 13.38 4.5 12 4.5 7.86 7.86 4.5 12 4.5S19.5 7.86 19.5 12 16.14 19.5 12 19.5z"/>
                    </svg>
                </button>
                <div class="chatbot-window" id="chatbot-window">
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <div class="chatbot-avatar">🤖</div>
                            <div>
                                <div class="chatbot-name">AI Assistant</div>
                                <div class="chatbot-status">●  Online</div>
                            </div>
                        </div>
                        <button class="chatbot-close" id="chatbot-close">×</button>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages"></div>
                    <div class="chatbot-input-container">
                        <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type your message...">
                        <button class="chatbot-send-button" id="chatbot-send">
                            <svg viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    ${showAds ? `
                    <div class="chatbot-ad">
                        <a href="${adLink}" target="_blank">${adContent}</a>
                    </div>
                    ` : ''}
                </div>
            `;
            document.body.appendChild(container);
        }

        attachEventListeners() {
            document.getElementById('chatbot-toggle').addEventListener('click', () => {
                this.toggleWindow();
            });

            document.getElementById('chatbot-close').addEventListener('click', () => {
                this.toggleWindow();
            });

            document.getElementById('chatbot-send').addEventListener('click', () => {
                this.sendMessage();
            });

            document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isLoading) {
                    this.sendMessage();
                }
            });
        }

        toggleWindow() {
            this.isOpen = !this.isOpen;
            const window = document.getElementById('chatbot-window');
            
            if (this.isOpen) {
                window.classList.add('open');
                document.getElementById('chatbot-input').focus();
            } else {
                window.classList.remove('open');
            }
        }

        updateWidgetStyles() {
            if (!this.chatbotData) return;
            
            const nameEl = document.querySelector('.chatbot-name');
            if (nameEl && this.chatbotData.name) {
                nameEl.textContent = this.chatbotData.name;
            }
        }

        addWelcomeMessage() {
            if (!this.chatbotData) return;
            
            const welcomeMsg = this.chatbotData.welcomeMessage || 'Hello! How can I help you?';
            this.addMessage(welcomeMsg, 'bot');
        }

        addMessage(text, sender, properties = []) {
            const messagesContainer = document.getElementById('chatbot-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${sender}`;
            
            let content = `<div class="chatbot-message-bubble">${this.escapeHtml(text)}</div>`;
            
            // Add property cards if available
            if (properties && properties.length > 0) {
                properties.forEach(prop => {
                    content += `
                        <div class="chatbot-property-card">
                            <h4>🏠 ${prop.location}</h4>
                            <p>💰 ${prop.price.toLocaleString()} ${prop.currency}</p>
                            <p>🛏️ ${prop.bedrooms} Bedrooms</p>
                        </div>
                    `;
                });
            }
            
            messageDiv.innerHTML = content;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        showTyping() {
            const messagesContainer = document.getElementById('chatbot-messages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chatbot-typing';
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        hideTyping() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        async sendMessage() {
            const input = document.getElementById('chatbot-input');
            const message = input.value.trim();
            
            if (!message || this.isLoading) return;
            
            // Add user message
            this.addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            this.showTyping();
            this.isLoading = true;
            
            const sendBtn = document.getElementById('chatbot-send');
            sendBtn.disabled = true;
            
            try {
                const response = await fetch(`${this.config.apiUrl}/api/chatbot/${this.config.botId}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message,
                        sessionId: this.sessionId
                    })
                });
                
                const data = await response.json();
                
                this.hideTyping();
                
                if (data.response) {
                    this.addMessage(data.response, 'bot', data.propertyMatches);
                } else {
                    this.addMessage('Sorry, I couldn\'t process your message.', 'bot');
                }
            } catch (error) {
                console.error('Send message error:', error);
                this.hideTyping();
                this.addMessage('Sorry, something went wrong. Please try again.', 'bot');
            } finally {
                this.isLoading = false;
                sendBtn.disabled = false;
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML.replace(/\n/g, '<br>');
        }
    }

    // Global initialization function
    window.ChatbotWidget = {
        init: function(config) {
            if (!config.botId) {
                console.error('ChatbotWidget: botId is required');
                return;
            }
            
            new ChatbotWidget(config);
        }
    };
})();
