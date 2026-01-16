const API_URL = CONFIG.API_URL;

// Password strength indicator
document.getElementById('password').addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthBar = document.getElementById('strengthBar');
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    strengthBar.className = 'password-strength-bar';
    if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    // Hide previous messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    // Validate passwords match
    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match!';
        errorMsg.style.display = 'block';
        return;
    }

    // Disable button
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Save token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show success message
        successMsg.textContent = 'Account created successfully! Redirecting...';
        successMsg.style.display = 'block';

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        
        // Re-enable button
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
});

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}
