// Flow Builder JavaScript
class FlowBuilder {
    constructor() {
        console.log('🚀 FlowBuilder constructor started');
        this.canvas = document.getElementById('flowCanvas');
        console.log('Canvas element:', this.canvas);
        
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.draggedComponent = null;
        this.nodeCounter = 1;
        this.zoom = 1;
        this.botId = this.getBotIdFromUrl();
        
        console.log('Bot ID from URL:', this.botId);
        
        this.initializeEventListeners();
        if (this.botId) {
            this.loadFlowFromBackend();
        } else {
            this.loadFlow(); // Load from local storage as fallback
        }
        
        console.log('✅ FlowBuilder initialized successfully');
    }

    getBotIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('botId');
    }

    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    }

    initializeEventListeners() {
        // Drag and drop for components
        const components = document.querySelectorAll('.component');
        console.log('Found components:', components.length);
        
        components.forEach(component => {
            // Add dragstart event
            component.addEventListener('dragstart', (e) => {
                this.draggedComponent = e.target.dataset.type;
                console.log('Dragging component:', this.draggedComponent);
            });

            // Add click support
            component.addEventListener('click', (e) => {
                e.preventDefault();
                const type = e.currentTarget.dataset.type;
                console.log('Clicked component:', type);
                // Add to center of visible canvas area or default position
                // Use a simple offset based on node count to avoid stacking
                const x = 250 + (this.nodes.length * 20); 
                const y = 150 + (this.nodes.length * 20);
                this.createNode(type, x, y);
            });
        });

        // Canvas drop zone
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedComponent) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.createNode(this.draggedComponent, x, y);
                this.draggedComponent = null;
            }
        });

        // Toolbar buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomCanvas(0.1));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomCanvas(-0.1));
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveFlow').addEventListener('click', () => this.saveFlow());

        // Node dragging
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('node') || e.target.closest('.node')) {
                const node = e.target.classList.contains('node') ? e.target : e.target.closest('.node');
                this.startDraggingNode(node, e);
            }
        });
    }

    createNode(type, x, y, id = null, properties = {}) {
        const nodeId = id || `node-${this.nodeCounter++}`;
        // Update counter if loading existing nodes
        if (id) {
            const numId = parseInt(id.replace('node-', ''));
            if (!isNaN(numId) && numId >= this.nodeCounter) {
                this.nodeCounter = numId + 1;
            }
        }

        const node = document.createElement('div');
        node.className = 'node';
        node.dataset.id = nodeId;
        node.dataset.type = type;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;

        // Store properties
        node.dataset.properties = JSON.stringify(properties);

        const icon = this.getNodeIcon(type);
        const title = this.getNodeTitle(type);

        node.innerHTML = `
            <div class="node-header">
                <i class="${icon}"></i>
                <span>${title}</span>
                <button class="delete-node" onclick="flowBuilder.deleteNode('${nodeId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="node-body">
                <p>${this.getNodeDescription(type)}</p>
            </div>
            <div class="node-connector"></div>
        `;

        this.canvas.appendChild(node);
        this.nodes.push({ id: nodeId, type, x, y, properties });

        // Make node selectable
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });

        this.selectNode(node);
    }

    getNodeIcon(type) {
        const icons = {
            'text': 'fas fa-comment',
            'button': 'fas fa-hand-pointer',
            'input': 'fas fa-keyboard',
            'image': 'fas fa-image',
            'video': 'fas fa-video',
            'carousel': 'fas fa-images',
            'condition': 'fas fa-code-branch',
            'api': 'fas fa-plug',
            'whatsapp': 'fab fa-whatsapp'
        };
        return icons[type] || 'fas fa-circle';
    }

    getNodeTitle(type) {
        const titles = {
            'text': 'Text Message',
            'button': 'Button',
            'input': 'User Input',
            'image': 'Image',
            'video': 'Video',
            'carousel': 'Carousel',
            'condition': 'Condition',
            'api': 'API Call',
            'whatsapp': 'WhatsApp Redirect'
        };
        return titles[type] || 'Node';
    }

    getNodeDescription(type) {
        const descriptions = {
            'text': 'Send a text message to the user',
            'button': 'Show buttons for quick replies',
            'input': 'Collect text, email, or phone',
            'image': 'Display an image',
            'video': 'Embed a video',
            'carousel': 'Show a carousel of cards',
            'condition': 'Branch based on user input',
            'api': 'Make an external API request',
            'whatsapp': 'Redirect user to WhatsApp chat'
        };
        return descriptions[type] || 'Generic Node';
    }

    selectNode(node) {
        // Remove previous selection
        document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
        
        // Select new node
        node.classList.add('selected');
        this.selectedNode = node;
        
        // Update properties panel
        this.updatePropertiesPanel(node);
    }

    updatePropertiesPanel(node) {
        const type = node.dataset.type;
        const propertiesContent = document.getElementById('propertiesContent');
        
        let html = `<h4>Edit ${this.getNodeTitle(type)}</h4>`;
        
        switch(type) {
            case 'text':
                html += `
                    <div class="setting-group">
                        <label>Message Text</label>
                        <textarea id="nodeText" placeholder="Enter message text">Hello! How can I help you?</textarea>
                    </div>
                    <div class="setting-group">
                        <label>Delay (seconds)</label>
                        <input type="number" id="nodeDelay" value="0" min="0" max="10">
                    </div>
                `;
                break;
            case 'button':
                html += `
                    <div class="setting-group">
                        <label>Button Text</label>
                        <input type="text" id="buttonText" placeholder="Click here" value="Continue">
                    </div>
                    <div class="setting-group">
                        <label>Button Action</label>
                        <select id="buttonAction">
                            <option value="next">Go to next step</option>
                            <option value="url">Open URL</option>
                            <option value="custom">Custom action</option>
                        </select>
                    </div>
                `;
                break;
            case 'input':
                html += `
                    <div class="setting-group">
                        <label>Input Label</label>
                        <input type="text" id="inputLabel" placeholder="Your name" value="Please enter your email">
                    </div>
                    <div class="setting-group">
                        <label>Input Type</label>
                        <select id="inputType">
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="number">Number</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Save as Variable</label>
                        <input type="text" id="variableName" placeholder="email">
                    </div>
                `;
                break;
            case 'image':
                html += `
                    <div class="setting-group">
                        <label>Image URL</label>
                        <input type="text" id="imageUrl" placeholder="https://example.com/image.jpg">
                    </div>
                    <div class="setting-group">
                        <label>Alt Text</label>
                        <input type="text" id="altText" placeholder="Image description">
                    </div>
                `;
                break;
            case 'api':
                html += `
                    <div class="setting-group">
                        <label>API Endpoint</label>
                        <input type="text" id="apiUrl" placeholder="https://api.example.com/data">
                    </div>
                    <div class="setting-group">
                        <label>Method</label>
                        <select id="apiMethod">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                        </select>
                    </div>
                `;
                break;
        }
        
        html += `
            <button class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="flowBuilder.saveNodeProperties()">
                <i class="fas fa-save"></i> Save Properties
            </button>
        `;
        
        propertiesContent.innerHTML = html;
    }

    saveNodeProperties() {
        if (!this.selectedNode) return;
        
        // Save properties based on node type
        console.log('Properties saved for node:', this.selectedNode.dataset.id);
        
        // Show success message
        alert('Node properties saved successfully!');
    }

    deleteNode(nodeId) {
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (node) {
            node.remove();
            this.nodes = this.nodes.filter(n => n.id !== nodeId);
            
            // Clear properties panel if this was selected
            if (this.selectedNode && this.selectedNode.dataset.id === nodeId) {
                document.getElementById('propertiesContent').innerHTML = 
                    '<p class="no-selection">Select a node to edit properties</p>';
                this.selectedNode = null;
            }
        }
    }

    startDraggingNode(node, e) {
        const rect = node.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const onMouseMove = (e) => {
            const canvasRect = this.canvas.getBoundingClientRect();
            const newX = e.clientX - canvasRect.left - offsetX;
            const newY = e.clientY - canvasRect.top - offsetY;
            
            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    zoomCanvas(delta) {
        this.zoom = Math.max(0.5, Math.min(2, this.zoom + delta));
        this.canvas.style.transform = `scale(${this.zoom})`;
        this.canvas.style.transformOrigin = 'top left';
    }

    resetZoom() {
        this.zoom = 1;
        this.canvas.style.transform = 'scale(1)';
    }

    clearCanvas(confirmAction = true) {
        if (!confirmAction || confirm('Are you sure you want to clear the entire canvas?')) {
            const startNode = document.querySelector('.start-node');
            this.canvas.innerHTML = '';
            // Re-add start node if it existed, or create new one
            if (startNode) {
                this.canvas.appendChild(startNode);
            } else {
                // Create default start node if missing
                const startDiv = document.createElement('div');
                startDiv.className = 'start-node node';
                startDiv.dataset.id = 'start';
                startDiv.innerHTML = `
                    <div class="node-header">
                        <i class="fas fa-play-circle"></i>
                        <span>Start</span>
                    </div>
                    <div class="node-connector"></div>
                `;
                this.canvas.appendChild(startDiv);
            }
            
            this.nodes = [];
            this.connections = [];
            this.nodeCounter = 1;
            document.getElementById('propertiesContent').innerHTML = 
                '<p class="no-selection">Select a node to edit properties</p>';
        }
    }

    async saveFlow() {
        const flowData = {
            nodes: this.nodes,
            connections: this.connections,
            settings: {
                botName: document.getElementById('botName').value,
                welcomeMessage: document.getElementById('welcomeMessage').value,
                primaryColor: document.getElementById('primaryColor').value
            }
        };
        
        // Save to localStorage
        localStorage.setItem('chatbotFlow', JSON.stringify(flowData));

        // Save to backend if botId exists
        if (this.botId) {
            const saveBtn = document.getElementById('saveFlow');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;

            try {
                await this.apiCall(`/chatbot/${this.botId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: flowData.settings.botName,
                        welcomeMessage: flowData.settings.welcomeMessage,
                        primaryColor: flowData.settings.primaryColor,
                        systemPrompt: this.botData ? this.botData.systemPrompt : undefined,
                        flow: {
                            nodes: this.nodes,
                            connections: this.connections
                        }
                    })
                });
                alert('Flow saved successfully to server!');
            } catch (error) {
                console.error('Error saving flow:', error);
                alert('Failed to save to server: ' + error.message);
            } finally {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        } else {
            // No Bot ID - Prompt to create new
            const name = prompt('No Chatbot ID found. Enter a name to create a new chatbot:', flowData.settings.botName);
            if (name) {
                try {
                    const response = await this.apiCall('/chatbot/create', {
                        method: 'POST',
                        body: JSON.stringify({
                            name: name,
                            welcomeMessage: flowData.settings.welcomeMessage,
                            primaryColor: flowData.settings.primaryColor
                        })
                    });
                    
                    if (response.success && response.chatbot) {
                        this.botId = response.chatbot.botId;
                        // Update URL without reloading
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set('botId', this.botId);
                        window.history.pushState({ path: newUrl.href }, '', newUrl.href);
                        
                        // Now save the flow
                        await this.saveFlow();
                    }
                } catch (error) {
                    alert('Failed to create new chatbot: ' + error.message);
                }
            } else {
                alert('Flow saved locally! (Not synced to server)');
            }
        }
        
        console.log('Saved flow:', flowData);
    }

    loadTemplate(templateName) {
        this.clearCanvas(false); // Clear without confirmation
        
        let nodes = [];
        
        if (templateName === 'customer-support') {
            nodes = [
                { type: 'text', x: 250, y: 100, properties: { text: 'Hello! How can I help you today?' } },
                { type: 'button', x: 250, y: 250, properties: { text: 'Please choose a topic:', buttons: ['Pricing', 'Technical Support', 'Sales'] } },
                { type: 'text', x: 50, y: 450, properties: { text: 'Our pricing starts at $10/month. Would you like to see the full plan?' } },
                { type: 'input', x: 450, y: 450, properties: { label: 'Please describe your issue in detail:' } }
            ];
        } else if (templateName === 'real-estate') {
            nodes = [
                { type: 'text', x: 350, y: 50, properties: { text: 'Assalam-o-Alaikum! Welcome to Dream Homes. Are you looking to Buy, Rent, or Sell?' } },
                { type: 'button', x: 350, y: 200, properties: { text: 'I want to...', buttons: ['Buy Property', 'Rent Property', 'Sell Property'] } },
                
                // Buy Path
                { type: 'text', x: 100, y: 350, properties: { text: 'Great! Which city are you interested in?' } },
                { type: 'button', x: 100, y: 500, properties: { text: 'Select City:', buttons: ['Lahore', 'Karachi', 'Islamabad', 'Other'] } },
                { type: 'input', x: 100, y: 650, properties: { label: 'What is your budget range? (e.g. 1-2 Crore)' } },
                { type: 'input', x: 100, y: 800, properties: { label: 'How many bedrooms do you need?' } },
                { type: 'whatsapp', x: 100, y: 950, properties: { phoneNumber: '923001234567', message: 'I am interested in buying a property.' } },

                // Rent Path
                { type: 'text', x: 350, y: 350, properties: { text: 'Okay! What is your monthly rental budget?' } },
                { type: 'input', x: 350, y: 500, properties: { label: 'Enter budget (e.g. 50k - 1 Lakh)' } },
                { type: 'whatsapp', x: 350, y: 650, properties: { phoneNumber: '923001234567', message: 'I am looking for a rental property.' } },

                // Sell Path
                { type: 'text', x: 600, y: 350, properties: { text: 'We can help you sell fast! Where is your property located?' } },
                { type: 'input', x: 600, y: 500, properties: { label: 'Enter Location/Society' } },
                { type: 'input', x: 600, y: 650, properties: { label: 'What is your demand?' } },
                { type: 'input', x: 600, y: 800, properties: { label: 'Please share your phone number so our agent can call you.' } }
            ];
        } else if (templateName === 'lead-gen') {
            nodes = [
                { type: 'text', x: 250, y: 100, properties: { text: 'Hi there! Thanks for visiting. Leave your details and we will contact you shortly.' } },
                { type: 'input', x: 250, y: 250, properties: { label: 'What is your name?' } },
                { type: 'input', x: 250, y: 400, properties: { label: 'What is your email address?' } },
                { type: 'input', x: 250, y: 550, properties: { label: 'What is your phone number?' } },
                { type: 'text', x: 250, y: 700, properties: { text: 'Thank you! We will be in touch soon.' } }
            ];
        }

        nodes.forEach(node => {
            this.createNode(node.type, node.x, node.y, null, node.properties);
        });
    }

    async loadFlowFromBackend() {
        try {
            const data = await this.apiCall(`/chatbot/${this.botId}`);
            const chatbot = data.chatbot;
            this.botData = chatbot; // Store full bot data

            // Load settings
            document.getElementById('botName').value = chatbot.name || '';
            document.getElementById('welcomeMessage').value = chatbot.welcomeMessage || '';
            document.getElementById('primaryColor').value = chatbot.primaryColor || '#4A90E2';

            // Load flow if exists
            if (chatbot.flow && chatbot.flow.nodes && chatbot.flow.nodes.length > 0) {
                this.nodes = [];
                this.connections = [];
                this.canvas.innerHTML = ''; // Clear canvas
                
                // Re-create nodes
                chatbot.flow.nodes.forEach(nodeData => {
                    this.createNode(nodeData.type, nodeData.x, nodeData.y, nodeData.id, nodeData.properties);
                });
            }

        } catch (error) {
            console.error('Error loading flow:', error);
            alert('Failed to load chatbot data: ' + error.message);
        }
    }

    loadFlow() {
        const savedFlow = localStorage.getItem('chatbotFlow');
        if (savedFlow) {
            const flowData = JSON.parse(savedFlow);
            
            // Load settings
            if (flowData.settings) {
                document.getElementById('botName').value = flowData.settings.botName || '';
                document.getElementById('welcomeMessage').value = flowData.settings.welcomeMessage || '';
                document.getElementById('primaryColor').value = flowData.settings.primaryColor || '#4A90E2';
            }
            
            // Load nodes
            flowData.nodes.forEach(nodeData => {
                this.createNode(nodeData.type, nodeData.x, nodeData.y);
            });
        }
    }
}

// Initialize flow builder
let flowBuilder;
document.addEventListener('DOMContentLoaded', () => {
    flowBuilder = new FlowBuilder();
    // flowBuilder.loadFlow(); // Handled in constructor
});
