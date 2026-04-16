// OMEGA REWRITE: Global State & Event Delegation
const adminState = {
    products: [],
    orders: [],
    payments: [],
    tickets: [],
    waitingOrders: [],
    chatUsers: [],
    currentChatUserId: null,
    stats: {}
};

// --- RENDERERS (STRICT DOM CLEARING) ---
const Render = {
    dashboard() {
        const s = adminState.stats;
        document.getElementById('stat-revenue').textContent = appUtils.formatRupiah(s.total_revenue || 0);
        document.getElementById('stat-orders').textContent = s.total_orders || 0;
        document.getElementById('stat-pending').textContent = s.pending_orders || 0;
        document.getElementById('stat-products').textContent = adminState.products.filter(p => p.is_active).length;
        document.getElementById('stat-tickets').textContent = adminState.tickets.filter(t => t.status === 'open').length;
    },

    products() {
        const tbody = document.getElementById('admin-table-products');
        if (!tbody) return;
        tbody.innerHTML = ''; // CEGAH DUPLIKASI
        if (!adminState.products.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-400 text-xs italic">Belum ada produk.</td></tr>';
            return;
        }
        adminState.products.forEach((p, idx) => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4 text-center text-gray-400 font-mono text-[10px]">${idx + 1}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <img src="${p.image_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded border object-cover">
                            <div>
                                <p class="font-bold text-gray-800 line-clamp-1">${p.name}</p>
                                <span class="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-black text-gray-500">${p.category}</span>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 font-bold text-primary-600">${appUtils.formatRupiah(p.final_price)}</td>
                    <td class="p-4 text-center font-bold text-xs">${p.discount}%</td>
                    <td class="p-4 font-mono ${p.stock < 10 ? 'text-red-500 font-black' : 'text-gray-600'}">${p.stock}</td>
                    <td class="p-4 text-right space-x-2">
                        <button data-action="edit-product" data-id="${p.id}" class="text-blue-600 font-bold text-xs hover:underline decoration-2">EDIT</button>
                        <button data-action="delete-product" data-id="${p.id}" data-name="${p.name}" class="text-red-600 font-bold text-xs hover:underline decoration-2">HAPUS</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    orders() {
        const tbody = document.getElementById('admin-table-orders');
        if (!tbody) return;
        tbody.innerHTML = ''; // CEGAH DUPLIKASI
        if (!adminState.orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-gray-400 text-xs italic">Belum ada pesanan masuk.</td></tr>';
            return;
        }
        adminState.orders.forEach(o => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4"><p class="font-bold text-gray-800">#${o.order_number}</p><p class="text-[10px] text-gray-400">${appUtils.formatDateShort(o.created_at)}</p></td>
                    <td class="p-4 text-xs font-bold text-gray-700">${o.user_name}<br><span class="text-[10px] text-gray-400 font-normal">${o.user_email}</span></td>
                    <td class="p-4 text-xs font-medium">${o.product_name} x ${o.qty}</td>
                    <td class="p-4 font-bold text-primary-600">${appUtils.formatRupiah(o.total_price)}</td>
                    <td class="p-4">
                        ${o.credentials ? 
                            `<span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold overflow-hidden text-ellipsis block max-w-xs whitespace-nowrap" title="${o.credentials}">Sudah Dikirim</span>` : 
                            `<button data-action="open-delivery-modal" data-id="${o.id}" class="bg-primary-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-600 transition shadow">Proses (Kirim)</button>`
                        }
                    </td>
                    <td class="p-4">
                        <select data-action="update-order-status" data-id="${o.id}" class="text-[10px] border rounded bg-white p-1 font-bold">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="success" ${o.status === 'success' ? 'selected' : ''}>Success</option>
                            <option value="failed" ${o.status === 'failed' ? 'selected' : ''}>Failed</option>
                        </select>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    payments() {
        const tbody = document.getElementById('admin-table-payments');
        if (!tbody) return;
        tbody.innerHTML = ''; // CEGAH DUPLIKASI
        adminState.payments.forEach(p => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4 font-bold text-gray-800">${p.name}</td>
                    <td class="p-4 text-xs font-black uppercase text-gray-500">${p.type}</td>
                    <td class="p-4 text-xs font-mono text-gray-600">${p.account_number || '-'}</td>
                    <td class="p-4 text-xs font-medium text-gray-700">${p.account_name || '-'}</td>
                    <td class="p-4 text-center">
                        <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-black ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${p.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
                    </td>
                    <td class="p-4 text-right space-x-2">
                        <button data-action="edit-payment" data-id="${p.id}" class="text-blue-600 font-black text-xs hover:underline">EDIT</button>
                        <button data-action="delete-payment" data-id="${p.id}" class="text-red-600 font-black text-xs hover:underline">HAPUS</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    chatUsers() {
        const list = document.getElementById('chat-user-list');
        if (!list) return;
        list.innerHTML = ''; // CEGAH DUPLIKASI
        adminState.chatUsers.forEach(u => {
            const active = adminState.currentChatUserId === u.user_id;
            const el = `
                <div data-action="select-chat-user" data-id="${u.user_id}" data-name="${u.name}" data-email="${u.email}" 
                     class="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 ${active ? 'bg-primary-50 border-r-4 border-primary-500' : ''}">
                    <p class="font-bold text-gray-800 text-sm">${u.name}</p>
                    <p class="text-[10px] text-gray-400 truncate">${u.last_message || '...'}</p>
                </div>`;
            list.insertAdjacentHTML('beforeend', el);
        });
    },

    chatMessages(msgs) {
        const box = document.getElementById('chat-messages');
        if (!box) return;
        box.innerHTML = ''; // CEGAH DUPLIKASI
        msgs.forEach(m => {
            const me = m.is_admin === 1;
            const hasFile = m.file_url;
            const isImg = hasFile && (hasFile.match(/\.(jpg|jpeg|png|gif|webp)$/i));
            
            const fileHTML = hasFile ? (isImg ? 
                `<a href="${m.file_url}" target="_blank" class="block mt-2"><img src="${m.file_url}" class="max-w-xs rounded-lg border shadow-sm hover:scale-[1.02] transition"></a>` : 
                `<a href="${m.file_url}" target="_blank" class="flex items-center gap-2 mt-2 p-2 bg-black/10 rounded text-[10px] font-bold underline">📎 LIHAT FILE</a>`
            ) : '';

            const el = `
                <div class="flex ${me ? 'justify-end' : 'justify-start'} animate-fade-in">
                    <div class="max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${me ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}">
                        ${m.message ? `<p>${m.message}</p>` : ''}
                        ${fileHTML}
                        <div class="text-[8px] opacity-70 text-right mt-1 font-mono">${new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                </div>`;
            box.insertAdjacentHTML('beforeend', el);
        });
        box.scrollTop = box.scrollHeight;
    },

    tickets() {
        const tbody = document.getElementById('admin-table-tickets');
        if (!tbody) return;
        tbody.innerHTML = ''; // CEGAH DUPLIKASI
        adminState.tickets.forEach(t => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4 font-mono font-bold text-xs">#${t.ticket_number || t.id.slice(0, 8)}</td>
                    <td class="p-4 text-xs"><b>${t.user_name}</b><br><span class="text-gray-400">${t.user_email}</span></td>
                    <td class="p-4"><p class="font-bold text-gray-800 text-xs">${t.subject}</p><p class="text-[10px] text-gray-500 line-clamp-1">${t.message}</p></td>
                    <td class="p-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black ${t.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">${t.status.toUpperCase()}</span>
                    </td>
                    <td class="p-4 text-right">
                        <button data-action="close-ticket" data-id="${t.id}" class="bg-gray-800 text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-black transition">TUTUP TIKET</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    },

    verification() {
        const tbody = document.getElementById('admin-table-verification');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!adminState.waitingOrders.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400 text-xs italic">Tidak ada pembayaran yang menunggu verifikasi.</td></tr>';
            return;
        }
        adminState.waitingOrders.forEach(o => {
            const row = `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="p-4"><p class="font-bold text-gray-800">#${o.order_number}</p><p class="text-[10px] text-gray-400">${appUtils.formatDateShort(o.created_at)}</p></td>
                    <td class="p-4 text-xs font-bold text-gray-700">${o.user_name}<br><span class="text-[10px] text-gray-400 font-normal">${o.user_email}</span></td>
                    <td class="p-4 font-bold text-primary-600">${appUtils.formatRupiah(o.total_price)}</td>
                    <td class="p-4">
                        <a href="${o.payment_proof}" target="_blank" class="block w-20 h-12 border rounded overflow-hidden hover:opacity-80 transition group relative">
                            <img src="${o.payment_proof}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px] text-white font-bold">LIHAT</div>
                        </a>
                    </td>
                    <td class="p-4 text-right space-x-1">
                        <button data-action="verify-confirm" data-id="${o.id}" class="bg-blue-600 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-blue-700 transition shadow-sm">Konfirmasi</button>
                        <button data-action="verify-complete" data-id="${o.id}" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-emerald-700 transition shadow-sm">Selesaikan</button>
                    </td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }
};

// --- DATA LOADERS ---
const Actions = {
    async loadAll() {
        try {
            // Loading indicator for stats
            ['stat-revenue', 'stat-orders', 'stat-pending', 'stat-products', 'stat-tickets'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<span class="animate-pulse text-gray-300">...</span>';
            });

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
            adminState.stats = stats || {};
            adminState.payments = payments || [];
            adminState.tickets = tickets || [];
            adminState.waitingOrders = waiting || [];

            Render.dashboard();
            Render.products();
            Render.orders();
            Render.payments();
            Render.tickets();
            Render.verification();
        } catch (e) { console.error('Data Load Error:', e); }
    },

    async loadChat() {
        try {
            adminState.chatUsers = await appUtils.getChatUsers();
            Render.chatUsers();
        } catch (e) { console.error('Chat Load Error:', e); }
    },

    async loadChatContent(userId) {
        try {
            const msgs = await appUtils.getUserMessages(userId);
            Render.chatMessages(msgs);
        } catch (e) { console.error('Chat Content Error:', e); }
    }
};

// --- GLOBAL EVENT DELEGATION (ANTI-DEAD BUTTON) ---
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button, [data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    // --- TABS & MODALS ---
    if (action === 'switch-tab') {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
    }
    if (action === 'logout') {
        appUtils.logout();
    }
    if (action === 'open-product-modal') openProductModal();
    if (action === 'close-product-modal') closeFormModal();
    if (action === 'open-payment-modal') openPaymentModal();
    if (action === 'close-payment-modal') closePaymentModal();
    if (action === 'open-delivery-modal') openDeliveryModal(id);
    if (action === 'close-delivery-modal') closeDeliveryModal();

    // --- PRODUCT ACTIONS ---
    if (action === 'edit-product') {
        const p = adminState.products.find(x => x.id === id);
        if (p) openProductModal(p);
    }
    if (action === 'delete-product') {
        if (confirm(`Hapus produk "${btn.dataset.name}"?`)) {
            await appUtils.deleteProduct(id);
            Actions.loadAll();
        }
    }

    // --- PAYMENT ACTIONS ---
    if (action === 'edit-payment') {
        const p = adminState.payments.find(x => x.id == id);
        if (p) openPaymentModal(p);
    }
    if (action === 'delete-payment') {
        if (confirm('Hapus metode pembayaran ini?')) {
            await appUtils.deletePaymentMethod(id);
            Actions.loadAll();
        }
    }

    // --- ORDER ACTIONS ---
    // (Removed legacy save-creds button logic since we use a popup now)

    // --- CHAT ACTIONS ---
    if (action === 'select-chat-user') {
        adminState.currentChatUserId = id;
        document.getElementById('current-chat-name').textContent = btn.dataset.name;
        document.getElementById('current-chat-email').textContent = btn.dataset.email;
        Render.chatUsers();
        Actions.loadChatContent(id);
    }
    if (action === 'send-chat') {
        const inp = document.getElementById('admin-chat-input');
        const fileInp = document.getElementById('admin-chat-file');
        const msg = inp.value.trim();
        
        if ((msg || fileInp.files[0]) && adminState.currentChatUserId) {
            const formData = new FormData();
            formData.append('message', msg);
            formData.append('target_user_id', adminState.currentChatUserId);
            if (fileInp.files[0]) formData.append('chat_file', fileInp.files[0]);

            appUtils.setLoading(btn, true, 'Kirim...');
            await appUtils.sendMessage(formData);
            appUtils.setLoading(btn, false);
            
            inp.value = '';
            fileInp.value = '';
            document.getElementById('admin-chat-preview').classList.add('hidden');
            
            Actions.loadChatContent(adminState.currentChatUserId);
            Actions.loadChat();
        }
    }

    // --- TICKET ACTIONS ---
    if (action === 'close-ticket') {
        await appUtils.updateTicketStatus(id, 'closed');
        Actions.loadAll();
    }

    // --- VERIFICATION ACTIONS ---
    if (action === 'verify-confirm') {
        if (confirm('Konfirmasi pembayaran ini dan pindahkan ke "Sedang Diproses"?')) {
            await appUtils.updateOrderStatus(id, 'processing');
            appUtils.showToast('✅ Pembayaran dikonfirmasi!', 'success');
            Actions.loadAll();
        }
    }
    if (action === 'verify-complete') {
        const creds = prompt("Masukkan Kredensial/Detail Pesanan (Akun/Link):");
        if (creds) {
            await appUtils.deliverOrder(id, creds);
            await appUtils.updateOrderStatus(id, 'success');
            appUtils.showToast('✅ Pesanan selesai dan terkirim!', 'success');
            Actions.loadAll();
        }
    }
});

// HANDLE SELECT CHANGE SEPARATELY
document.addEventListener('change', async (e) => {
    if (e.target.dataset.action === 'update-order-status') {
        const id = e.target.dataset.id;
        const status = e.target.value;
        await appUtils.updateOrderStatus(id, status);
        appUtils.showToast('✅ Status pesanan diperbarui!', 'success');
        Actions.loadAll();
    }
});

// --- SUBMIT HANDLERS (PURE FORMDATA) ---
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formId = form.id;
    const btn = form.querySelector('button[type="submit"]') || document.getElementById('btn-save-product') || document.getElementById('btn-save-payment');
    
    appUtils.setLoading(btn, true, 'Menyimpan...');
    try {
        const formData = new FormData(form);
        const id = form.querySelector('[id$="-id"]').value; // Handles form-id or pay-id

        if (formId === 'formTambahProduk') {
            // Variants processing
            const vStr = document.getElementById('form-variants').value;
            const vArr = vStr.split(',').map(x => x.trim()).filter(x => x);
            formData.set('variants', JSON.stringify(vArr));

            const res = id ? await appUtils.updateProduct(id, formData) : await appUtils.createProduct(formData);
            if (res.success) {
                appUtils.showToast('✅ Produk Berhasil Disimpan!', 'success');
                closeFormModal(); Actions.loadAll();
            }
        } else if (formId === 'form-payment-method') {
            formData.set('is_active', document.getElementById('pay-active').checked ? '1' : '0');
            const res = id ? await appUtils.updatePaymentMethod(id, formData) : await appUtils.createPaymentMethod(formData);
            if (res.success) {
                appUtils.showToast('✅ Metode Pembayaran Tersimpan!', 'success');
                closePaymentModal(); Actions.loadAll();
            }
        } else if (formId === 'form-delivery') {
            // Processing Delivery via Modal
            const orderId = document.getElementById('delivery-order-id').value;
            const creds = document.getElementById('delivery-credentials').value;
            const res = await appUtils.deliverOrder(orderId, creds);
            if (res && res.success) {
                appUtils.showToast('✅ Produk Berhasil Dikirim (Email ter-trigger)!', 'success');
                closeDeliveryModal(); Actions.loadAll();
            } else {
                appUtils.showToast(res?.message || 'Gagal mengirim produk', 'error');
            }
        }
    } catch (err) { Swal.fire("Error", "ERROR: " + err.message, "error"); }
    finally { appUtils.setLoading(btn, false); }
}

// --- TAB & MODAL HELPERS ---
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    
    document.querySelectorAll('.admin-tab').forEach(el => {
        el.classList.remove('bg-primary-600', 'text-white');
        el.classList.add('text-gray-300', 'hover:bg-gray-800');
    });
    const activeBtn = document.getElementById('btn-tab-' + tabId) || document.getElementById('mob-tab-' + tabId);
    if (activeBtn) activeBtn.classList.add('bg-primary-600', 'text-white');

    if (tabId === 'chat') Actions.loadChat();
};

window.openProductModal = (p = null) => {
    const form = document.getElementById('formTambahProduk');
    form.reset();
    const title = document.getElementById('modal-product-title');
    const idInp = document.getElementById('form-id');
    const curImg = document.getElementById('current-image-container');

    if (p) {
        title.textContent = 'Edit Produk';
        idInp.value = p.id;
        document.getElementById('form-name').value = p.name;
        document.getElementById('form-category').value = p.category;
        document.getElementById('form-price').value = p.price;
        document.getElementById('form-discount').value = p.discount;
        document.getElementById('form-stock').value = p.stock;
        document.getElementById('form-desc').value = p.description || '';
        
        let vars = '';
        try { vars = JSON.parse(p.variants).join(', '); } catch (e) { vars = p.variants || ''; }
        document.getElementById('form-variants').value = vars;

        if (p.image_url) {
            curImg.classList.remove('hidden');
            document.getElementById('current-image').src = p.image_url;
        } else { curImg.classList.add('hidden'); }
    } else {
        title.textContent = 'Tambah Produk';
        idInp.value = '';
        curImg.classList.add('hidden');
    }

    const m = document.getElementById('modal-product');
    m.classList.remove('hidden');
    setTimeout(() => { m.classList.remove('opacity-0'); m.querySelector('div').classList.remove('scale-95'); }, 10);
};

window.openPaymentModal = (pay = null) => {
    const form = document.getElementById('form-payment-method');
    form.reset();
    const idInp = document.getElementById('pay-id');
    const curQris = document.getElementById('current-qris-container');

    if (pay) {
        idInp.value = pay.id;
        document.getElementById('pay-name').value = pay.name;
        document.getElementById('pay-type').value = pay.type;
        document.getElementById('pay-number').value = pay.account_number || '';
        document.getElementById('pay-account-name').value = pay.account_name || '';
        document.getElementById('pay-active').checked = !!pay.is_active;
        
        if (pay.qris_image_url) {
            curQris.classList.remove('hidden');
            document.getElementById('current-qris-img').src = pay.qris_image_url;
        } else { curQris.classList.add('hidden'); }
    } else {
        idInp.value = '';
        curQris.classList.add('hidden');
    }

    const m = document.getElementById('modal-payment');
    m.classList.remove('hidden');
    setTimeout(() => { m.classList.remove('opacity-0'); m.querySelector('div').classList.remove('scale-95'); }, 10);
};

window.closeFormModal = () => {
    const m = document.getElementById('modal-product');
    m.classList.add('opacity-0');
    m.querySelector('div').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.closePaymentModal = () => {
    const m = document.getElementById('modal-payment');
    m.classList.add('opacity-0');
    m.querySelector('div').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.openDeliveryModal = (id) => {
    document.getElementById('delivery-order-id').value = id;
    document.getElementById('delivery-credentials').value = '';
    const m = document.getElementById('modal-delivery');
    m.classList.remove('hidden');
    setTimeout(() => { m.classList.remove('opacity-0'); m.querySelector('div').classList.remove('scale-95'); }, 10);
};

window.closeDeliveryModal = () => {
    const m = document.getElementById('modal-delivery');
    m.classList.add('opacity-0');
    m.querySelector('div').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (!appUtils.requireAdmin()) return;
    Actions.loadAll();

    // Bind Form Submits
    document.getElementById('formTambahProduk').onsubmit = handleFormSubmit;
    document.getElementById('form-payment-method').onsubmit = handleFormSubmit;
    document.getElementById('form-delivery').onsubmit = handleFormSubmit;
    
    // Auto Refresh for Chat
    setInterval(() => {
        if (document.getElementById('tab-chat').classList.contains('active')) {
            if (adminState.currentChatUserId) Actions.loadChatContent(adminState.currentChatUserId);
            Actions.loadChat();
        }
    }, 10000);

    // Mobile Admin Sidebar Offcanvas
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');
    const mobileBtn = document.getElementById('admin-mobile-menu-btn');
    const closeBtn = document.getElementById('close-admin-sidebar');

    if (mobileBtn && sidebar) {
        const toggleMenu = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        };
        mobileBtn.addEventListener('click', toggleMenu);
        closeBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        // Autoclose sidebar when navigating in mobile
        document.querySelectorAll('.admin-tab').forEach(btn => btn.addEventListener('click', () => {
            if (window.innerWidth <= 768) toggleMenu();
        }));
    }
});
