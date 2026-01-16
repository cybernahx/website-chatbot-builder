document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Reset UI
    errorMessage.style.display = 'none';
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    loginBtn.disabled = true;

    try {
        console.log('🔐 Attempting admin login...');
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('📡 Login response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (response.ok) {
            console.log('✅ Login successful, checking admin status...');
            // Check if user is admin
            localStorage.setItem('token', data.token);
            
            // Verify Admin Access using correct header format
            const adminCheck = await fetch(`${CONFIG.API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });

            console.log('👮 Admin check status:', adminCheck.status);

            if (adminCheck.status === 200) {
                console.log('✅ Admin verified! Redirecting...');
                window.location.href = 'admin.html';
            } else {
                console.warn('❌ Not authorized as admin');
                throw new Error('Access Denied: You do not have admin privileges.');
            }
        } else {
            console.error('❌ Login failed:', data);
            throw new Error(data.error || data.msg || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
        localStorage.removeItem('token'); // Clear invalid token
    } finally {
        loginBtn.innerHTML = 'Login to Dashboard';
        loginBtn.disabled = false;
    }
});
