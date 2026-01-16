// Main Application JavaScript
class ChatbotApp {
    constructor() {
        this.userPlan = 'free'; // Default
        this.fetchUserProfile();
        this.initializeModals();
    }

    async fetchUserProfile() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
                headers: { 'x-auth-token': token }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.userPlan = user.plan;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    initializeModals() {
        // Navigation Links
        document.getElementById('nav-templates').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('templatesModal').classList.add('active');
        });

        document.getElementById('nav-settings').addEventListener('click', (e) => {
            e.preventDefault();
            this.openSettingsModal();
        });

        document.getElementById('nav-analytics').addEventListener('click', (e) => {
            e.preventDefault();
            const botId = new URLSearchParams(window.location.search).get('botId');
            if (botId) {
                window.location.href = `dashboard.html?view=analytics&botId=${botId}`;
            } else {
                alert('Please save your chatbot first to view analytics.');
            }
        });

        // Templates Modal
        document.getElementById('closeTemplates').addEventListener('click', () => {
            document.getElementById('templatesModal').classList.remove('active');
        });

        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const template = card.dataset.template;
                if (confirm('Loading a template will clear your current flow. Continue?')) {
                    if (typeof flowBuilder !== 'undefined') {
                        flowBuilder.loadTemplate(template);
                        document.getElementById('templatesModal').classList.remove('active');
                    }
                }
            });
        });

        // Settings Modal
        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });

        // Settings Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });

        // Save Settings
        document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
            await this.saveSettings();
        });

        // Knowledge Base Upload
        const dropZone = document.getElementById('knowledgeUpload');
        const fileInput = document.getElementById('knowledgeFile');

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#4A90E2';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#ddd';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#ddd';
            if (e.dataTransfer.files.length) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // Preview Modal
        const previewBtn = document.getElementById('previewBtn');
        const previewModal = document.getElementById('previewModal');
        const closePreview = document.getElementById('closePreview');

        previewBtn.addEventListener('click', () => {
            this.showPreview();
        });

        closePreview.addEventListener('click', () => {
            previewModal.classList.remove('active');
        });

        // Publish Modal (optional)
        const publishBtn = document.getElementById('publishBtn');
        const publishModal = document.getElementById('publishModal');
        const closePublish = document.getElementById('closePublish');

        if (publishBtn && publishModal && closePublish) {
            publishBtn.addEventListener('click', () => {
                publishModal.classList.add('active');
                this.generateEmbedCode();
            });

            closePublish.addEventListener('click', () => {
                publishModal.classList.remove('active');
            });

            // Close modal on background click
            [previewModal, publishModal].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            });
        } else {
            // Only preview modal exists
            previewModal.addEventListener('click', (e) => {
                if (e.target === previewModal) {
                    previewModal.classList.remove('active');
                }
            });
        }

        // Copy buttons
        document.getElementById('copyEmbed').addEventListener('click', (e) => {
            this.copyToClipboard('embedCode', e);
        });

        document.getElementById('copyLink').addEventListener('click', (e) => {
            this.copyToClipboard('directLink', e);
        });
    }

    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const botName = document.getElementById('botName').value;
        const welcomeMessage = document.getElementById('welcomeMessage').value;
        const primaryColor = document.getElementById('primaryColor').value;

        // Populate fields
        document.getElementById('settingsBotName').value = botName;
        document.getElementById('settingsWelcomeMessage').value = welcomeMessage;
        document.getElementById('settingsPrimaryColor').value = primaryColor;
        
        // If we have flowBuilder and it has loaded data, populate other fields
        if (typeof flowBuilder !== 'undefined' && flowBuilder.botData) {
            document.getElementById('settingsSystemPrompt').value = flowBuilder.botData.systemPrompt || '';
            
            // Populate Language
            const aiSettings = flowBuilder.botData.aiSettings || {};
            if (aiSettings.responseLanguage) {
                document.getElementById('settingsLanguage').value = aiSettings.responseLanguage;
            }

            // Populate Ads
            const widgetSettings = flowBuilder.botData.widgetSettings || {};
            const showAdsCheckbox = document.getElementById('settingsShowAds');
            const adContentInput = document.getElementById('settingsAdContent');
            const adLinkInput = document.getElementById('settingsAdLink');

            showAdsCheckbox.checked = widgetSettings.showAds || false;
            adContentInput.value = widgetSettings.adContent || '';
            adLinkInput.value = widgetSettings.adLink || '';

            // Restrict based on plan
            if (this.userPlan === 'free') {
                showAdsCheckbox.checked = true;
                showAdsCheckbox.disabled = true;
                adContentInput.value = 'Powered by Chatbot Builder';
                adContentInput.disabled = true;
                adLinkInput.value = window.location.origin; // Or your SaaS URL
                adLinkInput.disabled = true;
                
                // Add upgrade message if not exists
                const adContainer = showAdsCheckbox.closest('.form-group');
                if (!document.getElementById('upgrade-msg')) {
                    const msg = document.createElement('p');
                    msg.id = 'upgrade-msg';
                    msg.style.color = '#e74c3c';
                    msg.style.fontSize = '12px';
                    msg.style.marginTop = '5px';
                    msg.innerHTML = '<i class="fas fa-lock"></i> Upgrade to Pro to remove branding.';
                    adContainer.appendChild(msg);
                }
            }
        }

        modal.classList.add('active');
    }

    async saveSettings() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        try {
            // Update UI fields
            document.getElementById('botName').value = document.getElementById('settingsBotName').value;
            document.getElementById('welcomeMessage').value = document.getElementById('settingsWelcomeMessage').value;
            document.getElementById('primaryColor').value = document.getElementById('settingsPrimaryColor').value;
            
            // Trigger save in flowBuilder to persist to backend
            if (typeof flowBuilder !== 'undefined') {
                // Update internal data
                if (!flowBuilder.botData) flowBuilder.botData = {};
                flowBuilder.botData.systemPrompt = document.getElementById('settingsSystemPrompt').value;
                
                // Update AI Settings
                if (!flowBuilder.botData.aiSettings) flowBuilder.botData.aiSettings = {};
                flowBuilder.botData.aiSettings.responseLanguage = document.getElementById('settingsLanguage').value;

                // Update Widget Settings (Ads)
                if (!flowBuilder.botData.widgetSettings) flowBuilder.botData.widgetSettings = {};
                flowBuilder.botData.widgetSettings.showAds = document.getElementById('settingsShowAds').checked;
                flowBuilder.botData.widgetSettings.adContent = document.getElementById('settingsAdContent').value;
                flowBuilder.botData.widgetSettings.adLink = document.getElementById('settingsAdLink').value;

                await flowBuilder.saveFlow();
            }
            
            document.getElementById('settingsModal').classList.remove('active');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    async handleFileUpload(file) {
        if (!file) return;
        
        const botId = new URLSearchParams(window.location.search).get('botId');
        if (!botId) {
            alert('Please save your chatbot first before uploading files.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const fileList = document.getElementById('fileList');
        fileList.innerHTML = `<div class="file-item"><i class="fas fa-spinner fa-spin"></i> Uploading ${file.name}...</div>`;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${CONFIG.API_URL}/chatbot/${botId}/upload-knowledge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            fileList.innerHTML = `
                <div class="file-item success">
                    <i class="fas fa-check-circle"></i> ${file.name} uploaded successfully
                </div>`;
        } catch (error) {
            fileList.innerHTML = `
                <div class="file-item error">
                    <i class="fas fa-exclamation-circle"></i> Upload failed: ${error.message}
                </div>`;
        }
    }

    showPreview() {
        const previewModal = document.getElementById('previewModal');
        const botName = document.getElementById('botName').value;
        const welcomeMessage = document.getElementById('welcomeMessage').value;
        const primaryColor = document.getElementById('primaryColor').value;

        // Update preview
        document.getElementById('previewBotName').textContent = botName;
        
        const messagesContainer = document.getElementById('previewMessages');
        messagesContainer.innerHTML = `
            <div class="message bot-message">
                <p>${welcomeMessage}</p>
            </div>
        `;

        // Apply primary color
        const chatHeader = previewModal.querySelector('.chat-header');
        chatHeader.style.background = primaryColor;

        previewModal.classList.add('active');

        // Initialize chat functionality
        this.initializeChatPreview();
    }

    initializeChatPreview() {
        const chatInput = document.querySelector('.chat-input');
        const sendBtn = document.querySelector('.send-btn');
        const messagesContainer = document.getElementById('previewMessages');

        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                // Add user message
                const userMsg = document.createElement('div');
                userMsg.className = 'message user-message';
                userMsg.innerHTML = `<p>${message}</p>`;
                messagesContainer.appendChild(userMsg);

                // Clear input
                chatInput.value = '';

                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                // Simulate bot response
                setTimeout(() => {
                    const botMsg = document.createElement('div');
                    botMsg.className = 'message bot-message';
                    botMsg.innerHTML = `<p>Thank you for your message! This is a preview mode.</p>`;
                    messagesContainer.appendChild(botMsg);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 1000);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    generateEmbedCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const botId = urlParams.get('botId') || 'bot_' + Math.random().toString(36).substr(2, 9);
        const primaryColor = document.getElementById('primaryColor').value;
        const domain = window.location.origin;
        
        const embedCode = `<script src="${domain}/widget/chatbot.js"></script>
<script>
  ChatbotWidget.init({
    botId: '${botId}',
    primaryColor: '${primaryColor}',
    position: 'bottom-right'
  });
</script>`;

        document.getElementById('embedCode').textContent = embedCode;
        document.getElementById('directLink').value = `${domain}/widget/demo.html?botId=${botId}`;
    }

    copyToClipboard(elementId, event) {
        const element = document.getElementById(elementId);
        const text = element.textContent || element.value;

        navigator.clipboard.writeText(text).then(() => {
            // Show success message
            if (event && event.target) {
                const btn = event.target.closest('.copy-btn');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    btn.style.background = '#5CB85C';

                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                    }, 2000);
                }
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    }
}

// Initialize chatbot settings listeners
function initializeChatbotSettings() {
    // Bot name change
    document.getElementById('botName').addEventListener('input', (e) => {
        console.log('Bot name changed:', e.target.value);
    });

    // Welcome message change
    document.getElementById('welcomeMessage').addEventListener('input', (e) => {
        console.log('Welcome message changed:', e.target.value);
    });

    // Primary color change
    document.getElementById('primaryColor').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--primary-color', e.target.value);
    });

    // Bot avatar upload
    document.getElementById('botAvatar').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('Avatar uploaded:', e.target.result);
                // Here you would upload the image to your server
            };
            reader.readAsDataURL(file);
        }
    });
}

// Initialize app
let flowBuilder; // Global variable for flowBuilder
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOMContentLoaded event fired');
    console.log('CONFIG object:', typeof CONFIG !== 'undefined' ? CONFIG : 'NOT FOUND');
    
    const app = new ChatbotApp();
    console.log('ChatbotApp initialized:', app);
    
    // Use enhanced FlowBuilder if available, fallback to regular FlowBuilder
    const FlowBuilderClass = window.FlowBuilderEnhanced || window.FlowBuilder;
    flowBuilder = new FlowBuilderClass();
    console.log('FlowBuilder initialized:', flowBuilder);
    
    initializeChatbotSettings();
    
    console.log('✅ Chatbot Builder initialized successfully!');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (typeof flowBuilder !== 'undefined') {
            flowBuilder.saveFlow();
        }
    }
    
    // Delete key to delete selected node
    if (e.key === 'Delete' && flowBuilder && flowBuilder.selectedNode) {
        const nodeId = flowBuilder.selectedNode.dataset.id;
        if (nodeId !== 'start') {
            flowBuilder.deleteNode(nodeId);
        }
    }
});
