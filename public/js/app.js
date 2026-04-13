/**
 * RGS STORE — Frontend Core Logic v3.0
 * Handles API communication, Auth state, and dynamic rendering.
 * Author: Senior Fullstack Engineer
 */

const API_BASE = '/api/v1';

const store = {
    // --- AUTH MANAGEMENT ---
    getToken() { return localStorage.getItem('rgs_jwt'); },
    setToken(tk) { localStorage.setItem('rgs_jwt', tk); },
    removeAuth() { 
        localStorage.removeItem('rgs_jwt'); 
        localStorage.removeItem('rgs_user');
    },
    getUser() {
        const u = localStorage.getItem('rgs_user');
        return u ? JSON.parse(u) : null;
    },
    setUser(u) { localStorage.setItem('rgs_user', JSON.stringify(u)); },

    // --- HELPER FETCH ---
    async apiCall(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
            const data = await res.json();
            
            if (res.status === 401) {
                this.removeAuth();
                if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                    window.location.href = '/login.html';
                }
            }
            return data;
        } catch (err) {
            console.error('API Error:', err);
            return { success: false, message: 'Gagal terhubung ke server.' };
        }
    },

    // --- PRODUCT LOGIC ---
    async getProducts(params = {}) {
        const qs = new URLSearchParams(params).toString();
        const res = await this.apiCall(`/products${qs ? '?' + qs : ''}`);
        return res.success ? res.data : [];
    },

    async getCategories() {
        const res = await this.apiCall('/products/categories/list');
        return res.success ? res.data : [];
    },

    // --- UI RENDERERS ---
    formatRupiah(num) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    },

    showToast(msg, type = 'success') {
        const container = document.getElementById('custom-toast') || (() => {
            const c = document.createElement('div');
            c.id = 'custom-toast';
            document.body.appendChild(c);
            return c;
        })();

        const item = document.createElement('div');
        item.className = `toast-item ${type}`;
        item.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="toast-msg">${msg}</span>
        `;
        container.appendChild(item);
        setTimeout(() => {
            item.style.opacity = '0';
            setTimeout(() => item.remove(), 500);
        }, 3000);
    },

    updateNavbar() {
        const user = this.getUser();
        const navAuth = document.getElementById('nav-auth-container');
        if (!navAuth) return;

        if (user) {
            navAuth.innerHTML = `
                <div class="user-profile-nav">
                    <a href="/dashboard.html" class="nav-user-link">
                        <span class="user-name-txt">Halo, ${user.name.split(' ')[0]}</span>
                        <div class="avatar-sm">${user.name[0].toUpperCase()}</div>
                    </a>
                    <button onclick="store.logout()" class="btn-logout-tiny">Logout</button>
                </div>
            `;
        } else {
            navAuth.innerHTML = `
                <a href="/login.html" class="btn-login-premium">Masuk</a>
                <a href="/register.html" class="btn-register-outline">Daftar</a>
            `;
        }
    },

    logout() {
        this.removeAuth();
        window.location.reload();
    }
};

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
    store.updateNavbar();
});

window.store = store; // Make it global
