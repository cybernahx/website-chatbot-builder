const API_URL = CONFIG.API_URL;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    // Hide previous messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    // Disable button
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Save token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show success message
        successMsg.textContent = 'Login successful! Redirecting...';
        successMsg.style.display = 'block';

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        
        // Re-enable button
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In';
    }
});

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}
