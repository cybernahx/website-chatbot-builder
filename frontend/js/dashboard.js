// Dashboard Application
const API_URL = CONFIG.API_URL;
let currentUser = null;
let currentView = 'overview';
let chatbots = [];
let allLeads = [];
let analytics = {};
let refreshInterval = null;
let isAutoRefreshing = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard loading...');
    console.log('API_URL:', API_URL);
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('❌ No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    console.log('✅ Token found, fetching user profile...');

    // Get user info from token
    try {
        // Fetch full user profile to get plan details
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Profile response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            currentUser = user;
            console.log('👤 User loaded:', user.email);
            
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl) {
                userEmailEl.textContent = user.email || 'User';
            }
            
            // Show upgrade button if free plan
            if (user.plan === 'free') {
                const upgradeContainer = document.getElementById('sidebar-upgrade-container');
                if (upgradeContainer) {
                    upgradeContainer.style.display = 'block';
                }
            }
        } else {
            const errData = await response.json();
            console.error('❌ Profile fetch failed:', errData);
            throw new Error('Failed to fetch user');
        }
    } catch (e) {
        console.error('❌ Invalid token or user fetch failed:', e);
        logout();
        return;
    }

    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view) {
                switchView(view);
            }
        });
    });

    console.log('📊 Loading dashboard data...');
    // Load initial data
    await loadDashboardData();
    switchView('overview');
    
    // Enable auto-refresh: Update every 30 seconds
    startAutoRefresh();
});

// Start auto-refresh for real-time updates
function startAutoRefresh() {
    if (isAutoRefreshing) return;
    
    isAutoRefreshing = true;
    console.log('📡 Auto-refresh enabled (every 30 seconds)');
    
    // Refresh data every 30 seconds
    refreshInterval = setInterval(async () => {
        try {
            // Silently refresh without showing loading
            await loadChatbots();
            await loadAllLeads();
            await loadAnalytics();
            
            // Re-render current view if data changed
            if (currentView === 'overview') {
                renderOverview(document.getElementById('contentArea'));
            } else if (currentView === 'leads') {
                renderLeads(document.getElementById('contentArea'));
            } else if (currentView === 'analytics') {
                renderAnalytics(document.getElementById('contentArea'));
            }
        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }, 30000); // 30 seconds
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        isAutoRefreshing = false;
        console.log('⏸️  Auto-refresh stopped');
    }
}

// Switch between views
function switchView(view) {
    currentView = view;
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        overview: 'Dashboard Overview',
        chatbots: 'My Chatbots',
        leads: 'Leads',
        analytics: 'Analytics',
        billing: 'Billing & Subscription',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[view];

    // Render view
    const contentArea = document.getElementById('contentArea');
    switch(view) {
        case 'overview':
            renderOverview(contentArea);
            break;
        case 'chatbots':
            renderChatbots(contentArea);
            break;
        case 'leads':
            renderLeads(contentArea);
            break;
        case 'analytics':
            renderAnalytics(contentArea);
            break;
        case 'billing':
            renderBilling(contentArea);
            break;
        case 'settings':
            renderSettings(contentArea);
            break;
    }
}

