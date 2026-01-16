// Check auth on load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'admin_login.html';
        return;
    }
    
    // Verify admin status (simple check, real check is on backend)
    // In a real app, you'd decode the token or hit a /me endpoint
    
    loadStats();
    loadUsers();
    loadSettings();
    
    // Setup event listeners for navigation
    document.querySelectorAll('[data-section]').forEach(item => {
        item.addEventListener('click', (e) => {
            const sectionId = e.currentTarget.dataset.section;
            showSection(sectionId);
        });
    });
    
    // Setup logout listener
    document.querySelectorAll('[data-action="logout"]').forEach(item => {
        item.addEventListener('click', logout);
    });
    
    // Setup button listeners
    const refreshBtn = document.getElementById('refresh-stats-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadStats);
    
    const savePricingBtn = document.getElementById('save-pricing-btn');
    if (savePricingBtn) savePricingBtn.addEventListener('click', savePricing);
    
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSystemSettings);
    
    const updateUserBtn = document.getElementById('update-user-btn');
    if (updateUserBtn) updateUserBtn.addEventListener('click', updateUser);
    
    // Setup modal close buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            closeModal(modalId);
        });
    });
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'admin_login.html';

}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.main-content > div').forEach(div => div.style.display = 'none');
    // Show selected
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// --- Stats ---
async function loadStats() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.status === 403) {
            alert('Access Denied: You are not an admin.');
            window.location.href = 'admin_login.html';
            return;
        }

        const data = await response.json();
        
        document.getElementById('total-users').textContent = data.totalUsers;
        document.getElementById('total-bots').textContent = data.totalChatbots;
        document.getElementById('total-messages').textContent = data.totalMessages;
        
        // Populate recent users
        const tbody = document.getElementById('recent-users-table');
        tbody.innerHTML = data.recentUsers.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge status-active">${user.plan}</span></td>
                <td>${new Date(user.date || Date.now()).toLocaleDateString()}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// --- Users ---
async function loadUsers(page = 1) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/users?page=${page}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = data.users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.plan}</td>
                <td>${user.chatbotLimit}</td>
                <td>
                    <button class="action-btn btn-edit" data-edit-user="${user._id}" data-plan="${user.plan}" data-bots="${user.chatbotLimit}" data-convs="${user.conversationLimit}" data-role="${user.role || 'user'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" data-delete-user="${user._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners to dynamically created buttons
        document.querySelectorAll('[data-edit-user]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.editUser;
                const plan = this.dataset.plan;
                const bots = this.dataset.bots;
                const convs = this.dataset.convs;
                const role = this.dataset.role;
                openEditUser(id, plan, bots, convs, role);
            });
        });
        
        document.querySelectorAll('[data-delete-user]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.deleteUser;
                deleteUser(id);
            });
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// --- Edit User ---
function openEditUser(id, plan, bots, convs, role) {
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-user-plan').value = plan;
    document.getElementById('edit-user-bots').value = bots;
    document.getElementById('edit-user-convs').value = convs;
    document.getElementById('edit-user-role').value = role;
    
    document.getElementById('editUserModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function updateUser() {
    const id = document.getElementById('edit-user-id').value;
    const updates = {
        plan: document.getElementById('edit-user-plan').value,
        chatbotLimit: document.getElementById('edit-user-bots').value,
        conversationLimit: document.getElementById('edit-user-convs').value,
        role: document.getElementById('edit-user-role').value
    };

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            alert('User updated successfully');
            closeModal('editUserModal');
            loadUsers();
        } else {
            alert('Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            loadUsers();
            loadStats(); // Refresh stats too
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

// --- Settings & Pricing ---
let currentSettings = {};

async function loadSettings() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/settings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const settings = await response.json();
        currentSettings = settings;

        // Populate Pricing
        const container = document.getElementById('pricing-plans-container');
        container.innerHTML = Object.entries(settings.pricingPlans).map(([key, plan]) => `
            <div class="pricing-card">
                <h3>${plan.name} (${key})</h3>
                <div class="form-group">
                    <label>Price ($)</label>
                    <input type="number" value="${plan.price}" data-plan-field="${key}-price">
                </div>
                <div class="form-group">
                    <label>Chatbot Limit</label>
                    <input type="number" value="${plan.limits.chatbots}" data-plan-field="${key}-bots">
                </div>
                <div class="form-group">
                    <label>Message Limit</label>
                    <input type="number" value="${plan.limits.conversations}" data-plan-field="${key}-convs">
                </div>
            </div>
        `).join('');

        // Add event listeners to plan inputs
        document.querySelectorAll('[data-plan-field]').forEach(input => {
            input.addEventListener('change', function() {
                const [planKey, field] = this.dataset.planField.split('-');
                const value = this.value;
                if (field === 'price') {
                    currentSettings.pricingPlans[planKey].price = Number(value);
                } else if (field === 'bots') {
                    currentSettings.pricingPlans[planKey].limits.chatbots = Number(value);
                } else if (field === 'convs') {
                    currentSettings.pricingPlans[planKey].limits.conversations = Number(value);
                }
            });
        });

        // Populate General Settings
        if (settings.general) {
            document.getElementById('setting-registrations').checked = settings.general.allowRegistration;
            document.getElementById('setting-maintenance').checked = settings.general.maintenanceMode;
            document.getElementById('setting-app-name').value = settings.general.appName;
        }

    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function savePricing() {
    await saveSettingsPayload({ pricingPlans: currentSettings.pricingPlans });
}

async function saveSystemSettings() {
    const general = {
        allowRegistration: document.getElementById('setting-registrations').checked,
        maintenanceMode: document.getElementById('setting-maintenance').checked,
        appName: document.getElementById('setting-app-name').value
    };
    await saveSettingsPayload({ general });
}

async function saveSettingsPayload(payload) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Settings saved successfully');
        } else {
            alert('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}
