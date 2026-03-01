// API Base URL
const API_URL = 'http://localhost:5000/api';

// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Update navigation based on login status
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
});

function updateNavigation() {
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;

    if (token && user) {
        // User is logged in
        if (user.role === 'customer') {
            authLinks.innerHTML = `
                <a class="nav-link" href="pages/customer-dashboard.html">
                    <i class="bi bi-speedometer2"></i> Dashboard
                </a>
            `;
        } else if (user.role === 'professional') {
            authLinks.innerHTML = `
                <a class="nav-link" href="pages/professional-dashboard.html">
                    <i class="bi bi-speedometer2"></i> Dashboard
                </a>
            `;
        } else if (user.role === 'admin') {
            authLinks.innerHTML = `
                <a class="nav-link" href="pages/admin-dashboard.html">
                    <i class="bi bi-speedometer2"></i> Admin
                </a>
            `;
        }
        
        // Add logout button
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            // Check if logout button already exists
            if (!document.getElementById('logoutBtn')) {
                const logoutLi = document.createElement('li');
                logoutLi.className = 'nav-item';
                logoutLi.innerHTML = `
                    <a class="nav-link" href="#" id="logoutBtn" onclick="logout()">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </a>
                `;
                navbarNav.appendChild(logoutLi);
            }
        }
    } else {
        // User is not logged in
        authLinks.innerHTML = `
            <a class="nav-link" href="pages/login.html">Login</a>
        `;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Show loading spinner
function showLoading() {
    let spinner = document.querySelector('.spinner-overlay');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = 'spinner-overlay';
        spinner.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(spinner);
    }
    spinner.style.display = 'flex';
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    let alert = document.querySelector('.alert');
    if (!alert) {
        alert = document.createElement('div');
        alert.className = 'alert alert-dismissible fade show';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <span class="alert-message"></span>
            <button type="button" class="btn-close" onclick="this.parentElement.style.display='none'"></button>
        `;
        document.body.appendChild(alert);
    }
    
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.querySelector('.alert-message').textContent = message;
    alert.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
    }).format(amount);
}

// Search professionals function
function searchProfessionals() {
    const trade = document.getElementById('tradeSelect')?.value || '';
    const location = document.getElementById('locationInput')?.value || '';
    
    let url = 'pages/find-professionals.html?';
    if (trade) url += `trade=${trade}&`;
    if (location) url += `location=${encodeURIComponent(location)}`;
    
    window.location.href = url;
}

// Search by trade
function searchByTrade(trade) {
    window.location.href = `pages/find-professionals.html?trade=${trade}`;
}

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Make API call with authorization
async function apiCall(url, method = 'GET', data = null, isFormData = false) {
    const headers = {};
    
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data) {
        if (isFormData) {
            options.body = data;
        } else {
            options.body = JSON.stringify(data);
        }
    }
    
    try {
        showLoading();
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        showAlert(error.message, 'danger');
        throw error;
    } finally {
        hideLoading();
    }
}