const userState = {
    orders: [],
    messages: []
};

// --- RENDERERS (STRICT DOM CLEARING) ---
const Render = {
    orders() {
        const ctn = document.getElementById('orders-container');
        const empty = document.getElementById('orders-empty');
        if (!ctn || !empty) return;
        
        ctn.innerHTML = ''; // CEGAH DUPLIKASI
        
        if (!userState.orders.length) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        userState.orders.forEach(o => {
            const badge = appUtils.getStatusBadge(o.status);
            const isDone = o.status === 'success' || o.status === 'shipped';
            
            const html = `
                <div class="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition bg-white shadow-sm">
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b pb-4 mb-4">
                        <div><span class="font-bold text-gray-800">#${o.order_number}</span><p class="text-xs text-gray-500 mt-0.5">${appUtils.formatDate(o.created_at)}</p></div>
                        ${badge}
                    </div>
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div><p class="font-semibold text-gray-800">${o.product_name}</p><p class="text-xs text-gray-500 mt-0.5">Jumlah: ${o.qty} · Metode: ${o.payment_method}</p></div>
                        <div class="text-right">
                            <p class="font-extrabold text-primary-600 text-lg">${appUtils.formatRupiah(o.total_price)}</p>
                            ${isDone ? `<button data-action="open-review" data-id="${o.id}" data-pid="${o.product_id}" data-pname="${o.product_name.replace(/'/g,"\\'").replace(/"/g, '&quot;')}" class="text-[10px] font-bold text-orange-500 hover:underline mt-1">⭐️ Tulis Ulasan</button>` : ''}
                        </div>
                    </div>
                    ${o.credentials ? `
                    <div class="mt-4 p-3 bg-gray-900 rounded-lg border border-primary-500/30 flex items-center justify-between gap-3">
                        <div class="overflow-hidden">
                            <label class="block text-[10px] uppercase font-black text-primary-500 mb-1 tracking-widest">Akses / Kredensial Produk:</label>
                            <div class="font-mono text-xs text-green-400 truncate">${o.credentials}</div>
                        </div>
                        <button data-action="copy-text" data-text="${o.credentials.replace(/'/g, "\\'").replace(/"/g, '&quot;')}" class="flex-shrink-0 bg-primary-500 hover:bg-primary-600 text-black px-3 py-1.5 rounded-lg text-[10px] font-bold transition">SALIN</button>
                    </div>` : ''}
                </div>`;
            ctn.insertAdjacentHTML('beforeend', html);
        });
    },

    chat() {
        const box = document.getElementById('chat-messages');
        if (!box) return;
        
        box.innerHTML = ''; // CEGAH DUPLIKASI
        box.innerHTML = '<div class="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs italic">Silakan kirim pesan mengenai kendala pesanan Anda. Admin akan membalas di sini.</div>';
        
        userState.messages.forEach(m => {
            const isMe = m.is_admin === 0;
            const hasFile = m.file_url;
            const isImg = hasFile && (hasFile.match(/\.(jpg|jpeg|png|gif|webp)$/i));
            
            const fileHTML = hasFile ? (isImg ? 
                `<a href="${m.file_url}" target="_blank" class="block mt-2"><img src="${m.file_url}" class="max-w-xs rounded-lg border shadow-sm hover:scale-[1.02] transition"></a>` : 
                `<a href="${m.file_url}" target="_blank" class="flex items-center gap-2 mt-2 p-2 bg-black/10 rounded text-[10px] font-bold underline">📎 LIHAT FILE</a>`
            ) : '';

            const html = `
                <div class="flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in">
                    <div class="max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}">
                        ${m.message ? `<p>${m.message}</p>` : ''}
                        ${fileHTML}
                        <div class="text-[10px] mt-1 opacity-60 text-right font-mono">${new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>`;
            box.insertAdjacentHTML('beforeend', html);
        });
        box.scrollTop = box.scrollHeight;
    }
};

// --- ACTIONS ---
const Actions = {
    async loadOrders() {
        try {
            userState.orders = await appUtils.getMyOrders() || [];
            Render.orders();
        } catch (e) { console.error('Orders load error:', e); }
    },
    async loadChat() {
        try {
            userState.messages = await appUtils.getMyMessages() || [];
            Render.chat();
        } catch (e) { console.error('Chat load error:', e); }
    }
};

// --- GLOBAL EVENT DELEGATION ---
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button, [data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'switch-tab') {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
    }

    if (action === 'logout') {
        appUtils.logout();
    }

    if (action === 'open-ticket-modal') {
        if (typeof store !== 'undefined' && store.openTicketModal) {
            store.openTicketModal();
        } else {
            alert('Fitur tiket sedang dimuat, silakan coba sesaat lagi.');
        }
    }

    if (action === 'copy-text') {
        appUtils.copyToClipboard(btn.dataset.text);
    }

    if (action === 'open-review') {
        const { id, pid, pname } = btn.dataset;
        const rating = prompt(`Berikan rating untuk "${pname}" (1-5):`, "5");
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) return;
        const comment = prompt(`Tulis ulasan singkat Anda:`, "Mantap, proses cepat!");
        if (!comment) return;
        
        const res = await appUtils.createReview(id, rating, comment);
        if (res.success) appUtils.showToast('✅ Ulasan berhasil dikirim!', 'success');
        else appUtils.showToast(res.message, 'error');
    }

    if (action === 'send-chat') {
        const input = document.getElementById('chat-input');
        const fileInp = document.getElementById('chat-file');
        const msg = input.value.trim();
        
        if (!msg && !fileInp.files[0]) return;
        
        const formData = new FormData();
        formData.append('message', msg);
        if (fileInp.files[0]) formData.append('chat_file', fileInp.files[0]);

        btn.disabled = true;
        const res = await appUtils.sendMessage(formData);
        btn.disabled = false;

        if (res.success) {
            input.value = '';
            fileInp.value = '';
            document.getElementById('chat-preview').classList.add('hidden');
            Actions.loadChat();
        }
    }
});

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');

    document.querySelectorAll('.dash-tab').forEach(btn => {
        btn.classList.remove('text-primary-600', 'bg-primary-50');
        btn.classList.add('text-gray-600');
    });
    const activeBtn = document.getElementById('btn-tab-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('text-primary-600', 'bg-primary-50');
        activeBtn.classList.remove('text-gray-600');
    }

    if (tabId === 'chat') Actions.loadChat();
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (!appUtils.isLoggedIn()) { window.location.href = 'login.html'; return; }
    const user = appUtils.getSavedUser();
    if (!user) { window.location.href = 'login.html'; return; }
    if (user.role === 'admin') { window.location.href = 'admin.html'; return; }

    document.getElementById('user-greeting').textContent = 'Halo, ' + user.name.split(' ')[0] + '!';
    document.getElementById('user-fullname').textContent = user.name;
    document.getElementById('user-email-text').textContent = user.email;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();

    // Link Nav Buttons to Delegation
    document.querySelectorAll('.dash-tab').forEach(btn => {
        const tabId = btn.id.replace('btn-tab-', '');
        btn.setAttribute('data-action', 'switch-tab');
        btn.setAttribute('data-tab', tabId);
        btn.removeAttribute('onclick');
    });

    // Link Navbar Brand & Logout
    // appUtils.logout is already global, but let's make it data-action for consistency if we wanted.
    
    // Link Chat Send
    const chatBtn = document.querySelector('#tab-chat button');
    if (chatBtn) {
        chatBtn.setAttribute('data-action', 'send-chat');
        chatBtn.removeAttribute('onclick');
    }

    Actions.loadOrders();

    // Auto refresh chat
    setInterval(() => {
        const chatTab = document.getElementById('tab-chat');
        if (chatTab && !chatTab.classList.contains('hidden')) {
            Actions.loadChat();
        }
    }, 10000);
});
