/**
 * RGS STORE — Frontend Core Logic v3.1
 * Single object handles ALL API calls, auth state, and UI helpers.
 * Exposes both `store` AND `appUtils` (alias) for full compatibility.
 */

const API_BASE = '/api';

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
        
        const fetchOptions = { 
            ...options, 
            body: options.body,
            method: options.method || 'GET',
            credentials: 'include'
        };

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        // Final absolute protection for FormData: no Content-Type header allowed!
        fetchOptions.headers = headers;

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
            
            if (res.status === 401 || res.status === 403) {
                console.log('⚠️  Auth expired or denied. Redirecting to login...');
                this.removeAuth();
                const onPublic = ['/', '/index.html', '/login.html', '/register.html', '/tos.html', '/product.html'].some(p => window.location.pathname.includes(p));
                if (!onPublic) {
                    Swal.fire('Info', 'Sesi Anda berakhir. Silakan login kembali.', 'info');
                    window.location.href = '/login.html';
                }
                return { success: false, message: 'Unauthorized / Forbidden' };
            }

            const data = await res.json();
            return data;
        } catch (err) {
            console.error('📡 API Error:', { endpoint, err });
            return { success: false, message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.' };
        }
    },

    /**
     * Set button loading state
     * @param {string|HTMLButtonElement} btnId Element ID or handle
     * @param {boolean} isLoading 
     * @param {string} loadingText 
     */
    setLoading(btn, isLoading, loadingText = 'Loading...') {
        const el = typeof btn === 'string' ? document.getElementById(btn) : btn;
        if (!el) return;

        if (isLoading) {
            el.dataset.oldText = el.innerHTML;
            el.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;gap:8px">
                    <svg class="spinner-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle></svg>
                    <span>${loadingText}</span>
                </div>`;
            el.disabled = true;
            el.style.opacity = '0.7';
            el.style.cursor = 'not-allowed';
        } else {
            el.innerHTML = el.dataset.oldText || 'Submit';
            el.disabled = false;
            el.style.opacity = '1';
            el.style.cursor = 'pointer';
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

    async forgotPassword(email) {
        return this.apiCall('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    async resetPassword(token, new_password) {
        return this.apiCall('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password })
        });
    },

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
            body: formData
        });
    },

    async updateProduct(id, formData) {
        return this.apiCall(`/products/${id}`, { 
            method: 'PUT', 
            body: formData
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
        return this.apiCall('/admin/stats');
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

    async confirmOrder(formData) {
        return this.apiCall('/orders/confirm', {
            method: 'POST',
            body: formData
        });
    },

    async getOrderById(id) {
        const res = await this.apiCall(`/orders/${id}`);
        return res.success ? res.data : null;
    },

    async getWaitingOrders() {
        const res = await this.apiCall('/orders/admin/waiting');
        return res.success ? res.data : [];
    },

    // ─── PAYMENT METHODS ───────────────────────────────────────
    async getPaymentMethods() {
        const res = await this.apiCall('/payments');
        return res.success ? res.data : [];
    },

    async getAllPaymentMethods() {
        const res = await this.apiCall('/payments/all');
        return res.success ? res.data : [];
    },

    async createPaymentMethod(data) {
        const isFormData = data instanceof FormData;
        return this.apiCall('/payments', { 
            method: 'POST', 
            body: isFormData ? data : JSON.stringify(data) 
        });
    },

    async updatePaymentMethod(id, data) {
        const isFormData = data instanceof FormData;
        return this.apiCall(`/payments/${id}`, { 
            method: 'PUT', 
            body: isFormData ? data : JSON.stringify(data)
        });
    },

    async deletePaymentMethod(id) {
        return this.apiCall(`/payments/${id}`, { method: 'DELETE' });
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

    // ─── ADMIN FILE MANAGER ────────────────────────────────────
    async getAllAdminFiles() {
        const res = await this.apiCall('/admin/files');
        return res.success ? res.data : [];
    },

    async uploadAdminFile(formData) {
        return this.apiCall('/admin/files', {
            method: 'POST',
            body: formData
        });
    },

    async deleteAdminFile(filename) {
        return this.apiCall(`/admin/files/${filename}`, {
            method: 'DELETE'
        });
    },

    async openTicketModal() {
        if (!this.isLoggedIn()) {
            Swal.fire('Info', 'Silakan login untuk mengirim tiket bantuan.', 'info');
            setTimeout(() => window.location.href = '/login.html', 1500);
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: 'Kirim Tiket Bantuan',
            html: `
                <div style="text-align:left">
                    <label class="form-label" style="display:block;margin-bottom:5px;font-weight:600">Subjek Keluhan</label>
                    <input id="swal-subject" class="swal2-input" placeholder="Contoh: Masalah Akun Netflix" style="width:100%;margin:0 0 15px">
                    
                    <label class="form-label" style="display:block;margin-bottom:5px;font-weight:600">Pesan / Detail Masalah</label>
                    <textarea id="swal-message" class="swal2-textarea" placeholder="Tuliskan keluhan Anda di sini..." style="width:100%;margin:0;height:120px"></textarea>
                </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Kirim Tiket',
            confirmButtonColor: '#f97316',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const subject = document.getElementById('swal-subject').value;
                const message = document.getElementById('swal-message').value;
                if (!subject || !message) {
                    Swal.showValidationMessage('Harap isi subjek dan pesan!');
                    return null;
                }
                return { subject, message };
            }
        });

        if (formValues) {
            Swal.fire({ title: 'Mengirim...', didOpen: () => Swal.showLoading() });
            const res = await this.apiCall('/tickets', {
                method: 'POST',
                body: JSON.stringify(formValues)
            });
            Swal.close();

            if (res.success) {
                Swal.fire('Berhasil!', 'Tiket berhasil dikirim. CS kami akan membalas via Email/WhatsApp dalam 1x24 jam.', 'success');
            } else {
                Swal.fire('Gagal', res.message || 'Terjadi kesalahan saat mengirim tiket.', 'error');
            }
        }
    },

    // ─── CHAT MESSAGES ─────────────────────────────────────────
    async sendMessage(data, target_user_id = null) {
        // Support both legacy (string) and new (FormData)
        if (data instanceof FormData) {
            return this.apiCall('/chat', { method: 'POST', body: data });
        }
        return this.apiCall('/chat', {
            method: 'POST',
            body: JSON.stringify({ message: data, target_user_id })
        });
    },

    async getMyMessages() {
        const res = await this.apiCall('/chat');
        return res.success ? res.data : [];
    },

    async getChatUsers() {
        const res = await this.apiCall('/chat/users');
        return res.success ? res.data : [];
    },

    async getUserMessages(userId) {
        const res = await this.apiCall(`/chat/user/${userId}`);
        return res.success ? res.data : [];
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

    addToCart(product, variant = null, qty = 1) {
        const cart = this.getCart();
        const pQty = parseInt(qty) || 1;
        const pPrice = parseInt(product.final_price || product.price) || 0;
        
        // Match by ID AND Variant to differentiate items in cart
        const idx = cart.findIndex(i => i.id === product.id && i.variant === variant);
        
        if (idx >= 0) { 
            cart[idx].qty = parseInt(cart[idx].qty || 0) + pQty; 
        } else { 
            cart.push({ 
                id: product.id,
                name: product.name,
                price: pPrice,
                image_url: product.image_url,
                variant: variant,
                qty: pQty 
            }); 
        }
        
        this.saveCart(cart);
        this.updateCartBadge();
        this.showToast(`🛒 ${product.name} ${variant ? `(${variant})` : ''} ditambahkan!`, 'success');
    },

    getCartCount() { 
        return this.getCart().reduce((acc, item) => acc + (parseInt(item.qty) || 0), 0); 
    },

    updateCartBadge() {
        const badge = document.getElementById('cart-count');
        if (badge) {
            const count = this.getCartCount();
            badge.textContent = count > 0 ? count : '0';
        }
    },

    // ─── FORMATTING ────────────────────────────────────────────
    formatRupiah(num) {
        const val = parseInt(num) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
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
            pending:              '<span class="badge badge-pending">⏳ Pending</span>',
            waiting_confirmation: '<span class="badge badge-warning">🔍 Menunggu Verifikasi</span>',
            processing:           '<span class="badge badge-processing">🔄 Proses</span>',
            shipped:              '<span class="badge badge-shipped">📦 Dikirim</span>',
            success:              '<span class="badge badge-success">✅ Selesai</span>',
            failed:               '<span class="badge badge-failed">❌ Gagal</span>',
            cancelled:            '<span class="badge badge-cancelled">🚫 Batal</span>',
            open:                 '<span class="badge badge-open">📭 Open</span>',
            replied:              '<span class="badge badge-replied">💬 Dibalas</span>',
            closed:               '<span class="badge badge-closed">🔒 Closed</span>',
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

    // ─── NAVBAR (Auth Flow V20) ───────────────────────────────
    async updateNavbar() {
        const navAuth = document.getElementById('nav-auth-container');
        if (!navAuth) return;

        // Default UI: Tampilkan tombol Masuk/Daftar (Tanpa Skeleton Loader)
        navAuth.innerHTML = `
            <a href="/login.html" class="btn-nav-login">Masuk</a>
            <a href="/register.html" class="btn-nav-register">Daftar</a>`;
        
        // Pengecekan Fetch API
        if (this.getToken()) {
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${this.getToken()}` },
                    credentials: 'include'
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        const user = data.data;
                        this.setUser(user); // Sinkronisasi manual localStorage
                        navAuth.innerHTML = `
                            <div class="user-nav-group">
                                <a href="${user.role === 'admin' ? '/admin.html' : '/dashboard.html'}" class="user-nav-link">
                                    <div class="avatar-xs" style="overflow:hidden">
                                        ${user.avatar_url || user.avatar ? `<img src="${user.avatar_url || user.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover">` : user.name[0].toUpperCase()}
                                    </div>
                                    <span>${user.name.split(' ')[0]}</span>
                                </a>
                                <button onclick="store.logout()" class="btn-logout-sm">Logout</button>
                            </div>`;
                    }
                }
            } catch (err) {
                console.error('Navbar Auth Fetch Err:', err);
                // Jika error DB / Network, biarkan tombol form masuk tetap ADA
            }
        }
        this.updateCartBadge();
    },

    // ─── TOAST ────────────────────────────────────────────────
    showToast(msg, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:10px; align-items:flex-end; pointer-events:none;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#3b82f6')};
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(120%);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
            max-width: 300px;
        `;

        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${msg}</span>`;
        
        container.appendChild(toast);
        
        // Trigger entrance animation
        setTimeout(() => toast.style.transform = 'translateX(0)', 10);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
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

// Alias for backward compatibility with product.html
store.configureNavbar = function() {
    return this.updateNavbar();
};

// saveToken alias (used by Google OAuth redirect handler)
store.saveToken = function(token) { this.setToken(token); };

// Auto-run on every page
document.addEventListener('DOMContentLoaded', () => {
    store.updateNavbar();

    // ─── GOOGLE TOKEN HANDLER (Universal) ─────────────────────
    // After Google OAuth, server redirects to /login.html?google_token=TOKEN&role=ROLE
    // This block catches it on ANY page that loads app.js, saves the token,
    // fetches the user profile, cleans the URL, then navigates correctly.
    const _urlParams = new URLSearchParams(window.location.search);
    const _googleToken = _urlParams.get('google_token');
    const _googleRole  = _urlParams.get('role');

    if (_googleToken) {
        store.setToken(_googleToken);

        // Fetch real user data from DB and persist to localStorage
        store.apiCall('/auth/me').then(res => {
            if (res.success && res.data) {
                store.setUser(res.data);
            } else {
                // Fallback: build minimal user from role so navbar renders
                store.setUser({ name: 'User', role: _googleRole || 'user' });
            }
            store.updateNavbar();
            store.showToast('✅ Login Google berhasil! Selamat datang 🎉', 'success');

            // Remove ?google_token=... from the address bar WITHOUT reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Navigate to correct dashboard
            setTimeout(() => {
                window.location.href = (_googleRole === 'admin') ? '/admin.html' : '/index.html';
            }, 900);
        }).catch(() => {
            // Network error — still save and navigate
            store.showToast('✅ Login berhasil!', 'success');
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            setTimeout(() => {
                window.location.href = (_googleRole === 'admin') ? '/admin.html' : '/index.html';
            }, 900);
        });
    }

    }

    // --- 5. FAKE NOTIFICATION SCRIPT (DOM) ---
    function initFakeSales() {
        // Build Container
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);

        const names = ['Budi', 'Andi', 'Siti', 'Reza', 'Evan', 'Cahya', 'Naufal', 'Ilham'];
        const products = ['Panel Pterodactyl', 'Discord Nitro', 'Netflix Premium 4K', 'Spotify Premium', 'YouTube Premium'];

        setInterval(() => {
            const rName = names[Math.floor(Math.random() * names.length)];
            const rProd = products[Math.floor(Math.random() * products.length)];
            
            const toast = document.createElement('div');
            // Glassmorphism styling with explicit animation states inline or relying on CSS transitions
            toast.style.cssText = `
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.4);
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                padding: 12px 18px;
                border-radius: 12px;
                color: #111;
                font-family: 'Poppins', sans-serif;
                font-size: 13px;
                font-weight: 500;
                transform: translateX(-150%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            `;
            toast.innerHTML = `🎉 <b>${rName}</b> baru saja membeli <span style="color:#ff7a00; font-weight:700;">${rProd}</span>`;
            
            container.appendChild(toast);

            // Pop in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    toast.style.transform = 'translateX(0)';
                    toast.style.opacity = '1';
                });
            });

            // Fade out after 4 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => toast.remove(), 400); // Wait for transition
            }, 4000);

        }, 45000); // Every 45 seconds
    }
    
    // Start script
    initFakeSales();
});

