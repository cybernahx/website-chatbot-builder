// Enhanced Flow Builder with Advanced Features
class FlowBuilderEnhanced {
    constructor() {
        console.log('🚀 Enhanced FlowBuilder constructor started');
        
        // Core elements
        this.canvas = document.getElementById('flowCanvas');
        this.svg = document.getElementById('connectionsLayer');
        this.contextMenu = document.getElementById('contextMenu');
        
        // State
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.copiedNode = null;
        this.draggedComponent = null;
        this.nodeCounter = 1;
        this.zoom = 1;
        this.snapToGrid = false;
        this.gridSize = 20;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        // Bot ID
        this.botId = this.getBotIdFromUrl();
        
        // Auto-save
        this.autoSaveInterval = null;
        
        this.initializeEventListeners();
        this.initializeContextMenu();
        this.initializeKeyboardShortcuts();
        // this.initializeSearch(); // Disabled search functionality
        this.initializeMinimap();
        this.startAutoSave();
        
        if (this.botId) {
            this.loadFlowFromBackend();
        } else {
            this.loadFlow();
        }
        
        this.updateCanvasInfo();
        console.log('✅ Enhanced FlowBuilder initialized');
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
        // Component drag and drop
        const components = document.querySelectorAll('.component');
        console.log('Found components:', components.length);
        
        components.forEach(component => {
            component.addEventListener('dragstart', (e) => {
                this.draggedComponent = e.target.dataset.type;
                console.log('Dragging component:', this.draggedComponent);
            });

            component.addEventListener('click', (e) => {
                e.preventDefault();
                const type = e.currentTarget.dataset.type;
                console.log('Clicked component:', type);
                const x = 250 + (this.nodes.length * 30);
                const y = 150 + (this.nodes.length * 30);
                this.createNode(type, x, y);
            });
        });

        // Canvas drop
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedComponent) {
                const rect = this.canvas.getBoundingClientRect();
                let x = e.clientX - rect.left;
                let y = e.clientY - rect.top;
                
                if (this.snapToGrid) {
                    x = Math.round(x / this.gridSize) * this.gridSize;
                    y = Math.round(y / this.gridSize) * this.gridSize;
                }
                
                this.createNode(this.draggedComponent, x, y);
                this.draggedComponent = null;
            }
        });

        // Toolbar buttons
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('redo').addEventListener('click', () => this.redo());
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomCanvas(0.1));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomCanvas(-0.1));
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());
        document.getElementById('snapToGrid').addEventListener('click', () => this.toggleSnapToGrid());
        document.getElementById('autoArrange').addEventListener('click', () => this.autoArrangeNodes());
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveFlow').addEventListener('click', () => this.saveFlow());

        // Node dragging and Connection creation
        this.canvas.addEventListener('mousedown', (e) => {
            // Check for connector first
            if (e.target.classList.contains('node-connector')) {
                e.stopPropagation();
                const node = e.target.closest('.node');
                this.startConnectionDrag(node, e);
                return;
            }

            if (e.target.classList.contains('node') || e.target.closest('.node')) {
                const node = e.target.classList.contains('node') ? e.target : e.target.closest('.node');
                if (node.dataset.id !== 'start') {
                    this.startDraggingNode(node, e);
                }
            }
        });

        // Click outside to deselect
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.node') && !e.target.closest('.context-menu')) {
                this.deselectAll();
                this.hideContextMenu();
            }
        });
    }

    initializeContextMenu() {
        // Right-click on node
        this.canvas.addEventListener('contextmenu', (e) => {
            const node = e.target.closest('.node');
            if (node && node.dataset.id !== 'start') {
                e.preventDefault();
                this.selectedNode = node;
                this.selectNode(node);
                this.showContextMenu(e.pageX, e.pageY);
            }
        });

        // Context menu actions
        this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleContextAction(action);
                this.hideContextMenu();
            });
        });
    }

    showContextMenu(x, y) {
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.classList.add('active');
    }

    hideContextMenu() {
        this.contextMenu.classList.remove('active');
    }

    handleContextAction(action) {
        if (!this.selectedNode) return;

        switch(action) {
            case 'copy':
                this.copyNode();
                break;
            case 'paste':
                this.pasteNode();
                break;
            case 'duplicate':
                this.duplicateNode();
                break;
            case 'edit':
                this.editNodeProperties();
                break;
            case 'delete':
                this.deleteNode(this.selectedNode.dataset.id);
                break;
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z - Undo
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Y - Redo
            else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
            // Ctrl+C - Copy
            else if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                this.copyNode();
            }
            // Ctrl+V - Paste
            else if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                this.pasteNode();
            }
            // Ctrl+D - Duplicate
            else if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.duplicateNode();
            }
            // Ctrl+S - Save
            else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveFlow();
            }
            // Delete - Delete node
            else if (e.key === 'Delete' && this.selectedNode && this.selectedNode.dataset.id !== 'start') {
                this.deleteNode(this.selectedNode.dataset.id);
            }
        });
    }

    initializeSearch() {
        const searchInput = document.getElementById('nodeSearch');
        const clearBtn = document.getElementById('clearSearch');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            clearBtn.style.display = query ? 'block' : 'none';
            this.searchNodes(query);
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            this.searchNodes('');
        });
    }

    initializeMinimap() {
        this.minimap = document.getElementById('minimap');
        this.minimapViewport = this.minimap.querySelector('.minimap-viewport');
        
        if (!this.minimap || !this.minimapViewport) return;

        // Update minimap on scroll
        this.canvas.parentElement.addEventListener('scroll', () => this.updateMinimap());
        
        // Click on minimap to jump
        this.minimap.addEventListener('click', (e) => {
            const rect = this.minimap.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            const container = this.canvas.parentElement;
            container.scrollLeft = x * container.scrollWidth - container.clientWidth / 2;
            container.scrollTop = y * container.scrollHeight - container.clientHeight / 2;
        });
    }

    updateMinimap() {
        if (!this.minimap || !this.minimapViewport) return;
        
        const container = this.canvas.parentElement;
        const canvasWidth = this.canvas.offsetWidth;
        const canvasHeight = this.canvas.offsetHeight;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate viewport size relative to canvas
        // Use Math.min to ensure viewport doesn't exceed minimap
        const viewportWidth = Math.min(100, (containerWidth / canvasWidth) * 100);
        const viewportHeight = Math.min(100, (containerHeight / canvasHeight) * 100);
        
        // Calculate viewport position
        const left = (container.scrollLeft / canvasWidth) * 100;
        const top = (container.scrollTop / canvasHeight) * 100;
        
        this.minimapViewport.style.width = `${viewportWidth}%`;
        this.minimapViewport.style.height = `${viewportHeight}%`;
        this.minimapViewport.style.left = `${left}%`;
        this.minimapViewport.style.top = `${top}%`;
    }

    searchNodes(query) {
        document.querySelectorAll('.node').forEach(node => {
            if (!query) {
                node.style.opacity = '1';
                return;
            }

            const nodeId = node.dataset.id;
            const nodeText = node.textContent.toLowerCase();
            const nodeType = node.dataset.type || '';
            
            if (nodeId.includes(query) || nodeText.includes(query) || nodeType.includes(query)) {
                node.style.opacity = '1';
                node.style.transform = 'scale(1.05)';
                setTimeout(() => node.style.transform = '', 300);
            } else {
                node.style.opacity = '0.3';
            }
        });
    }

    // Undo/Redo functionality
    saveState() {
        const state = {
            nodes: this.nodes.map(n => ({...n})),
            connections: this.connections.map(c => ({...c}))
        };
        
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;
        
        // Limit history to 50 states
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.updateUndoRedoButtons();
        }
    }

    restoreState(state) {
        // Clear current state
        document.querySelectorAll('.node:not(.start-node)').forEach(n => n.remove());
        this.nodes = [];
        this.connections = [];
        this.svg.innerHTML = '';

        // Restore nodes
        state.nodes.forEach(nodeData => {
            // Handle start node specially
            if (nodeData.id === 'start') {
                const startNode = document.querySelector('.start-node');
                if (startNode) {
                    startNode.style.left = nodeData.x + 'px';
                    startNode.style.top = nodeData.y + 'px';
                    // Ensure it's in our nodes array
                    this.nodes.push(nodeData);
                }
                return;
            }
            this.createNode(nodeData.type, nodeData.x, nodeData.y, nodeData.id, nodeData.properties);
        });

        // Restore connections
        this.connections = state.connections.map(c => ({...c}));
        this.drawConnections();
        
        this.updateCanvasInfo();
        console.log('State restored');
    }

    updateUndoRedoButtons() {
        document.getElementById('undo').disabled = this.historyIndex <= 0;
        document.getElementById('redo').disabled = this.historyIndex >= this.history.length - 1;
    }

    // Copy/Paste/Duplicate
    copyNode() {
        if (!this.selectedNode) return;
        this.copiedNode = {
            type: this.selectedNode.dataset.type,
            properties: this.getNodeProperties(this.selectedNode)
        };
        console.log('Node copied:', this.copiedNode);
    }

    pasteNode() {
        if (!this.copiedNode) return;
        const x = 300 + (this.nodes.length * 30);
        const y = 200 + (this.nodes.length * 30);
        this.createNode(this.copiedNode.type, x, y, null, this.copiedNode.properties);
    }

    duplicateNode() {
        this.copyNode();
        this.pasteNode();
    }

    getNodeProperties(node) {
        const nodeData = this.nodes.find(n => n.id === node.dataset.id);
        return nodeData ? JSON.parse(JSON.stringify(nodeData.properties || {})) : {};
    }

    editNodeProperties() {
        if (!this.selectedNode) return;
        this.selectNode(this.selectedNode);
    }

    // Grid and alignment
    toggleSnapToGrid() {
        this.snapToGrid = !this.snapToGrid;
        const btn = document.getElementById('snapToGrid');
        btn.style.background = this.snapToGrid ? 'var(--primary-color)' : '';
        btn.style.color = this.snapToGrid ? 'white' : '';
        console.log('Snap to grid:', this.snapToGrid);
    }

    autoArrangeNodes() {
        const nodes = Array.from(document.querySelectorAll('.node:not(.start-node)'));
        let x = 100;
        let y = 300;
        const spacing = 280;

        nodes.forEach((node, index) => {
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            
            x += spacing;
            if (x > this.canvas.offsetWidth - 200) {
                x = 100;
                y += 200;
            }
        });

        this.drawConnections();
        console.log('Nodes auto-arranged');
    }

    // Auto-save
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveFlow(true);
        }, 30000); // Auto-save every 30 seconds
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    // Canvas info updates
    updateCanvasInfo() {
        const nodeCount = document.querySelectorAll('.node').length;
        document.getElementById('nodeCount').textContent = nodeCount + (nodeCount === 1 ? ' node' : ' nodes');
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
    }

    // Continue with remaining methods from original flowBuilder.js...
    createNode(type, x, y, id = null, properties = {}) {
        const nodeId = id || `node-${this.nodeCounter++}`;
        
        const node = document.createElement('div');
        node.className = 'node';
        node.dataset.id = nodeId;
        node.dataset.type = type;
        node.style.left = x + 'px';
        node.style.top = y + 'px';

        const title = this.getNodeTitle(type);
        const icon = this.getNodeIcon(type);

        node.innerHTML = `
            <div class="node-header">
                <i class="${icon}"></i>
                <span>${title}</span>
            </div>
            <div class="node-body">
                <p>${this.getNodeDescription(type)}</p>
            </div>
            <div class="node-connector output" data-node="${nodeId}"></div>
        `;

        this.canvas.appendChild(node);
        this.nodes.push({ id: nodeId, type, x, y, properties });
        
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });

        this.updateCanvasInfo();
        this.saveState();
        return node;
    }

    selectNode(node) {
        document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
        node.classList.add('selected');
        this.selectedNode = node;
        this.showNodeProperties(node);
    }

    deselectAll() {
        document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
        this.selectedNode = null;
        document.getElementById('propertiesContent').innerHTML = '<p class="no-selection">Select a node to edit properties</p>';
    }

    showNodeProperties(node) {
        const type = node.dataset.type;
        const propertiesContent = document.getElementById('propertiesContent');
        
        propertiesContent.innerHTML = `
            <div class="property-group">
                <label>Node Type</label>
                <input type="text" value="${type}" readonly>
            </div>
            <div class="property-group">
                <label>Node ID</label>
                <input type="text" value="${node.dataset.id}" readonly>
            </div>
            <div class="property-group">
                <label>Position</label>
                <input type="text" value="X: ${parseInt(node.style.left)}, Y: ${parseInt(node.style.top)}" readonly>
            </div>
        `;
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

    startDraggingNode(node, e) {
        const startX = e.clientX;
        const startY = e.clientY;
        const nodeX = parseInt(node.style.left);
        const nodeY = parseInt(node.style.top);

        const onMouseMove = (e) => {
            let newX = nodeX + (e.clientX - startX);
            let newY = nodeY + (e.clientY - startY);

            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }

            node.style.left = newX + 'px';
            node.style.top = newY + 'px';
            this.drawConnections();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.saveState();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    deleteNode(nodeId) {
        if (nodeId === 'start') return;
        
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (node) {
            node.remove();
            this.nodes = this.nodes.filter(n => n.id !== nodeId);
            this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
            this.drawConnections();
            this.updateCanvasInfo();
            this.saveState();
        }
    }

    startConnectionDrag(sourceNode, e) {
        const sourceId = sourceNode.dataset.id;
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Create temp line
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection-line temp-connection');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        path.style.pointerEvents = 'none';
        path.style.strokeDasharray = '5,5'; // Dashed line for temp connection
        this.svg.appendChild(path);
        
        const sourceRect = sourceNode.getBoundingClientRect();
        const startX = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
        const startY = sourceRect.bottom - canvasRect.top;

        const onMouseMove = (e) => {
            const endX = e.clientX - canvasRect.left;
            const endY = e.clientY - canvasRect.top;
            
            // Simple line for dragging
            const d = `M ${startX} ${startY} L ${endX} ${endY}`;
            path.setAttribute('d', d);
        };

        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            path.remove();
            
            // Check if dropped on a node
            // We need to temporarily hide the dragged element or use elementFromPoint carefully
            // But since pointerEvents is none on path, it should be fine.
            
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const targetNode = target ? target.closest('.node') : null;
            
            if (targetNode && targetNode.dataset.id !== sourceId) {
                this.connectNodes(sourceId, targetNode.dataset.id);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    connectNodes(sourceId, targetId) {
        // Check if connection already exists
        if (this.connections.some(c => c.source === sourceId && c.target === targetId)) {
            return;
        }
        
        this.connections.push({ source: sourceId, target: targetId });
        this.drawConnections();
        this.saveState();
        console.log(`Connected ${sourceId} to ${targetId}`);
    }

    drawConnections() {
        this.svg.innerHTML = '';
        
        this.connections.forEach(conn => {
            const sourceNode = document.querySelector(`.node[data-id="${conn.source}"]`);
            const targetNode = document.querySelector(`.node[data-id="${conn.target}"]`);
            
            if (sourceNode && targetNode) {
                this.drawConnectionLine(sourceNode, targetNode);
            }
        });
    }

    drawConnectionLine(sourceNode, targetNode) {
        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate coordinates relative to canvas
        const startX = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
        const startY = sourceRect.bottom - canvasRect.top; // From bottom center
        const endX = targetRect.left + targetRect.width / 2 - canvasRect.left;
        const endY = targetRect.top - canvasRect.top; // To top center
        
        // Create SVG path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Bezier curve
        const controlY1 = startY + 50;
        const controlY2 = endY - 50;
        
        const d = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'connection-line');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        // Add click event to delete connection
        path.addEventListener('click', (e) => {
            if (e.ctrlKey || confirm('Delete this connection?')) {
                this.deleteConnection(sourceNode.dataset.id, targetNode.dataset.id);
            }
        });
        
        this.svg.appendChild(path);
    }

    deleteConnection(sourceId, targetId) {
        this.connections = this.connections.filter(c => !(c.source === sourceId && c.target === targetId));
        this.drawConnections();
        this.saveState();
    }

    zoomCanvas(delta) {
        this.zoom += delta;
        this.zoom = Math.max(0.5, Math.min(2, this.zoom));
        this.canvas.style.transform = `scale(${this.zoom})`;
        this.updateCanvasInfo();
    }

    resetZoom() {
        this.zoom = 1;
        this.canvas.style.transform = 'scale(1)';
        this.updateCanvasInfo();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            document.querySelectorAll('.node:not(.start-node)').forEach(n => n.remove());
            this.nodes = [];
            this.connections = [];
            this.drawConnections();
            this.updateCanvasInfo();
            this.saveState();
        }
    }

    async saveFlow(autoSave = false) {
        const flowData = {
            nodes: this.nodes,
            connections: this.connections,
            settings: {
                zoom: this.zoom,
                snapToGrid: this.snapToGrid
            }
        };

        try {
            if (this.botId) {
                await this.apiCall(`/chatbot/${this.botId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ flow: flowData })
                });
                if (!autoSave) alert('Flow saved successfully!');
            } else {
                localStorage.setItem('chatbotFlow', JSON.stringify(flowData));
                if (!autoSave) alert('Flow saved locally!');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (!autoSave) alert('Error saving flow');
        }
    }

    loadFlow() {
        const saved = localStorage.getItem('chatbotFlow');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                console.log('Loaded flow:', data);
                
                if (data.nodes) {
                    // Convert old format if necessary or just use restoreState
                    // restoreState expects { nodes: [], connections: [] }
                    this.restoreState(data);
                    
                    if (data.settings) {
                        this.zoom = data.settings.zoom || 1;
                        this.snapToGrid = data.settings.snapToGrid || false;
                        this.canvas.style.transform = `scale(${this.zoom})`;
                        // Update snap toggle button state
                        const btn = document.getElementById('snapToGrid');
                        if (btn) {
                            btn.style.background = this.snapToGrid ? 'var(--primary-color)' : '';
                            btn.style.color = this.snapToGrid ? 'white' : '';
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading flow:', e);
            }
        }
    }

    async loadFlowFromBackend() {
        try {
            const bot = await this.apiCall(`/chatbot/${this.botId}`);
            if (bot.flow) {
                console.log('Loaded from backend:', bot.flow);
                this.restoreState(bot.flow);
                
                if (bot.flow.settings) {
                    this.zoom = bot.flow.settings.zoom || 1;
                    this.snapToGrid = bot.flow.settings.snapToGrid || false;
                    this.canvas.style.transform = `scale(${this.zoom})`;
                }
            }
        } catch (error) {
            console.error('Load error:', error);
        }
    }

    loadTemplate(templateName) {
        console.log('Loading template:', templateName);
        
        // Clear current canvas except start node
        this.clearCanvas();
        
        // Template configurations
        const templates = {
            'customer-support': {
                nodes: [
                    { id: 'start', type: 'text', x: 100, y: 100, properties: {} },
                    { id: 'node-1', type: 'text', x: 100, y: 250, properties: { text: 'How can I help you today?' } },
                    { id: 'node-2', type: 'button', x: 100, y: 400, properties: { buttons: ['FAQ', 'Support', 'Contact'] } }
                ],
                connections: [
                    { source: 'start', target: 'node-1' },
                    { source: 'node-1', target: 'node-2' }
                ]
            },
            'real-estate': {
                nodes: [
                    { id: 'start', type: 'text', x: 100, y: 100, properties: {} },
                    { id: 'node-1', type: 'text', x: 100, y: 250, properties: { text: 'Welcome! Looking to buy or sell?' } },
                    { id: 'node-2', type: 'button', x: 100, y: 400, properties: { buttons: ['Buy', 'Sell', 'Rent'] } },
                    { id: 'node-3', type: 'input', x: 400, y: 400, properties: { inputType: 'text', label: 'Enter your budget' } }
                ],
                connections: [
                    { source: 'start', target: 'node-1' },
                    { source: 'node-1', target: 'node-2' },
                    { source: 'node-2', target: 'node-3' }
                ]
            },
            'lead-gen': {
                nodes: [
                    { id: 'start', type: 'text', x: 100, y: 100, properties: {} },
                    { id: 'node-1', type: 'text', x: 100, y: 250, properties: { text: 'Hi! Let me help you get started.' } },
                    { id: 'node-2', type: 'input', x: 100, y: 400, properties: { inputType: 'text', label: 'What\'s your name?' } },
                    { id: 'node-3', type: 'input', x: 100, y: 550, properties: { inputType: 'email', label: 'Your email?' } },
                    { id: 'node-4', type: 'text', x: 100, y: 700, properties: { text: 'Thank you! We\'ll be in touch.' } }
                ],
                connections: [
                    { source: 'start', target: 'node-1' },
                    { source: 'node-1', target: 'node-2' },
                    { source: 'node-2', target: 'node-3' },
                    { source: 'node-3', target: 'node-4' }
                ]
            }
        };
        
        const template = templates[templateName];
        if (template) {
            this.restoreState(template);
            console.log('Template loaded:', templateName);
        } else {
            console.warn('Template not found:', templateName);
        }
    }
}

// Global instance
window.FlowBuilder = FlowBuilderEnhanced;