// Load all dashboard data
async function loadDashboardData() {
    showLoading(true);
    try {
        console.log('📥 Loading chatbots, leads, and analytics...');
        await Promise.all([
            loadChatbots(),
            loadAllLeads(),
            loadAnalytics()
        ]);
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showToast('Failed to load dashboard data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// API Calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const fullUrl = `${API_URL}${endpoint}`;
    console.log('🔗 API Call:', fullUrl);

    const response = await fetch(fullUrl, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    console.log('📊 API Response Status:', response.status);

    if (response.status === 401) {
        console.error('❌ Unauthorized - logging out');
        logout();
        throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.error || 'API request failed');
    }

    console.log('✅ API Success:', endpoint);
    return data;
}

async function loadChatbots() {
    try {
        console.log('📚 Fetching chatbots from API...');
        const data = await apiCall('/chatbot/user/list');
        chatbots = data.chatbots || data;
        console.log(`✅ Loaded ${chatbots.length} chatbots`);
    } catch (error) {
        console.error('❌ Error loading chatbots:', error);
        chatbots = [];
    }
}

async function loadAllLeads() {
    try {
        console.log('👥 Fetching leads from all chatbots...');
        allLeads = [];
        for (const bot of chatbots) {
            try {
                // Load with pagination: get first 100 leads
                const response = await apiCall(`/chatbot/${bot.botId}/leads?limit=100&page=1`);
                const leads = response.leads || response;
                allLeads.push(...leads.map(l => ({ ...l, botName: bot.name })));
            } catch (err) {
                console.warn(`⚠️ Could not load leads for bot ${bot.name}:`, err);
            }
        }
        console.log(`✅ Loaded ${allLeads.length} total leads`);
    } catch (error) {
        console.error('❌ Error loading leads:', error);
    }
}

async function loadAnalytics() {
    // Calculate analytics from chatbots and leads
    const totalMessages = chatbots.reduce((sum, bot) => sum + (bot.messageCount || 0), 0);
    const totalLeads = allLeads.length;
    const activeBots = chatbots.filter(b => b.isPublished).length;
    
    // Calculate this month's stats
    const now = new Date();
    const thisMonth = allLeads.filter(l => {
        const leadDate = new Date(l.createdAt);
        return leadDate.getMonth() === now.getMonth() && 
               leadDate.getFullYear() === now.getFullYear();
    }).length;

    analytics = {
        totalBots: chatbots.length,
        activeBots,
        totalMessages,
        totalLeads,
        leadsThisMonth: thisMonth,
        avgQuality: allLeads.length > 0 ? 
            (allLeads.reduce((sum, l) => sum + (l.quality || 3), 0) / allLeads.length).toFixed(1) : 0
    };
}

// Render Functions
function renderOverview(container) {
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Chatbots</h3>
                <p class="value">${analytics.totalBots}</p>
                <p class="change positive"><i class="fas fa-arrow-up"></i> ${analytics.activeBots} active</p>
            </div>
            <div class="stat-card">
                <h3>Total Leads</h3>
                <p class="value">${analytics.totalLeads}</p>
                <p class="change positive"><i class="fas fa-arrow-up"></i> ${analytics.leadsThisMonth} this month</p>
            </div>
            <div class="stat-card">
                <h3>Total Messages</h3>
                <p class="value">${analytics.totalMessages}</p>
                <p class="change positive"><i class="fas fa-arrow-up"></i> Active</p>
            </div>
            <div class="stat-card">
                <h3>Avg Lead Quality</h3>
                <p class="value">${analytics.avgQuality}<small>/5</small></p>
                <p class="change"><i class="fas fa-star"></i> Rating</p>
            </div>
        </div>

        <div class="card">
            <h2>Recent Chatbots</h2>
            <ul class="chatbot-list">
                ${chatbots.slice(0, 5).map(bot => `
                    <li class="chatbot-item">
                        <div class="chatbot-info">
                            <h4>${bot.name}</h4>
                            <p>Created: ${new Date(bot.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span class="badge ${bot.isPublished ? 'active' : 'inactive'}">
                            ${bot.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <div class="chatbot-actions">
                            <button class="btn-icon" onclick="viewChatbot('${bot.botId}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="editChatbot('${bot.botId}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </li>
                `).join('') || '<div class="empty-state"><i class="fas fa-robot"></i><p>No chatbots yet. Create your first one!</p></div>'}
            </ul>
        </div>

        <div class="card">
            <h2>Recent Leads</h2>
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #E0E6ED; text-align: left;">
                        <th style="padding: 12px;">Name</th>
                        <th style="padding: 12px;">Contact</th>
                        <th style="padding: 12px;">Bot</th>
                        <th style="padding: 12px;">Quality</th>
                        <th style="padding: 12px;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${allLeads.slice(0, 10).map(lead => `
                        <tr style="border-bottom: 1px solid #E0E6ED;">
                            <td style="padding: 12px;">${lead.name || 'N/A'}</td>
                            <td style="padding: 12px;">${lead.phone || lead.email || 'N/A'}</td>
                            <td style="padding: 12px;">${lead.botName}</td>
                            <td style="padding: 12px;">
                                ${'⭐'.repeat(lead.quality || 3)}
                            </td>
                            <td style="padding: 12px;">${new Date(lead.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #7F8C8D;">No leads yet</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderChatbots(container) {
    container.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>All Chatbots (${chatbots.length})</h2>
                <button class="btn btn-primary" onclick="showCreateChatbot()">
                    <i class="fas fa-plus"></i> Create New
                </button>
            </div>
            
            ${chatbots.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-robot"></i>
                    <h3>No chatbots yet</h3>
                    <p>Create your first AI chatbot to start capturing leads</p>
                    <button class="btn btn-primary" onclick="showCreateChatbot()">
                        <i class="fas fa-plus"></i> Create Chatbot
                    </button>
                </div>
            ` : `
                <ul class="chatbot-list">
                    ${chatbots.map(bot => `
                        <li class="chatbot-item">
                            <div class="chatbot-info">
                                <h4>${bot.name}</h4>
                                <p>${bot.welcomeMessage}</p>
                                <small style="color: #7F8C8D;">
                                    Properties: ${bot.properties?.length || 0} | 
                                    Knowledge Base: ${bot.knowledgeBase?.length || 0} files |
                                    Created: ${new Date(bot.createdAt).toLocaleDateString()}
                                </small>
                            </div>
                            <span class="badge ${bot.isPublished ? 'active' : 'inactive'}">
                                ${bot.isPublished ? 'Published' : 'Draft'}
                            </span>
                            <div class="chatbot-actions">
                                <button class="btn-icon" onclick="viewChatbot('${bot.botId}')" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon" onclick="editChatbot('${bot.botId}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" onclick="togglePublish('${bot.botId}', ${bot.isPublished})" 
                                        title="${bot.isPublished ? 'Unpublish' : 'Publish'}">
                                    <i class="fas fa-${bot.isPublished ? 'eye-slash' : 'rocket'}"></i>
                                </button>
                                <button class="btn-icon" onclick="getEmbedCode('${bot.botId}')" title="Get Embed Code">
                                    <i class="fas fa-code"></i>
                                </button>
                                <button class="btn-icon" onclick="deleteChatbot('${bot.botId}')" title="Delete" 
                                        style="color: #E74C3C;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `}
        </div>
    `;
}

function renderLeads(container) {
    container.innerHTML = `
        <div class="card">
            <h2>All Leads (${allLeads.length})</h2>
            
            ${allLeads.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-user-tie"></i>
                    <h3>No leads captured yet</h3>
                    <p>When users interact with your chatbots, their contact information will appear here</p>
                </div>
            ` : `
                <div style="margin-bottom: 20px;">
                    <input type="text" id="leadSearch" placeholder="Search leads..." 
                           style="width: 100%; padding: 12px; border: 1px solid #E0E6ED; border-radius: 6px;"
                           onkeyup="filterLeads()">
                </div>
                
                <table style="width:100%; border-collapse: collapse;" id="leadsTable">
                    <thead>
                        <tr style="border-bottom: 2px solid #E0E6ED; text-align: left; background: #f5f7fa;">
                            <th style="padding: 12px;">Name</th>
                            <th style="padding: 12px;">Email</th>
                            <th style="padding: 12px;">Phone</th>
                            <th style="padding: 12px;">Budget</th>
                            <th style="padding: 12px;">Location</th>
                            <th style="padding: 12px;">Chatbot</th>
                            <th style="padding: 12px;">Quality</th>
                            <th style="padding: 12px;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allLeads.map(lead => `
                            <tr style="border-bottom: 1px solid #E0E6ED;" class="lead-row">
                                <td style="padding: 12px;"><strong>${lead.name || 'Anonymous'}</strong></td>
                                <td style="padding: 12px;">${lead.email || '-'}</td>
                                <td style="padding: 12px;">${lead.phone || '-'}</td>
                                <td style="padding: 12px;">${lead.budget || '-'}</td>
                                <td style="padding: 12px;">${lead.location || '-'}</td>
                                <td style="padding: 12px;"><span class="badge active">${lead.botName}</span></td>
                                <td style="padding: 12px;">${'⭐'.repeat(lead.quality || 3)}</td>
                                <td style="padding: 12px;">${new Date(lead.createdAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    `;
}

function renderAnalytics(container) {
    // Prepare chart data
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const leadsPerDay = last7Days.map(date => {
        return allLeads.filter(l => {
            const leadDate = new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return leadDate === date;
        }).length;
    });

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Conversations</h3>
                <p class="value">${analytics.totalMessages}</p>
            </div>
            <div class="stat-card">
                <h3>Conversion Rate</h3>
                <p class="value">${analytics.totalMessages > 0 ? 
                    ((analytics.totalLeads / analytics.totalMessages) * 100).toFixed(1) : 0}%</p>
            </div>
            <div class="stat-card">
                <h3>Active Chatbots</h3>
                <p class="value">${analytics.activeBots}/${analytics.totalBots}</p>
            </div>
            <div class="stat-card">
                <h3>Best Performing</h3>
                <p class="value" style="font-size: 18px;">${chatbots[0]?.name || 'N/A'}</p>
            </div>
        </div>

        <div class="card">
            <h2>Leads Over Time</h2>
            <div class="chart-container">
                <canvas id="leadsChart"></canvas>
            </div>
        </div>

        <div class="card">
            <h2>Chatbot Performance</h2>
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
        </div>
    `;

    // Render charts
    setTimeout(() => {
        // Leads over time chart
        const ctx1 = document.getElementById('leadsChart');
        if (ctx1) {
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Leads',
                        data: leadsPerDay,
                        borderColor: '#4A90E2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

        // Performance chart
        const ctx2 = document.getElementById('performanceChart');
        if (ctx2 && chatbots.length > 0) {
            new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: chatbots.map(b => b.name),
                    datasets: [{
                        label: 'Leads Captured',
                        data: chatbots.map(b => allLeads.filter(l => l.chatbotId === b.botId).length),
                        backgroundColor: '#4A90E2'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }
    }, 100);
}

function renderBilling(container) {
    const currentPlan = localStorage.getItem('userPlan') || 'free';
    
    container.innerHTML = `
        <div class="card">
            <h2>Current Plan</h2>
            <div class="plan-card current">
                <div class="plan-header">
                    <div>
                        <h3>${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan</h3>
                        <p style="color: #7F8C8D;">Active subscription</p>
                    </div>
                    <div class="plan-price">
                        ${currentPlan === 'free' ? '$0' : currentPlan === 'starter' ? '$9' : currentPlan === 'pro' ? '$29' : '$49'}
                        <small>/month</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Available Plans</h2>
            
            <div class="plan-card">
                <div class="plan-header">
                    <div>
                        <h3>Starter Plan</h3>
                        <p style="color: #7F8C8D;">For small businesses</p>
                    </div>
                    <div class="plan-price">$9<small>/month</small></div>
                </div>
                <ul class="plan-features">
                    <li><i class="fas fa-check"></i> 1,000 messages/month</li>
                    <li><i class="fas fa-check"></i> 3 chatbots</li>
                    <li><i class="fas fa-check"></i> WhatsApp notifications</li>
                    <li><i class="fas fa-check"></i> Email support</li>
                    <li><i class="fas fa-check"></i> Basic analytics</li>
                </ul>
                <button class="btn btn-primary" onclick="subscribeToPlan('starter', 'price_starter123')">
                    ${currentPlan === 'starter' ? 'Current Plan' : 'Upgrade to Starter'}
                </button>
            </div>

            <div class="plan-card">
                <div class="plan-header">
                    <div>
                        <h3>Pro Plan</h3>
                        <p style="color: #7F8C8D;">For growing agencies</p>
                    </div>
                    <div class="plan-price">$29<small>/month</small></div>
                </div>
                <ul class="plan-features">
                    <li><i class="fas fa-check"></i> 10,000 messages/month</li>
                    <li><i class="fas fa-check"></i> 10 chatbots</li>
                    <li><i class="fas fa-check"></i> All notifications</li>
                    <li><i class="fas fa-check"></i> Priority support</li>
                    <li><i class="fas fa-check"></i> Advanced analytics</li>
                    <li><i class="fas fa-check"></i> Custom integrations</li>
                </ul>
                <button class="btn btn-primary" onclick="subscribeToPlan('pro', 'price_pro456')">
                    ${currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </button>
            </div>

            <div class="plan-card">
                <div class="plan-header">
                    <div>
                        <h3>Business Plan</h3>
                        <p style="color: #7F8C8D;">For enterprises</p>
                    </div>
                    <div class="plan-price">$49<small>/month</small></div>
                </div>
                <ul class="plan-features">
                    <li><i class="fas fa-check"></i> 50,000 messages/month</li>
                    <li><i class="fas fa-check"></i> Unlimited chatbots</li>
                    <li><i class="fas fa-check"></i> White-label option</li>
                    <li><i class="fas fa-check"></i> Dedicated support</li>
                    <li><i class="fas fa-check"></i> Custom AI training</li>
                    <li><i class="fas fa-check"></i> API access</li>
                </ul>
                <button class="btn btn-primary" onclick="subscribeToPlan('business', 'price_business789')">
                    ${currentPlan === 'business' ? 'Current Plan' : 'Upgrade to Business'}
                </button>
            </div>
        </div>
    `;
}

function renderSettings(container) {
    container.innerHTML = `
        <div class="card">
            <h2>Account Settings</h2>
            <form onsubmit="updateSettings(event)" style="max-width: 500px;">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
                    <input type="email" value="${currentUser.email || ''}" disabled
                           style="width: 100%; padding: 12px; border: 1px solid #E0E6ED; border-radius: 6px; background: #f5f7fa;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">WhatsApp Number (for notifications)</label>
                    <input type="tel" id="whatsappNumber" placeholder="+1234567890"
                           style="width: 100%; padding: 12px; border: 1px solid #E0E6ED; border-radius: 6px;">
                    <small style="color: #7F8C8D;">Format: +[country code][number]</small>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Notification Email</label>
                    <input type="email" id="notificationEmail" placeholder="alerts@example.com"
                           style="width: 100%; padding: 12px; border: 1px solid #E0E6ED; border-radius: 6px;">
                </div>

                <button type="submit" class="btn btn-primary">Save Settings</button>
            </form>
        </div>

        <div class="card">
            <h2>API Keys</h2>
            <p style="color: #7F8C8D;">Use these keys to integrate with external systems</p>
            <div style="background: #f5f7fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>API Key:</strong>
                <code style="display: block; margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
                    ${currentUser.userId}_${Math.random().toString(36).substr(2, 16)}
                </code>
                <button class="btn btn-secondary" onclick="regenerateApiKey()">
                    <i class="fas fa-sync"></i> Regenerate
                </button>
            </div>
        </div>
    `;
}

// Action Functions
async function showCreateChatbot() {
    const name = prompt('Enter chatbot name:');
    if (!name) return;

    const welcomeMessage = prompt('Enter welcome message:', 'Assalam o Alaikum! Main aapki property search mein madad karunga.');
    
    showLoading(true);
    try {
        const newBot = await apiCall('/chatbot/create', {
            method: 'POST',
            body: JSON.stringify({
                name,
                welcomeMessage,
                systemPrompt: `You are a helpful Real Estate AI assistant. Use Roman Urdu and English mix.`
            })
        });

        showToast('Chatbot created successfully!', 'success');
        await loadDashboardData();
        switchView('chatbots');
    } catch (error) {
        showToast('Failed to create chatbot: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function togglePublish(botId, currentState) {
    showLoading(true);
    try {
        await apiCall(`/chatbot/${botId}/publish`, {
            method: 'PATCH',
            body: JSON.stringify({ isPublished: !currentState })
        });

        showToast(currentState ? 'Chatbot unpublished' : 'Chatbot published!', 'success');
        await loadDashboardData();
        switchView('chatbots');
    } catch (error) {
        showToast('Failed to update chatbot: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function getEmbedCode(botId) {
    const code = `<script src="${window.location.origin}/widget/chatbot.js"></script>
<script>
  ChatbotWidget.init({
    botId: '${botId}',
    apiUrl: '${API_URL.replace('/api', '')}',
    primaryColor: '#4A90E2'
  });
</script>`;

    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%;">
            <h2>Embed Code</h2>
            <p>Copy this code and paste it before the closing &lt;/body&gt; tag on your website:</p>
            <textarea readonly style="width: 100%; height: 150px; padding: 12px; border: 1px solid #E0E6ED; border-radius: 6px; font-family: monospace; margin: 20px 0;">${code}</textarea>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`).then(() => showToast('Copied!', 'success'))">
                    <i class="fas fa-copy"></i> Copy Code
                </button>
                <button class="btn btn-secondary" onclick="this.closest('div[style*=fixed]').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function deleteChatbot(botId) {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) return;

    showLoading(true);
    try {
        await apiCall(`/chatbot/${botId}`, { method: 'DELETE' });
        showToast('Chatbot deleted successfully', 'success');
        await loadDashboardData();
        switchView('chatbots');
    } catch (error) {
        showToast('Failed to delete chatbot: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function viewChatbot(botId) {
    const bot = chatbots.find(b => b.botId === botId);
    if (!bot) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; overflow-y: auto;';
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <h2>${bot.name}</h2>
            <p><strong>Bot ID:</strong> ${bot.botId}</p>
            <p><strong>Status:</strong> <span class="badge ${bot.isPublished ? 'active' : 'inactive'}">${bot.isPublished ? 'Published' : 'Draft'}</span></p>
            <p><strong>Welcome Message:</strong> ${bot.welcomeMessage}</p>
            <p><strong>Properties:</strong> ${bot.properties?.length || 0}</p>
            <p><strong>Knowledge Base:</strong> ${bot.knowledgeBase?.length || 0} files</p>
            <p><strong>Created:</strong> ${new Date(bot.createdAt).toLocaleString()}</p>
            
            ${bot.properties && bot.properties.length > 0 ? `
                <h3>Properties:</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${bot.properties.map(p => `
                        <div style="border: 1px solid #E0E6ED; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <strong>${p.location}</strong><br>
                            💰 ${p.price} ${p.currency}<br>
                            🛏️ ${p.bedrooms} bedrooms | 📐 ${p.size}<br>
                            ${p.description || ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <button class="btn btn-secondary" onclick="this.closest('div[style*=fixed]').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function editChatbot(botId) {
    window.location.href = `index.html?botId=${botId}`;
}

// Stripe Integration
async function subscribeToPlan(plan, priceId) {
    showLoading(true);
    try {
        const response = await apiCall('/billing/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({ plan, priceId })
        });

        if (response.url) {
            window.location.href = response.url;
        } else {
            showToast('Subscription updated!', 'success');
            localStorage.setItem('userPlan', plan);
            renderBilling(document.getElementById('contentArea'));
        }
    } catch (error) {
        showToast('Failed to process subscription: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function filterLeads() {
    const search = document.getElementById('leadSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.lead-row');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#E74C3C' : '#4A90E2'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userPlan');
    window.location.href = 'login.html';
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
