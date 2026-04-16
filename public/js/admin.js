/**
 * RGS STORE — Admin Dashboard V9 (TOTAL REBUILD)
 * Zero-bug, anti-spam, stats synced, file-picker integrated.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
const AdminState = {
    products:      [],
    orders:        [],
    waitingOrders: [],
    payments:      [],
    tickets:       [],
    files:         [],
    chatUsers:     [],
    stats:         {},
    currentChatUserId: null,
    selectedFileUrl: null,
    selectedFileName: null,
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const fmt = {
    rupiah(n) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseInt(n) || 0);
    },
    date(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    dateShort(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    },
    size(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    },
    statusBadge(status) {
        const map = {
            pending:               '<span class="badge badge-pending">⏳ Pending</span>',
            waiting_confirmation:  '<span class="badge badge-waiting">🔍 Menunggu Verif.</span>',
            processing:            '<span class="badge badge-processing">🔄 Proses</span>',
            success:               '<span class="badge badge-success">✅ Selesai</span>',
            failed:                '<span class="badge badge-failed">❌ Gagal</span>',
            cancelled:             '<span class="badge badge-cancelled">🚫 Batal</span>',
            open:                  '<span class="badge badge-pending">📭 Open</span>',
            closed:                '<span class="badge badge-cancelled">🔒 Closed</span>',
        };
        return map[status] || `<span class="badge">${status}</span>`;
    }
};

function el(id) { return document.getElementById(id); }

function setHTML(id, html) {
    const elem = el(id);
    if (elem) elem.innerHTML = html; // MANDATORY CLEAR + SET
}

function showToast(msg, type = 'success') {
    try { appUtils.showToast(msg, type); } catch(e) { console.log(msg); }
}

function confirmDialog(title, text) {
    return Swal.fire({
        title, text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff9d00',
        cancelButtonColor: '#1a2235',
        confirmButtonText: 'Ya, Lanjutkan!',
        background: '#0a0e17',
        color: '#e2e8f0'
    });
}

// ─────────────────────────────────────────────────────────────────
// RENDERERS (each one ALWAYS clears innerHTML first)
// ─────────────────────────────────────────────────────────────────
const Render = {
    stats() {
        const s = AdminState.stats;
        setHTML('stat-revenue',  fmt.rupiah(s.total_revenue || 0));
        setHTML('stat-orders',   s.total_orders  || '0');
        setHTML('stat-pending',  s.pending_orders || '0');
        setHTML('stat-products', AdminState.products.length);
    },

    dashboardRecentOrders() {
        const tbody = el('dash-recent-orders');
        if (!tbody) return;
        tbody.innerHTML = ''; // CLEAR
        const recent = AdminState.orders.slice(0, 6);
        if (!recent.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fa-solid fa-inbox"></i><br>Belum ada pesanan</td></tr>';
            return;
        }
        recent.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="color:#fff; font-weight:700; font-size:0.8rem;">#${o.order_number}</span><br><span style="color:#475569; font-size:0.7rem;">${fmt.dateShort(o.created_at)}</span></td>
                <td style="color:#94a3b8; font-size:0.78rem;">${o.user_name || '—'}</td>
                <td style="color:var(--neon-orange); font-weight:700; font-size:0.82rem;">${fmt.rupiah(o.total_price)}</td>
                <td>${fmt.statusBadge(o.status)}</td>`;
            tbody.appendChild(tr);
        });
    },

    dashboardWaiting() {
        const tbody = el('dash-waiting-orders');
        if (!tbody) return;
        tbody.innerHTML = ''; // CLEAR
        if (!AdminState.waitingOrders.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fa-solid fa-check-circle"></i><br>Tidak ada yg menunggu</td></tr>';
            return;
        }
        AdminState.waitingOrders.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="color:#fff; font-weight:700; font-size:0.8rem;">#${o.order_number}</span></td>
                <td style="color:#94a3b8; font-size:0.78rem;">${o.user_name || '—'}</td>
                <td style="text-align:right;"><button class="btn-sm-primary" onclick="AdminV9.openDeliveryModal('${o.id}')">Proses</button></td>`;
            tbody.appendChild(tr);
        });
    },

    products() {
        const tbody = el('table-products');
        if (!tbody) return;
        tbody.innerHTML = ''; // CRITICAL CLEAR — ANTI SPAM
        if (!AdminState.products.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-boxes-stacked"></i><br>Belum ada produk</td></tr>';
            return;
        }
        AdminState.products.forEach((p, idx) => {
            const diskont = parseFloat(p.discount) || 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:#475569; font-size:0.75rem; font-weight:700;">${idx + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${p.image_url || 'https://via.placeholder.com/40'}" style="width:38px; height:38px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.08);">
                        <div>
                            <div style="font-weight:700; color:#fff; font-size:0.85rem;">${p.name}</div>
                            <span style="font-size:0.65rem; background:rgba(255,157,0,0.1); color:var(--neon-orange); padding:2px 8px; border-radius:99px;">${p.category}</span>
                        </div>
                    </div>
                </td>
                <td style="font-weight:800; color:var(--neon-cyan);">${fmt.rupiah(p.final_price)}</td>
                <td style="color:${diskont > 0 ? 'var(--neon-orange)' : '#475569'}; font-weight:700;">${diskont > 0 ? diskont + '%' : '—'}</td>
                <td style="font-weight:700; color:${p.stock < 5 ? 'var(--neon-red)' : '#e2e8f0'};">${p.stock}</td>
                <td>${p.is_active != 0 ? '<span class="badge badge-active">● Aktif</span>' : '<span class="badge badge-inactive">● Nonaktif</span>'}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-sm-edit" onclick="AdminV9.editProduct('${p.id}')">Edit</button>
                    <button class="btn-danger" onclick="AdminV9.deleteProduct('${p.id}', '${p.name.replace(/'/g,"\\'")}')">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
    },

    orders() {
        const tbody = el('table-orders');
        if (!tbody) return;
        tbody.innerHTML = ''; // CRITICAL CLEAR — ANTI SPAM
        if (!AdminState.orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-receipt"></i><br>Belum ada pesanan</td></tr>';
            return;
        }
        AdminState.orders.forEach(o => {
            const tr = document.createElement('tr');
            const credHTML = o.credentials
                ? `<span style="display:inline-block; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:rgba(0,255,136,0.08); color:var(--neon-green); padding:3px 8px; border-radius:6px; font-size:0.72rem;" title="${o.credentials}">✓ ${o.credentials}</span>`
                : `<button class="btn-sm-primary" onclick="AdminV9.openDeliveryModal('${o.id}')">Kirim Produk</button>`;
            tr.innerHTML = `
                <td>
                    <div style="font-weight:800; color:#fff;">#${o.order_number}</div>
                    <div style="font-size:0.7rem; color:#475569;">${fmt.dateShort(o.created_at)}</div>
                </td>
                <td>
                    <div style="font-weight:600; font-size:0.82rem;">${o.user_name || '—'}</div>
                    <div style="font-size:0.7rem; color:#475569;">${o.user_email || ''}</div>
                </td>
                <td style="font-size:0.82rem;">${o.product_name || '—'} <span style="color:#475569;">×${o.qty}</span></td>
                <td style="font-weight:800; color:var(--neon-orange);">${fmt.rupiah(o.total_price)}</td>
                <td style="font-size:0.75rem; color:#64748b;">${o.payment_method || '—'}</td>
                <td>${credHTML}</td>
                <td>
                    <select style="background:var(--bg-card); border:1px solid rgba(255,255,255,0.08); border-radius:7px; color:#e2e8f0; padding:4px 8px; font-size:0.75rem; outline:none; cursor:pointer;"
                        onchange="AdminV9.updateStatus('${o.id}', this.value)">
                        <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
                        <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
                        <option value="success" ${o.status==='success'?'selected':''}>Selesai</option>
                        <option value="failed" ${o.status==='failed'?'selected':''}>Gagal</option>
                        <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Batal</option>
                    </select>
                </td>`;
            tbody.appendChild(tr);
        });
    },

    verification() {
        const tbody = el('table-verification');
        if (!tbody) return;
        tbody.innerHTML = ''; // CRITICAL CLEAR — ANTI SPAM
        // Update badge
        const badge = el('badge-verification');
        if (badge) badge.textContent = AdminState.waitingOrders.length;

        if (!AdminState.waitingOrders.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-check-circle"></i><br>Semua pembayaran sudah diverifikasi</td></tr>';
            return;
        }
        AdminState.waitingOrders.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:800; color:#fff;">#${o.order_number}</div>
                    <div style="font-size:0.7rem; color:#475569;">${fmt.dateShort(o.created_at)}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${o.user_name || '—'}</div>
                    <div style="font-size:0.7rem; color:#475569;">${o.user_email || ''}</div>
                </td>
                <td style="font-weight:800; color:var(--neon-orange);">${fmt.rupiah(o.total_price)}</td>
                <td>
                    ${o.payment_proof
                        ? `<a href="${o.payment_proof}" target="_blank" style="display:inline-block;">
                              <img src="${o.payment_proof}" style="height:48px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); cursor:pointer;" title="Klik untuk memperbesar">
                           </a>`
                        : '<span style="color:#475569; font-size:0.75rem;">Tidak ada</span>'}
                </td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-sm-primary" onclick="AdminV9.confirmPayment('${o.id}')">Konfirmasi</button>
                    <button class="btn-neon-orange" onclick="AdminV9.openDeliveryModal('${o.id}')" style="font-size:0.7rem; padding:0.35rem 0.8rem;">Kirim + Selesai</button>
                </td>`;
            tbody.appendChild(tr);
        });
    },

    payments() {
        const tbody = el('table-payments');
        if (!tbody) return;
        tbody.innerHTML = ''; // CRITICAL CLEAR — ANTI SPAM
        if (!AdminState.payments.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-credit-card"></i><br>Belum ada metode pembayaran</td></tr>';
            return;
        }
        AdminState.payments.forEach(p => {
            // Map is_active 1/0 to human-readable badge (CRITICAL FIX)
            const isActive = p.is_active === 1 || p.is_active === true || p.is_active === '1';
            const statusBadge = isActive
                ? '<span class="badge badge-active">● AKTIF</span>'
                : '<span class="badge badge-inactive">● NONAKTIF</span>';
            const qrisHtml = p.qris_image_url
                ? `<img src="${p.qris_image_url}" style="height:36px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);" title="${p.qris_image_url}">`
                : '<span style="color:#475569; font-size:0.75rem;">—</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:700; color:#fff;">${p.name}</td>
                <td><span style="font-size:0.7rem; background:rgba(0,243,255,0.08); color:var(--neon-cyan); padding:2px 8px; border-radius:99px; text-transform:uppercase;">${p.type}</span></td>
                <td style="font-family:monospace; font-size:0.8rem; color:#94a3b8;">${p.account_number || '—'}</td>
                <td style="font-size:0.82rem;">${p.account_name || '—'}</td>
                <td>${qrisHtml}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-sm-edit" onclick="AdminV9.editPayment(${p.id})">Edit</button>
                    <button class="btn-danger" onclick="AdminV9.deletePayment(${p.id})">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
    },

    tickets() {
        const tbody = el('table-tickets');
        if (!tbody) return;
        tbody.innerHTML = ''; // CRITICAL CLEAR — ANTI SPAM
        if (!AdminState.tickets.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-headset"></i><br>Tidak ada tiket support</td></tr>';
            return;
        }
        AdminState.tickets.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family:monospace; font-weight:700; color:var(--neon-orange); font-size:0.78rem;">#${t.ticket_number || t.id}</td>
                <td>
                    <div style="font-weight:600; font-size:0.82rem;">${t.user_name || t.name || '—'}</div>
                    <div style="font-size:0.7rem; color:#475569;">${t.user_email || t.email || ''}</div>
                </td>
                <td>
                    <div style="font-weight:700; font-size:0.82rem; color:#e2e8f0;">${t.subject || '—'}</div>
                    <div style="font-size:0.72rem; color:#64748b; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.message || ''}</div>
                    ${t.admin_reply ? `<div style="margin-top:4px; font-size:0.7rem; color:var(--neon-cyan); padding:4px 8px; border-left:2px solid var(--neon-cyan); background:rgba(0,243,255,0.05);">↳ ${t.admin_reply}</div>` : ''}
                </td>
                <td>${fmt.statusBadge(t.status)}</td>
                <td style="font-size:0.75rem; color:#64748b;">${fmt.dateShort(t.created_at)}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-sm-primary" onclick="AdminV9.replyTicket('${t.id}', '${(t.subject || '').replace(/'/g,"\\'")}')">Balas</button>
                    <button class="btn-ghost" style="font-size:0.7rem; padding:0.3rem 0.6rem;" onclick="AdminV9.closeTicket('${t.id}')">Tutup</button>
                </td>`;
            tbody.appendChild(tr);
        });
    },

    chatUsers() {
        const list = el('chat-user-list');
        if (!list) return;
        list.innerHTML = ''; // CLEAR
        if (!AdminState.chatUsers.length) {
            list.innerHTML = '<div style="padding:1rem; text-align:center; color:#475569; font-size:0.78rem;">Belum ada chat</div>';
            return;
        }
        AdminState.chatUsers.forEach(u => {
            const isActive = AdminState.currentChatUserId === u.user_id;
            const div = document.createElement('div');
            div.className = 'chat-user-item' + (isActive ? ' active' : '');
            div.onclick = () => AdminV9.selectChat(u.user_id, u.name || u.email);
            div.innerHTML = `
                <div style="font-weight:700; font-size:0.83rem; color:${isActive ? 'var(--neon-orange)':'#e2e8f0'};">${u.name || u.email}</div>
                <div style="font-size:0.72rem; color:#475569; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${u.last_message || 'Tidak ada pesan'}</div>`;
            list.appendChild(div);
        });
    },

    messages(msgs) {
        const box = el('chat-messages');
        if (!box) return;
        box.innerHTML = ''; // CLEAR
        if (!msgs.length) {
            box.innerHTML = '<div style="text-align:center; color:#475569; margin:auto; font-size:0.8rem;">Belum ada pesan</div>';
            return;
        }
        msgs.forEach(m => {
            const isAdmin = m.is_admin === 1 || m.is_admin === true;
            const div = document.createElement('div');
            div.className = 'chat-msg ' + (isAdmin ? 'admin' : 'user');
            const fileHTML = m.file_url
                ? (m.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? `<a href="${m.file_url}" target="_blank"><img src="${m.file_url}" style="max-width:160px; border-radius:8px; margin-top:6px;"></a>`
                    : `<a href="${m.file_url}" target="_blank" style="font-size:0.75rem; color:var(--neon-cyan);">📎 Attachment</a>`)
                : '';
            div.innerHTML = `<div class="chat-msg-bubble">${m.message ? `<p>${m.message}</p>` : ''}${fileHTML}<div style="font-size:0.65rem; opacity:0.5; text-align:right; margin-top:4px;">${fmt.dateShort(m.created_at)}</div></div>`;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    },

    files() {
        const tbody = el('table-files');
        if (!tbody) return;
        tbody.innerHTML = ''; // CRITICAL CLEAR — ANTI SPAM
        if (!AdminState.files.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fa-solid fa-folder-open"></i><br>File Manager kosong</td></tr>';
            return;
        }
        AdminState.files.forEach(f => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${isImage ? `<img src="${f.url}" style="width:36px; height:36px; object-fit:cover; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">` : '<i class="fa-solid fa-file" style="font-size:1.5rem; color:#475569; width:36px; text-align:center;"></i>'}
                        <a href="${f.url}" target="_blank" style="color:var(--neon-cyan); font-weight:600; font-size:0.83rem; text-decoration:none;">${f.name}</a>
                    </div>
                </td>
                <td style="color:#64748b; font-size:0.78rem; font-family:monospace;">${fmt.size(f.size)}</td>
                <td style="color:#64748b; font-size:0.78rem;">${fmt.dateShort(f.created_at)}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-sm-edit" onclick="navigator.clipboard.writeText(window.location.origin+'${f.url}').then(()=>showToast('Link disalin!'))">Copy Link</button>
                    <button class="btn-danger" onclick="AdminV9.deleteFile('${f.name}')">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// MAIN API ACTIONS
// ─────────────────────────────────────────────────────────────────
const AdminV9 = {
    async loadAll() {
        try {
            // Show skeleton
            ['stat-revenue','stat-orders','stat-pending','stat-products'].forEach(id => {
                const e = el(id);
                if (e) e.innerHTML = '<span class="skeleton" style="display:inline-block;width:60px;height:28px;"></span>';
            });

            const [products, orders, stats, payments, tickets, waiting, files] = await Promise.all([
                appUtils.getAllProductsAdmin(),
                appUtils.getAllOrders(),
                appUtils.getOrderStats(),
                appUtils.getAllPaymentMethods(),
                appUtils.getAllTickets(),
                appUtils.getWaitingOrders(),
                appUtils.getAllAdminFiles(),
            ]);

            AdminState.products      = Array.isArray(products) ? products : [];
            AdminState.orders        = Array.isArray(orders)   ? orders   : [];
            AdminState.payments      = Array.isArray(payments) ? payments : [];
            AdminState.tickets       = Array.isArray(tickets)  ? tickets  : [];
            AdminState.waitingOrders = Array.isArray(waiting)  ? waiting  : [];
            AdminState.files         = Array.isArray(files)    ? files    : [];

            // Stats can be nested in .data
            const statsData = stats?.data || stats || {};
            AdminState.stats = statsData;

            // Update order badge
            const ordBadge = el('badge-orders');
            if (ordBadge) ordBadge.textContent = AdminState.orders.length;

            // Render all
            Render.stats();
            Render.dashboardRecentOrders();
            Render.dashboardWaiting();
            Render.products();
            Render.orders();
            Render.verification();
            Render.payments();
            Render.tickets();
            Render.files();

        } catch (err) {
            console.error('AdminV9.loadAll error:', err);
            showToast('Gagal memuat data admin!', 'error');
        }
    },

    async loadChat() {
        try {
            const users = await appUtils.getChatUsers();
            AdminState.chatUsers = users || [];
            Render.chatUsers();
        } catch(e) { console.error('loadChat error:', e); }
    },

    async selectChat(userId, name) {
        AdminState.currentChatUserId = userId;
        el('chat-active-name').textContent = name || userId;
        Render.chatUsers();
        try {
            const msgs = await appUtils.getUserMessages(userId);
            Render.messages(Array.isArray(msgs) ? msgs : []);
        } catch(e) {}
    },

    async sendChat() {
        const inp = el('chat-input');
        const msg = (inp?.value || '').trim();
        if (!msg || !AdminState.currentChatUserId) return;

        const fd = new FormData();
        fd.append('message', msg);
        fd.append('target_user_id', AdminState.currentChatUserId);
        // NO manual Content-Type header — browser sets multipart boundary automatically!

        await appUtils.sendMessage(fd);
        inp.value = '';
        await this.selectChat(AdminState.currentChatUserId, el('chat-active-name').textContent);
    },

    // ── Products ────────────────────────────────────────────────
    openProductModal(p = null) {
        const form = el('form-product');
        form.reset();
        el('fp-id').value = '';
        el('fp-current-img').style.display = 'none';

        if (p) {
            el('modal-product-title').textContent = `Edit Produk #${p.id}`;
            el('fp-id').value = p.id;
            el('fp-name').value = p.name || '';
            el('fp-category').value = p.category || 'Streaming';
            el('fp-price').value = p.price || '';
            el('fp-discount').value = p.discount || '0';
            el('fp-stock').value = p.stock || '';
            el('fp-desc').value = p.description || '';
            try { el('fp-variants').value = JSON.parse(p.variants || '[]').join(', '); } catch { el('fp-variants').value = p.variants || ''; }
            if (p.image_url) {
                el('fp-img-preview').src = p.image_url;
                el('fp-current-img').style.display = 'block';
            }
        } else {
            el('modal-product-title').textContent = 'Tambah Produk Baru';
        }
        this.openModal('modal-product');
    },

    editProduct(id) {
        const p = AdminState.products.find(x => String(x.id) === String(id));
        if (p) this.openProductModal(p);
    },

    async saveProduct(e) {
        e.preventDefault();
        const btn = el('btn-save-product');
        btn.textContent = 'Menyimpan...';
        btn.disabled = true;

        const id = el('fp-id').value;
        const formData = new FormData(el('form-product'));
        const variantStr = el('fp-variants').value;
        const varArr = variantStr.split(',').map(v => v.trim()).filter(v => v);
        formData.set('variants', JSON.stringify(varArr));
        // CRITICAL: Do NOT set Content-Type manually — let browser set multipart boundary

        try {
            const res = id
                ? await appUtils.updateProduct(id, formData)
                : await appUtils.createProduct(formData);
            if (res?.success) {
                showToast(id ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!', 'success');
                this.closeModal('modal-product');
                await this.loadAll();
            } else {
                showToast(res?.message || 'Gagal menyimpan produk.', 'error');
            }
        } catch(err) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            btn.textContent = 'Simpan Produk';
            btn.disabled = false;
        }
    },

    async deleteProduct(id, name) {
        const res = await confirmDialog('Hapus Produk?', `"${name}" akan dihapus permanen.`);
        if (!res.isConfirmed) return;
        const r = await appUtils.deleteProduct(id);
        if (r?.success) {
            showToast('Produk dihapus!', 'success');
            await this.loadAll();
        } else showToast(r?.message || 'Gagal menghapus.', 'error');
    },

    // ── Payments ────────────────────────────────────────────────
    openPaymentModal(p = null) {
        const form = el('form-payment');
        form.reset();
        el('pay-id').value = '';
        el('pay-qris-url').value = '';
        el('pay-qris-selected').textContent = 'Belum dipilih';
        el('pay-qris-preview').style.display = 'none';
        el('pay-active').checked = true;

        if (p) {
            el('modal-payment-title').textContent = 'Edit Metode Pembayaran';
            el('pay-id').value = p.id;
            el('pay-name').value = p.name || '';
            el('pay-type').value = p.type || 'ewallet';
            el('pay-number').value = p.account_number || '';
            el('pay-account-name').value = p.account_name || '';
            el('pay-active').checked = (p.is_active === 1 || p.is_active === true || p.is_active === '1');
            if (p.qris_image_url) {
                el('pay-qris-url').value = p.qris_image_url;
                el('pay-qris-selected').textContent = p.qris_image_url.split('/').pop();
                el('pay-qris-img').src = p.qris_image_url;
                el('pay-qris-preview').style.display = 'block';
            }
        } else {
            el('modal-payment-title').textContent = 'Tambah Metode Pembayaran';
        }
        this.openModal('modal-payment');
    },

    editPayment(id) {
        const p = AdminState.payments.find(x => String(x.id) === String(id));
        if (p) this.openPaymentModal(p);
    },

    async savePayment(e) {
        e.preventDefault();
        const btn = el('btn-save-payment');
        btn.textContent = 'Menyimpan...';
        btn.disabled = true;

        const id = el('pay-id').value;
        const qrisUrl = el('pay-qris-url').value;

        // Build FormData for consistent API interface
        const formData = new FormData();
        formData.append('name', el('pay-name').value);
        formData.append('type', el('pay-type').value);
        formData.append('account_number', el('pay-number').value);
        formData.append('account_name', el('pay-account-name').value);
        formData.append('is_active', el('pay-active').checked ? '1' : '0');
        // Pass qris_image_url as a text field — no file re-upload if already selected from file picker
        if (qrisUrl) formData.append('qris_image_url', qrisUrl);

        try {
            const res = id
                ? await appUtils.updatePaymentMethod(id, formData)
                : await appUtils.createPaymentMethod(formData);
            if (res?.success) {
                showToast(id ? 'Metode diperbarui!' : 'Metode ditambahkan!', 'success');
                this.closeModal('modal-payment');
                await this.loadAll();
            } else {
                showToast(res?.message || 'Gagal menyimpan.', 'error');
            }
        } catch(err) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            btn.textContent = 'Simpan';
            btn.disabled = false;
        }
    },

    async deletePayment(id) {
        const res = await confirmDialog('Hapus Metode?', 'Metode pembayaran ini akan dihapus permanen.');
        if (!res.isConfirmed) return;
        const r = await appUtils.deletePaymentMethod(id);
        if (r?.success) {
            showToast('Metode dihapus!', 'success');
            await this.loadAll();
        } else showToast(r?.message || 'Gagal menghapus.', 'error');
    },

    // ── File Picker (Sultan) ────────────────────────────────────
    async openFilePicker() {
        AdminState.selectedFileUrl = null;
        AdminState.selectedFileName = null;

        // Load latest files
        try {
            const files = await appUtils.getAllAdminFiles();
            AdminState.files = Array.isArray(files) ? files : [];
        } catch(e) {}

        const grid = el('file-picker-grid');
        grid.innerHTML = '';

        const imageFiles = AdminState.files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
        if (!imageFiles.length) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#475569; padding:2rem;">Belum ada gambar di File Manager.<br><small>Upload gambar dulu di tab File Manager.</small></div>';
        } else {
            imageFiles.forEach(f => {
                const div = document.createElement('div');
                div.className = 'file-thumb';
                div.dataset.url = f.url;
                div.dataset.name = f.name;
                div.innerHTML = `<img src="${f.url}" alt="${f.name}"><div class="file-thumb-name">${f.name}</div>`;
                div.onclick = () => {
                    document.querySelectorAll('.file-thumb').forEach(t => t.classList.remove('selected'));
                    div.classList.add('selected');
                    AdminState.selectedFileUrl = f.url;
                    AdminState.selectedFileName = f.name;
                };
                grid.appendChild(div);
            });
        }

        this.closeModal('modal-payment');
        setTimeout(() => this.openModal('modal-file-picker'), 50);
    },

    confirmFilePick() {
        if (!AdminState.selectedFileUrl) {
            showToast('Pilih salah satu gambar terlebih dahulu!', 'error');
            return;
        }
        el('pay-qris-url').value = AdminState.selectedFileUrl;
        el('pay-qris-selected').textContent = AdminState.selectedFileName || AdminState.selectedFileUrl;
        el('pay-qris-img').src = AdminState.selectedFileUrl;
        el('pay-qris-preview').style.display = 'block';
        this.closeModal('modal-file-picker');
        setTimeout(() => this.openModal('modal-payment'), 50);
    },

    // ── Orders ──────────────────────────────────────────────────
    async updateStatus(orderId, status) {
        const r = await appUtils.updateOrderStatus(orderId, status);
        if (r?.success) {
            showToast(`Status diperbarui: ${status}`, 'success');
            await this.loadAll();
        } else showToast(r?.message || 'Gagal update status.', 'error');
    },

    async confirmPayment(orderId) {
        const res = await confirmDialog('Konfirmasi Pembayaran?', 'Pesanan akan diubah ke status PROCESSING.');
        if (!res.isConfirmed) return;
        await appUtils.updateOrderStatus(orderId, 'processing');
        showToast('Pembayaran dikonfirmasi!', 'success');
        await this.loadAll();
    },

    async openDeliveryModal(orderId) {
        const { value: creds } = await Swal.fire({
            title: '🚀 Kirim Produk',
            input: 'textarea',
            inputLabel: 'Kredensial / Link yang dikirim ke pembeli:',
            inputPlaceholder: 'Email: xxx@gmail.com\nPassword: Secret123\nAtau link akun...',
            showCancelButton: true,
            confirmButtonColor: '#ff9d00',
            confirmButtonText: 'Kirim & Selesaikan',
            background: '#0a0e17',
            color: '#e2e8f0',
        });
        if (!creds) return;
        Swal.fire({ title: 'Memproses...', didOpen: () => Swal.showLoading(), background: '#0a0e17', color: '#e2e8f0' });
        const r = await appUtils.deliverOrder(orderId, creds);
        Swal.close();
        if (r?.success) {
            showToast('✅ Produk terkirim! Email notifikasi dikirim ke pembeli.', 'success');
            await this.loadAll();
        } else Swal.fire({ title: 'Gagal', text: r?.message || 'Error pengiriman', icon: 'error', background: '#0a0e17', color: '#e2e8f0' });
    },

    // ── Tickets ─────────────────────────────────────────────────
    async replyTicket(id, subject) {
        const { value: reply } = await Swal.fire({
            title: `Balas Tiket`,
            text: `Membalas: ${subject}`,
            input: 'textarea',
            inputPlaceholder: 'Tulis balasan Anda...',
            showCancelButton: true,
            confirmButtonColor: '#ff9d00',
            background: '#0a0e17',
            color: '#e2e8f0',
        });
        if (!reply) return;
        const r = await appUtils.replyTicket(id, reply);
        if (r?.success) { showToast('Balasan terkirim!', 'success'); await this.loadAll(); }
        else showToast(r?.message || 'Gagal membalas.', 'error');
    },

    async closeTicket(id) {
        const res = await confirmDialog('Tutup Tiket?', 'Tiket akan ditandai CLOSED.');
        if (!res.isConfirmed) return;
        await appUtils.updateTicketStatus(id, 'closed');
        showToast('Tiket ditutup.', 'success');
        await this.loadAll();
    },

    // ── Files ───────────────────────────────────────────────────
    async uploadFile(input) {
        const file = input.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('admin_file', file);
        // NO Content-Type header — browser sets boundary automatically!

        Swal.fire({ title: 'Mengupload...', didOpen: () => Swal.showLoading(), background: '#0a0e17', color: '#e2e8f0' });
        const r = await appUtils.uploadAdminFile(fd);
        Swal.close();
        input.value = '';
        if (r?.success) {
            showToast('✅ File berhasil diupload!', 'success');
            await this.loadAll();
        } else Swal.fire({ title: 'Gagal', text: r?.message, icon: 'error', background: '#0a0e17', color: '#e2e8f0' });
    },

    async deleteFile(filename) {
        const res = await confirmDialog('Hapus File?', `"${filename}" akan dihapus permanen.`);
        if (!res.isConfirmed) return;
        const r = await appUtils.deleteAdminFile(filename);
        if (r?.success) { showToast('File dihapus!', 'success'); await this.loadAll(); }
        else showToast(r?.message || 'Gagal menghapus.', 'error');
    },

    // ── Modal Helpers ───────────────────────────────────────────
    openModal(id) {
        const m = el(id);
        if (m) { m.classList.add('open'); }
    },
    closeModal(id) {
        const m = el(id);
        if (m) { m.classList.remove('open'); }
    },
};

// Export to global
window.AdminV9 = AdminV9;

// ─────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────────
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    // Show target
    const target = el('tab-' + tabId);
    if (target) target.classList.add('active');

    // Update sidebar nav active state
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) btn.classList.add('active');
    });

    // Update topbar title
    const titles = {
        dashboard: 'Dashboard', products: 'Manajemen Produk', orders: 'Semua Pesanan',
        verification: 'Verifikasi Pembayaran', payments: 'Metode Pembayaran',
        tickets: 'Tiket Support', chat: 'Live Chat', files: 'File Manager'
    };
    const titleEl = el('current-tab-title');
    if (titleEl) titleEl.textContent = titles[tabId] || tabId;

    // Load chat on tab switch
    if (tabId === 'chat') AdminV9.loadChat();
}

// ─────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Require admin
    if (!appUtils.requireAdmin()) return;

    // Show admin name
    const user = appUtils.getUser && appUtils.getUser();
    if (user) {
        const chip = el('admin-user-chip');
        const avatar = el('admin-avatar');
        if (chip) chip.textContent = user.name || user.email;
        if (avatar) avatar.textContent = (user.name || user.email || 'A')[0].toUpperCase();
    }

    // Load all data
    AdminV9.loadAll();

    // Sidebar tab buttons
    document.querySelectorAll('#sidebar-nav .nav-item[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
            // Auto-close sidebar on mobile
            if (window.innerWidth < 768) closeSidebar();
        });
    });

    // Logout
    const logoutBtn = el('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', () => appUtils.logout());

    // Open Product Modal
    const btnProduct = el('btn-open-product-modal');
    if (btnProduct) btnProduct.addEventListener('click', () => AdminV9.openProductModal());

    // Open Payment Modal
    const btnPayment = el('btn-open-payment-modal');
    if (btnPayment) btnPayment.addEventListener('click', () => AdminV9.openPaymentModal());

    // Hamburger menu (Mobile)
    const hamBtn = el('hamburger-btn');
    if (hamBtn) {
        hamBtn.style.display = 'block';
        hamBtn.addEventListener('click', toggleSidebar);
    }
    const backdrop = el('sidebar-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    // Auto-refresh chat every 15s
    setInterval(() => {
        if (AdminState.currentChatUserId && el('tab-chat')?.classList.contains('active')) {
            appUtils.getUserMessages(AdminState.currentChatUserId).then(msgs => {
                Render.messages(Array.isArray(msgs) ? msgs : []);
            });
        }
    }, 15000);
});

// ─────────────────────────────────────────────────────────────────
// SIDEBAR MOBILE CONTROL
// ─────────────────────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = el('admin-sidebar');
    const backdrop = el('sidebar-backdrop');
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        sidebar.classList.add('open');
        backdrop.classList.add('open');
    }
}

function closeSidebar() {
    el('admin-sidebar').classList.remove('open');
    el('sidebar-backdrop').classList.remove('open');
}
