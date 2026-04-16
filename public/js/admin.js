/**
 * RGS STORE — ADMIN DASHBOARD V6 (SUPER PREMIUM)
 * Total Rewrite: Zero Bug Policy, Anti-Duplicate, Real-time Stats.
 */

const adminState = {
    products: [],
    orders: [],
    payments: [],
    tickets: [],
    waitingOrders: [],
    stats: {},
    currentChatUserId: null,
    chatUsers: [],
    files: []
};

// ─── SKELETON LOADERS ─────────────────────────────────────────
const UI = {
    showSkeletons(targetIds) {
        const skelRow = `<tr><td colspan="10" class="p-4"><div class="h-10 bg-gray-100 rounded animate-pulse w-full"></div></td></tr>`;
        targetIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id.startsWith('stat-')) {
                el.innerHTML = '<span class="animate-pulse text-gray-300">...</span>';
            } else if (id.startsWith('admin-table-') || id === 'chat-user-list' || id === 'admin-table-files') {
                el.innerHTML = skelRow.repeat(4);
            }
        });
    }
};

// ─── RENDERERS (STRICT DOM CLEARING) ──────────────────────────
const Render = {
    dashboard() {
        const s = adminState.stats;
        // Ensure keys match backend: total_revenue, total_orders, pending_orders
        document.getElementById('stat-revenue').textContent = appUtils.formatRupiah(s.total_revenue || 0);
        document.getElementById('stat-orders').textContent = s.total_orders || 0;
        document.getElementById('stat-pending').textContent = s.pending_orders || 0;
        document.getElementById('stat-products').textContent = adminState.products.length;
        document.getElementById('stat-tickets').textContent = adminState.tickets.filter(t => t.status === 'open').length;
    },

    products() {
        const tbody = document.getElementById('admin-table-products');
        if (!tbody) return;
        tbody.innerHTML = ''; // MANDATORY CLEAR
        
        if (!adminState.products.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-12 text-center text-gray-400 italic">Belum ada produk terdaftar.</td></tr>';
            return;
        }

        adminState.products.forEach((p, idx) => {
            const row = `
                <tr class="hover:bg-gray-50/80 border-b border-gray-100 transition-colors">
                    <td class="p-4 text-center text-gray-400 font-mono text-[10px]">${idx + 1}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <img src="${p.image_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg border object-cover shadow-sm">
                            <div>
                                <p class="font-bold text-gray-800 line-clamp-1">${p.name}</p>
                                <span class="bg-primary-50 text-primary-600 px-2 py-0.5 rounded text-[9px] uppercase font-black">${p.category}</span>
                            </div>
                        </div>
                    </td>
                    <td class="p-4"><span class="font-bold text-primary-600">${appUtils.formatRupiah(p.final_price)}</span></td>
                    <td class="p-4 text-center font-bold text-xs text-orange-500">${p.discount}%</td>
                    <td class="p-4 font-mono ${p.stock < 5 ? 'text-red-500 font-black scale-110' : 'text-gray-600'}">${p.stock}</td>
                    <td class="p-4 text-right space-x-2">
                        <button data-action="edit-product" data-id="${p.id}" class="text-blue-600 font-bold text-[10px] hover:underline">EDIT</button>
                        <button data-action="delete-product" data-id="${p.id}" data-name="${p.name}" class="text-red-600 font-bold text-[10px] hover:underline">HAPUS</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    orders() {
        const tbody = document.getElementById('admin-table-orders');
        if (!tbody) return;
        tbody.innerHTML = ''; // MANDATORY CLEAR

        if (!adminState.orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-12 text-center text-gray-400 italic">Tidak ada riwayat pesanan.</td></tr>';
            return;
        }

        adminState.orders.forEach(o => {
            const isSuccess = o.status === 'success';
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4">
                        <p class="font-black text-gray-900">#${o.order_number}</p>
                        <p class="text-[10px] text-gray-400 font-medium">${appUtils.formatDateShort(o.created_at)}</p>
                    </td>
                    <td class="p-4">
                        <p class="font-bold text-gray-700 text-xs">${o.user_name}</p>
                        <p class="text-[10px] text-gray-400">${o.user_email}</p>
                    </td>
                    <td class="p-4 text-xs font-medium">
                        <span class="text-gray-800">${o.product_name}</span> 
                        <span class="text-gray-400">×${o.qty}</span>
                    </td>
                    <td class="p-4 font-bold text-primary-600">${appUtils.formatRupiah(o.total_price)}</td>
                    <td class="p-4">
                        ${o.credentials ? 
                            `<div class="max-w-[140px] truncate bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded text-[10px] font-mono font-bold" title="${o.credentials}">Sent: ${o.credentials}</div>` : 
                            `<button data-action="open-delivery-modal" data-id="${o.id}" class="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-primary-600 transition shadow-sm">KIRIM PRODUK</button>`
                        }
                    </td>
                    <td class="p-4">
                        <select data-action="update-order-status" data-id="${o.id}" class="text-[10px] border rounded bg-white p-1 font-bold outline-none focus:ring-1 focus:ring-primary-400">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="success" ${o.status === 'success' ? 'selected' : ''}>Success</option>
                            <option value="failed" ${o.status === 'failed' ? 'selected' : ''}>Failed</option>
                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    verification() {
        const tbody = document.getElementById('admin-table-verification');
        if (!tbody) return;
        tbody.innerHTML = ''; // MANDATORY CLEAR FIRST

        if (!adminState.waitingOrders.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-12 text-center text-gray-400 italic">Semua pembayaran telah diverifikasi.</td></tr>';
            return;
        }

        adminState.waitingOrders.forEach(o => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4">
                        <p class="font-bold text-gray-800">#${o.order_number}</p>
                        <p class="text-[10px] text-gray-400 font-mono">${appUtils.formatDateShort(o.created_at)}</p>
                    </td>
                    <td class="p-4 text-xs"><b>${o.user_name}</b><br><span class="text-gray-400">${o.user_email}</span></td>
                    <td class="p-4 font-bold text-primary-600">${appUtils.formatRupiah(o.total_price)}</td>
                    <td class="p-4">
                        <a href="${o.payment_proof}" target="_blank" class="block w-20 h-12 border rounded-lg overflow-hidden relative group">
                            <img src="${o.payment_proof}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px] text-white font-bold">PREVIEW</div>
                        </a>
                    </td>
                    <td class="p-4 text-right space-x-1">
                        <button data-action="verify-confirm" data-id="${o.id}" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-700 transition">KONFIRMASI</button>
                        <button data-action="open-delivery-modal" data-id="${o.id}" class="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-emerald-700 transition">KIRIM + SELESAI</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    payments() {
        const tbody = document.getElementById('admin-table-payments');
        if (!tbody) return;
        tbody.innerHTML = ''; // MANDATORY CLEAR FIRST
        adminState.payments.forEach(p => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4 font-bold text-gray-800">${p.name}</td>
                    <td class="p-4"><span class="text-[10px] font-black uppercase text-gray-400">${p.type}</span></td>
                    <td class="p-4 font-mono text-xs text-gray-600">${p.account_number || '-'}</td>
                    <td class="p-4 text-xs font-bold text-gray-700">${p.account_name || '-'}</td>
                    <td class="p-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${p.is_active ? 'AKTIF' : 'MATI'}</span>
                    </td>
                    <td class="p-4 text-right space-x-2">
                        <button data-action="edit-payment" data-id="${p.id}" class="text-blue-600 font-bold text-[10px] hover:underline">EDIT</button>
                        <button data-action="delete-payment" data-id="${p.id}" class="text-red-600 font-bold text-[10px] hover:underline">HAPUS</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    tickets() {
        const tbody = document.getElementById('admin-table-tickets');
        if (!tbody) return;
        tbody.innerHTML = ''; // MANDATORY CLEAR FIRST
        adminState.tickets.forEach(t => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4 font-mono font-bold text-xs text-primary-500">#${t.ticket_number}</td>
                    <td class="p-4">
                        <p class="font-bold text-xs">${t.user_name}</p>
                        <p class="text-[10px] text-gray-400">${t.user_email}</p>
                    </td>
                    <td class="p-4">
                        <p class="font-bold text-gray-800 text-xs">${t.subject}</p>
                        <p class="text-[10px] text-gray-400 italic line-clamp-1">${t.message}</p>
                        ${t.admin_reply ? `<div class="mt-1 p-2 bg-gray-50 border-l-2 border-primary-500 text-[9px] text-gray-600"><b>Admin:</b> ${t.admin_reply}</div>` : ''}
                    </td>
                    <td class="p-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[9px] font-black ${t.status === 'open' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}">${t.status.toUpperCase()}</span>
                    </td>
                    <td class="p-4 text-right space-x-1">
                        <button data-action="reply-ticket" data-id="${t.id}" data-subject="${t.subject}" class="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-primary-600 transition">BALAS</button>
                        <button data-action="close-ticket" data-id="${t.id}" class="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-black transition">CLOSE</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    chatUsers() {
        const list = document.getElementById('chat-user-list');
        if (!list) return;
        list.innerHTML = '';
        adminState.chatUsers.forEach(u => {
            const active = adminState.currentChatUserId === u.user_id;
            const el = `
                <div data-action="select-chat-user" data-id="${u.user_id}" data-name="${u.name}" data-email="${u.email}" 
                     class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all ${active ? 'bg-primary-50 border-r-4 border-primary-500' : ''}">
                    <div class="flex justify-between items-center mb-1">
                        <p class="font-bold text-gray-800 text-sm">${u.name}</p>
                        <span class="text-[8px] text-gray-400">${u.last_message_time ? new Date(u.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    <p class="text-[11px] text-gray-500 truncate font-medium">${u.last_message || 'Tidak ada pesan'}</p>
                </div>`;
            list.insertAdjacentHTML('beforeend', el);
        });
    },

    messages(msgs) {
        const box = document.getElementById('chat-messages');
        if (!box) return;
        box.innerHTML = '';
        msgs.forEach(m => {
            const me = m.is_admin === 1;
            const fileHTML = m.file_url ? (m.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 
                `<a href="${m.file_url}" target="_blank" class="block mt-2"><img src="${m.file_url}" class="max-w-[200px] rounded-lg shadow-sm border"></a>` : 
                `<a href="${m.file_url}" target="_blank" class="flex items-center gap-2 mt-2 p-2 bg-black/5 rounded text-[10px] font-bold underline">📎 ATTACHMENT</a>`) : '';

            const el = `
                <div class="flex ${me ? 'justify-end' : 'justify-start'} mb-3">
                    <div class="max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${me ? 'bg-primary-500 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-gray-800'}">
                        ${m.message ? `<p class="leading-relaxed">${m.message}</p>` : ''}
                        ${fileHTML}
                        <div class="text-[8px] opacity-60 text-right mt-1 font-bold italic">${new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                </div>`;
            box.insertAdjacentHTML('beforeend', el);
        });
        box.scrollTop = box.scrollHeight;
    },

    files() {
        const tbody = document.getElementById('admin-table-files');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!adminState.files.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-12 text-center text-gray-400 italic">Belum ada berkas terupload.</td></tr>';
            return;
        }
        adminState.files.forEach(f => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4 font-bold text-gray-800 text-xs">
                        <a href="${f.url}" target="_blank" class="hover:underline text-blue-600">${f.name}</a>
                    </td>
                    <td class="p-4 text-[10px] text-gray-400 font-mono">${(f.size / 1024).toFixed(1)} KB</td>
                    <td class="p-4 text-[10px] text-gray-400">${appUtils.formatDateShort(f.created_at)}</td>
                    <td class="p-4 text-right space-x-2">
                        <button data-action="copy-file-link" data-url="${f.url}" class="text-primary-600 font-bold text-[10px] hover:underline">COPY LINK</button>
                        <button data-action="delete-file" data-id="${f.name}" class="text-red-600 font-bold text-[10px] hover:underline">HAPUS</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }
};

// ─── DATA ACTIONS (THE ENGINE) ───────────────────────────────
const Actions = {
    async loadAll() {
        UI.showSkeletons(['stat-revenue', 'stat-orders', 'stat-products', 'stat-pending', 'admin-table-products', 'admin-table-orders', 'admin-table-verification']);
        
        try {
            const [products, orders, stats, payments, tickets, waiting] = await Promise.all([
                appUtils.getAllProductsAdmin(),
                appUtils.getAllOrders(),
                appUtils.getOrderStats(),
                appUtils.getAllPaymentMethods(),
                appUtils.getAllTickets(),
                appUtils.getWaitingOrders()
            ]);

            adminState.products = products || [];
            adminState.orders = orders || [];
            adminState.stats = stats?.data || stats || {};
            adminState.payments = payments || [];
            adminState.tickets = tickets || [];
            adminState.waitingOrders = waiting || [];

            Render.dashboard();
            Render.products();
            Render.orders();
            Render.payments();
            Render.tickets();
            Render.verification();
            await Actions.loadFiles();
        } catch (err) {
            console.error('Failed to load admin data:', err);
            appUtils.showToast('Gagal memuat data!', 'error');
        }
    },

    async loadChat() {
        try {
            adminState.chatUsers = await appUtils.getChatUsers();
            Render.chatUsers();
        } catch (e) { console.error('Chat error:', e); }
    },

    async loadChatContent(userId) {
        try {
            const msgs = await appUtils.getUserMessages(userId);
            Render.messages(msgs);
        } catch (e) { console.error('Chat content error:', e); }
    },

    async loadFiles() {
        try {
            adminState.files = await appUtils.getAllAdminFiles();
            Render.files();
        } catch (e) { console.error('Files load error:', e); }
    }
};

// ─── GLOBAL DELEGATION ────────────────────────────────────────
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button, [data-action]');
    if (!btn) return;

    const { action, id, name, tab } = btn.dataset;

    // UI Navigation
    if (action === 'switch-tab') switchTab(tab);
    if (action === 'logout') appUtils.logout();

    // Modals
    if (action === 'open-product-modal') openProductModal();
    if (action === 'close-product-modal') closeModal('modal-product');
    if (action === 'open-payment-modal') openPaymentModal();
    if (action === 'close-payment-modal') closeModal('modal-payment');
    
    // Deletions
    if (action === 'delete-product') {
        const res = await Swal.fire({ title: 'Hapus Produk?', text: `Hapus "${name}" permanen?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!' });
        if (res.isConfirmed) { await appUtils.deleteProduct(id); Actions.loadAll(); }
    }
    if (action === 'delete-payment') {
        if ((await Swal.fire({ title: 'Hapus Metode?', icon: 'warning', showCancelButton: true })).isConfirmed) { await appUtils.deletePaymentMethod(id); Actions.loadAll(); }
    }

    // Edits
    if (action === 'edit-product') {
        const p = adminState.products.find(x => x.id === id);
        if (p) openProductModal(p);
    }
    if (action === 'edit-payment') {
        const p = adminState.payments.find(x => x.id == id);
        if (p) openPaymentModal(p);
    }

    // Processing Flow (SweetAlert2 Premium)
    if (action === 'verify-confirm') {
        const res = await Swal.fire({ title: 'Konfirmasi Bayar?', text: 'Pesanan akan masuk ke tahap PROSES.', icon: 'info', showCancelButton: true, confirmButtonColor: '#f97316' });
        if (res.isConfirmed) { await appUtils.updateOrderStatus(id, 'processing'); Actions.loadAll(); }
    }

    if (action === 'open-delivery-modal') {
        const { value: creds } = await Swal.fire({
            title: 'Kirim Produk & Akun',
            input: 'textarea',
            inputPlaceholder: 'Masukan Email:xxx Pass:xxx atau Link Data...',
            inputLabel: 'Detail ini akan dikirim otomatis ke email pembeli.',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            confirmButtonText: 'Kirim & Kirim Email'
        });
        if (creds) {
            Swal.fire({ title: 'Memproses...', didOpen: () => Swal.showLoading() });
            const deliverRes = await appUtils.deliverOrder(id, creds);
            if (deliverRes.success) {
                appUtils.showToast('✅ Pesanan Selesai & Email Terkirim!', 'success');
                Actions.loadAll();
                Swal.close();
            } else {
                Swal.fire('Gagal', deliverRes.message || 'Error saat pengiriman', 'error');
            }
        }
    }

    // Chat
    if (action === 'select-chat-user') {
        adminState.currentChatUserId = id;
        document.getElementById('current-chat-name').textContent = name;
        document.getElementById('current-chat-email').textContent = btn.dataset.email;
        Render.chatUsers();
        Actions.loadChatContent(id);
    }
    if (action === 'send-chat') sendMessageAdmin(btn);

    // Tickets
    if (action === 'reply-ticket') {
        const { value: reply } = await Swal.fire({
            title: 'Balas Tiket Support',
            text: `Membalas Tiket #${btn.dataset.id} - ${btn.dataset.subject}`,
            input: 'textarea',
            inputPlaceholder: 'Tulis balasan Anda di sini...',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            confirmButtonText: 'Kirim Balasan'
        });
        if (reply) {
            const res = await appUtils.replyTicket(id, reply);
            if (res.success) {
                appUtils.showToast('Balasan terkirim!', 'success');
                Actions.loadAll();
            } else {
                Swal.fire('Gagal', res.message, 'error');
            }
        }
    }

    if (action === 'close-ticket') {
        const res = await Swal.fire({
            title: 'Tutup Tiket?',
            text: 'Tiket akan ditandai sebagai SELESAI.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1f2937'
        });
        if (res.isConfirmed) {
            await appUtils.updateTicketStatus(id, 'closed');
            Actions.loadAll();
        }
    }

    // File Management (Merged)
    if (action === 'delete-file') {
        const res = await Swal.fire({ title: 'Hapus Berkas?', text: `Hapus "${id}" permanen?`, icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) {
            await appUtils.deleteAdminFile(id);
            Actions.loadFiles();
        }
    }
    if (action === 'copy-file-link') {
        const fullUrl = window.location.origin + btn.dataset.url;
        appUtils.copyToClipboard(fullUrl);
        appUtils.showToast('Link disalin!', 'success');
    }
});

// Select change listener
document.addEventListener('change', async (e) => {
    if (e.target.dataset.action === 'update-order-status') {
        await appUtils.updateOrderStatus(e.target.dataset.id, e.target.value);
        appUtils.showToast('Status diperbarui!', 'success');
        Actions.loadAll();
    }
});



// ─── HELPERS & FORM LOGIC ─────────────────────────────────────
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const id = form.querySelector('[id$="-id"]')?.value;
    
    appUtils.setLoading(btn, true, 'Menyimpan...');
    try {
        const formData = new FormData(form);
        
        if (form.id === 'formTambahProduk') {
            const vStr = document.getElementById('form-variants').value;
            const vArr = vStr.split(',').map(x => x.trim()).filter(x => x);
            formData.set('variants', JSON.stringify(vArr));
            const res = id ? await appUtils.updateProduct(id, formData) : await appUtils.createProduct(formData);
            if (res.success) { closeModal('modal-product'); Actions.loadAll(); }
        } else if (form.id === 'form-payment-method') {
            formData.set('is_active', document.getElementById('pay-active').checked ? '1' : '0');
            const res = id ? await appUtils.updatePaymentMethod(id, formData) : await appUtils.createPaymentMethod(formData);
            if (res.success) { closeModal('modal-payment'); Actions.loadAll(); }
        }
    } catch (err) { appUtils.showToast(err.message, 'error'); }
    finally { appUtils.setLoading(btn, false); }
}

async function sendMessageAdmin(btn) {
    const inp = document.getElementById('admin-chat-input');
    const fileInp = document.getElementById('admin-chat-file');
    const msg = inp.value.trim();
    if (!msg && !fileInp.files[0]) return;
    if (!adminState.currentChatUserId) return;

    const fd = new FormData();
    fd.append('message', msg);
    fd.append('target_user_id', adminState.currentChatUserId);
    if (fileInp.files[0]) fd.append('chat_file', fileInp.files[0]);

    appUtils.setLoading(btn, true, '...');
    const res = await appUtils.sendMessage(fd);
    appUtils.setLoading(btn, false);

    if (res.success) {
        inp.value = '';
        fileInp.value = '';
        document.getElementById('admin-chat-preview').classList.add('hidden');
        Actions.loadChatContent(adminState.currentChatUserId);
        Actions.loadChat();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    
    document.querySelectorAll('.admin-tab, .admin-tab-mob').forEach(el => {
        el.classList.remove('bg-primary-600', 'text-white', 'bg-primary-100', 'text-primary-700');
        el.classList.add('text-gray-300', 'hover:bg-gray-800', 'bg-gray-100', 'text-gray-600');
    });

    const pcBtn = document.getElementById('btn-tab-' + tabId);
    if (pcBtn) pcBtn.classList.add('bg-primary-600', 'text-white');
    const mobBtn = document.getElementById('mob-tab-' + tabId);
    if (mobBtn) mobBtn.classList.add('bg-primary-100', 'text-primary-700');

    if (tabId === 'chat') Actions.loadChat();
}

function openProductModal(p = null) {
    const form = document.getElementById('formTambahProduk');
    const container = document.getElementById('modal-product');
    form.reset();
    document.getElementById('current-image-container').classList.add('hidden');
    
    if (p) {
        document.getElementById('modal-product-title').textContent = 'Edit Produk #' + p.id;
        document.getElementById('form-id').value = p.id;
        document.getElementById('form-name').value = p.name;
        document.getElementById('form-category').value = p.category;
        document.getElementById('form-price').value = p.price;
        document.getElementById('form-discount').value = p.discount;
        document.getElementById('form-stock').value = p.stock;
        document.getElementById('form-desc').value = p.description || '';
        try { document.getElementById('form-variants').value = JSON.parse(p.variants).join(', '); } catch (e) { document.getElementById('form-variants').value = p.variants || ''; }
        if (p.image_url) {
            document.getElementById('current-image-container').classList.remove('hidden');
            document.getElementById('current-image').src = p.image_url;
        }
    } else {
        document.getElementById('modal-product-title').textContent = 'Tambah Produk Baru';
        document.getElementById('form-id').value = '';
    }
    
    container.classList.remove('hidden');
    setTimeout(() => { container.classList.remove('opacity-0'); container.querySelector('div').classList.remove('scale-95'); }, 10);
}

function openPaymentModal(pay = null) {
    const form = document.getElementById('form-payment-method');
    const container = document.getElementById('modal-payment');
    form.reset();
    document.getElementById('current-qris-container').classList.add('hidden');
    
    if (pay) {
        document.getElementById('pay-id').value = pay.id;
        document.getElementById('pay-name').value = pay.name;
        document.getElementById('pay-type').value = pay.type;
        document.getElementById('pay-number').value = pay.account_number || '';
        document.getElementById('pay-account-name').value = pay.account_name || '';
        document.getElementById('pay-active').checked = !!pay.is_active;
        if (pay.qris_image_url) {
            document.getElementById('current-qris-container').classList.remove('hidden');
            document.getElementById('current-qris-img').src = pay.qris_image_url;
        }
    }
    
    container.classList.remove('hidden');
    setTimeout(() => { container.classList.remove('opacity-0'); container.querySelector('div').classList.remove('scale-95'); }, 10);
}

function closeModal(id) {
    const container = document.getElementById(id);
    container.classList.add('opacity-0');
    container.querySelector('div').classList.add('scale-95');
    setTimeout(() => container.classList.add('hidden'), 300);
}

// ─── INITIALIZATION ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (!appUtils.requireAdmin()) return;
    Actions.loadAll();

    document.getElementById('formTambahProduk').onsubmit = handleFormSubmit;
    document.getElementById('form-payment-method').onsubmit = handleFormSubmit;

    // Mobile Sidebar Toggler
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');
    const mobileTrigger = document.getElementById('admin-mobile-menu-btn');
    const mobileClose = document.getElementById('close-admin-sidebar');
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    };

    if (mobileTrigger) mobileTrigger.onclick = toggleSidebar;
    if (mobileClose) mobileClose.onclick = toggleSidebar;
    if (overlay) overlay.onclick = toggleSidebar;

    // File Upload Handler
    const fileInp = document.getElementById('admin-file-input');
    if (fileInp) {
        fileInp.onchange = async () => {
            const file = fileInp.files[0];
            if (!file) return;
            
            const fd = new FormData();
            fd.append('admin_file', file);
            
            Swal.fire({ title: 'Mengupload...', didOpen: () => Swal.showLoading() });
            const res = await appUtils.uploadAdminFile(fd);
            Swal.close();
            
            if (res.success) {
                appUtils.showToast('✅ Berkas berhasil diupload!', 'success');
                Actions.loadFiles();
            } else {
                Swal.fire('Gagal', res.message, 'error');
            }
            fileInp.value = ''; // Reset
        };
    }

    // Chat Auto Refresh
    setInterval(() => {
        if (document.getElementById('tab-chat').classList.contains('active')) {
            if (adminState.currentChatUserId) Actions.loadChatContent(adminState.currentChatUserId);
            Actions.loadChat();
        }
    }, 12000);
});
