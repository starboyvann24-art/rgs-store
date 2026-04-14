/**
 * RGS STORE — Frontend Core Logic v3.1
 * Single object handles ALL API calls, auth state, and UI helpers.
 * Exposes both `store` AND `appUtils` (alias) for full compatibility.
 */

const API_BASE = '/api/v1';

const store = {
    // ─── AUTH ──────────────────────────────────────────────────
    getToken() { return localStorage.getItem('rgs_jwt'); },
    setToken(tk) { localStorage.setItem('rgs_jwt', tk); },
    getUser() {
        try { return JSON.parse(localStorage.getItem('rgs_user') || 'null'); }
        catch { return null; }
    },
    setUser(u) { localStorage.setItem('rgs_user', JSON.stringify(u)); },
    isLoggedIn() { return !!this.getToken(); },
    getSavedUser() { return this.getUser(); },
    removeAuth() {
        localStorage.removeItem('rgs_jwt');
        localStorage.removeItem('rgs_user');
    },

    // ─── CORE FETCH ────────────────────────────────────────────
    async apiCall(endpoint, options = {}) {
        const token = this.getToken();
        const isFormData = options.body instanceof FormData;
        
        const headers = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
            const data = await res.json();
            if (res.status === 401) {
                this.removeAuth();
                const onPublic = ['/', '/index.html', '/login.html', '/register.html', '/tos.html', '/product.html'].some(p => window.location.pathname.endsWith(p));
                if (!onPublic) window.location.href = '/login.html';
            }
            return data;
        } catch (err) {
            console.error('API Error:', err);
            return { success: false, message: 'Gagal terhubung ke server. Coba lagi.' };
        }
    },

    // ─── AUTH METHODS ──────────────────────────────────────────
    async login(email, password) {
        const res = await this.apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (res.success && res.data) {
            this.setToken(res.data.token);
            this.setUser(res.data.user);
        }
        return res;
    },

    async register(name, email, password, whatsapp = '') {
        const res = await this.apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, whatsapp })
        });
        if (res.success && res.data) {
            this.setToken(res.data.token);
            this.setUser(res.data.user);
        }
        return res;
    },

    logout() { this.removeAuth(); window.location.href = '/login.html'; },

    // ─── PRODUCTS ─────────────────────────────────────────────
    async getProducts(params = {}) {
        const qs = new URLSearchParams(params).toString();
        const res = await this.apiCall(`/products${qs ? '?' + qs : ''}`);
        return res.success ? res.data : [];
    },

    async getProductById(id) {
        const res = await this.apiCall(`/products/${id}`);
        return res.success ? res.data : null;
    },

    async getCategories() {
        const res = await this.apiCall('/products/categories/list');
        return res.success ? res.data : [];
    },

    async createProduct(formData) {
        // formData is expected to be a FormData object
        return this.apiCall('/products', { 
            method: 'POST', 
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    },

    async updateProduct(id, formData) {
        return this.apiCall(`/products/${id}`, { 
            method: 'PUT', 
            body: formData,
            headers: {} 
        });
    },

    async deleteProduct(id) {
        return this.apiCall(`/products/${id}`, { method: 'DELETE' });
    },

    async getAdminProducts() {
        const res = await this.apiCall('/products/admin/all');
        return res.success ? res.data : [];
    },

    async getAllProductsAdmin() { return this.getAdminProducts(); },

    // ─── ORDERS ───────────────────────────────────────────────
    async createOrder(data) {
        return this.apiCall('/orders', { method: 'POST', body: JSON.stringify(data) });
    },

    async getMyOrders() {
        const res = await this.apiCall('/orders/me');
        return res.success ? res.data : [];
    },

    async getAllOrders() {
        const res = await this.apiCall('/orders');
        return res.success ? res.data : [];
    },

    async getOrderStats() {
        return this.apiCall('/orders/stats/summary');
    },

    async updateOrderStatus(id, status) {
        return this.apiCall(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    async deliverOrder(id, credentials) {
        return this.apiCall(`/orders/${id}/deliver`, {
            method: 'PUT',
            body: JSON.stringify({ credentials })
        });
    },

    // ─── PAYMENT METHODS ───────────────────────────────────────
    async getPaymentMethods() {
        const res = await this.apiCall('/payment-methods');
        return res.success ? res.data : [];
    },

    async getAllPaymentMethods() {
        const res = await this.apiCall('/payment-methods/all');
        return res.success ? res.data : [];
    },

    async createPaymentMethod(data) {
        return this.apiCall('/payment-methods', { method: 'POST', body: JSON.stringify(data) });
    },

    async updatePaymentMethod(id, data) {
        return this.apiCall(`/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    async deletePaymentMethod(id) {
        return this.apiCall(`/payment-methods/${id}`, { method: 'DELETE' });
    },

    // ─── CS TICKETS ────────────────────────────────────────────
    async createTicket(subject, message) {
        return this.apiCall('/tickets', {
            method: 'POST',
            body: JSON.stringify({ subject, message })
        });
    },

    async getMyTickets() {
        const res = await this.apiCall('/tickets/me');
        return res.success ? res.data : [];
    },

    async getAllTickets() {
        const res = await this.apiCall('/tickets');
        return res.success ? res.data : [];
    },

    async replyTicket(id, reply) {
        return this.apiCall(`/tickets/${id}/reply`, {
            method: 'PUT',
            body: JSON.stringify({ reply })
        });
    },

    async updateTicketStatus(id, status) {
        return this.apiCall(`/tickets/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    // ─── REVIEWS ──────────────────────────────────────────────
    async createReview(order_id, rating, comment) {
        return this.apiCall('/reviews', {
            method: 'POST',
            body: JSON.stringify({ order_id, rating: parseInt(rating, 10), comment })
        });
    },

    async getProductReviews(productId) {
        const res = await this.apiCall(`/reviews/product/${productId}`);
        return res.success ? res.data : { reviews: [], summary: { avg_rating: 0, total: 0 } };
    },

    // ─── CART (localStorage) ────────────────────────────────────
    getCart() {
        try { return JSON.parse(localStorage.getItem('rgs_cart') || '[]'); }
        catch { return []; }
    },

    saveCart(cart) { localStorage.setItem('rgs_cart', JSON.stringify(cart)); },

    addToCart(product, qty = 1) {
        const cart = this.getCart();
        const idx = cart.findIndex(i => i.id === product.id);
        if (idx >= 0) { cart[idx].qty = (cart[idx].qty || 1) + qty; }
        else { cart.push({ ...product, qty }); }
        this.saveCart(cart);
        this.updateCartBadge();
        this.showToast(`🛒 ${product.name} ditambahkan!`, 'success');
    },

    getCartCount() { return this.getCart().reduce((s, i) => s + (i.qty || 1), 0); },

    updateCartBadge() {
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = this.getCartCount();
    },

    // ─── FORMATTING ────────────────────────────────────────────
    formatRupiah(num) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num || 0);
    },

    formatDate(dt) {
        if (!dt) return '-';
        return new Date(dt).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    formatDateShort(dt) {
        if (!dt) return '-';
        return new Date(dt).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    },

    statusBadge(status) {
        const map = {
            pending:    '<span class="badge badge-pending">⏳ Pending</span>',
            processing: '<span class="badge badge-processing">🔄 Proses</span>',
            shipped:    '<span class="badge badge-shipped">📦 Dikirim</span>',
            success:    '<span class="badge badge-success">✅ Selesai</span>',
            failed:     '<span class="badge badge-failed">❌ Gagal</span>',
            cancelled:  '<span class="badge badge-cancelled">🚫 Batal</span>',
            open:       '<span class="badge badge-open">📭 Open</span>',
            replied:    '<span class="badge badge-replied">💬 Dibalas</span>',
            closed:     '<span class="badge badge-closed">🔒 Closed</span>',
        };
        return map[status] || `<span class="badge">${status}</span>`;
    },

    getStatusBadge(status) { return this.statusBadge(status); },

    renderStars(rating, total = 0) {
        let starsHtml = '';
        const r = Math.round(rating || 0);
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="star ${i <= r ? 'active' : ''}" style="color:${i <= r ? '#f59e0b' : '#334155'}; font-size:0.8rem">★</span>`;
        }
        return `
            <div style="display:flex;align-items:center;gap:4px">
                <div style="display:flex">${starsHtml}</div>
                ${total > 0 ? `<span style="font-size:0.7rem;color:var(--text-muted);font-weight:600">(${total})</span>` : ''}
            </div>`;
    },

    // ─── NAVBAR ───────────────────────────────────────────────
    updateNavbar() {
        const user = this.getUser();
        const navAuth = document.getElementById('nav-auth-container');
        if (navAuth) {
            if (user) {
                navAuth.innerHTML = `
                    <div class="user-nav-group">
                        <a href="${user.role === 'admin' ? '/admin.html' : '/dashboard.html'}" class="user-nav-link">
                            <div class="avatar-xs">${user.name[0].toUpperCase()}</div>
                            <span>${user.name.split(' ')[0]}</span>
                        </a>
                        <button onclick="store.logout()" class="btn-logout-sm">Logout</button>
                    </div>`;
            } else {
                navAuth.innerHTML = `
                    <a href="/login.html" class="btn-nav-login">Masuk</a>
                    <a href="/register.html" class="btn-nav-register">Daftar</a>`;
            }
        }
        this.updateCartBadge();
    },

    // ─── TOAST ────────────────────────────────────────────────
    showToast(msg, type = 'success') {
        let container = document.getElementById('toast-area');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-area';
            document.body.appendChild(container);
        }
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;
        toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = '0.4s';
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    },

    // ─── MODAL ────────────────────────────────────────────────
    showModal(title, bodyHTML, footerHTML = '') {
        const existing = document.getElementById('rgs-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'rgs-modal';
        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <h3 style="font-weight:800;font-size:1.1rem">${title}</h3>
                    <button class="btn-close-modal" onclick="document.getElementById('rgs-modal').remove()">✕</button>
                </div>
                <div class="modal-body">${bodyHTML}</div>
                ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    },

    closeModal() { const m = document.getElementById('rgs-modal'); if (m) m.remove(); },

    // ─── TICKET MODAL ──────────────────────────────────────────
    openTicketModal() {
        if (!this.isLoggedIn()) { window.location.href = '/login.html'; return; }
        this.showModal('🎫 Buat Tiket Bantuan',
            `<div class="space-y" style="display:flex;flex-direction:column;gap:16px">
                <div>
                    <label class="form-label">Subject / Topik Masalah</label>
                    <input id="ticket-subject" type="text" class="form-input" placeholder="Contoh: Pesanan #RGS240101 belum diterima">
                </div>
                <div>
                    <label class="form-label">Detail Masalah</label>
                    <textarea id="ticket-message" class="form-input" rows="5" placeholder="Deskripsikan masalah Anda secara lengkap..."></textarea>
                </div>
            </div>`,
            `<button onclick="store.closeModal()" class="btn-ghost">Batal</button>
             <button onclick="store.submitTicket()" class="btn-orange" style="padding:0.6rem 1.5rem">Kirim Tiket 🚀</button>`
        );
    },

    async submitTicket() {
        const subject = document.getElementById('ticket-subject')?.value?.trim();
        const message = document.getElementById('ticket-message')?.value?.trim();
        if (!subject || !message) { this.showToast('Subject dan pesan wajib diisi.', 'error'); return; }
        const res = await this.createTicket(subject, message);
        this.closeModal();
        if (res.success) {
            this.showToast(`✅ ${res.message}`, 'success');
        } else {
            this.showToast(res.message || 'Gagal membuat tiket.', 'error');
        }
    },

    // ─── AUTH GUARD ────────────────────────────────────────────
    requireLogin() {
        if (!this.isLoggedIn()) { window.location.href = '/login.html'; return false; }
        return true;
    },

    // ─── UTILS ────────────────────────────────────────────────
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('📋 Berhasil disalin ke clipboard!', 'success');
            return true;
        } catch (err) {
            console.error('Copy failed:', err);
            return false;
        }
    },

    requireAdmin() {
        const user = this.getUser();
        if (!this.isLoggedIn() || !user || user.role !== 'admin') {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    // Alias for backward compatibility with product.html
    async configureNavbar() {
        return this.updateNavbar();
    }
};

// ─── Global aliases for backward compatibility ────────────────
window.store = store;
window.appUtils = store; // Legacy pages use appUtils

// Auto-run on every page
document.addEventListener('DOMContentLoaded', () => {
    store.updateNavbar();
});
