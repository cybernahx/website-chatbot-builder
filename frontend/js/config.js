const CONFIG = {
    // Automatically detect if running on localhost
    API_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : 'https://api.your-production-domain.com/api' // REPLACE THIS WITH YOUR ACTUAL PRODUCTION API URL
};
