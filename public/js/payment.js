/**
 * RGS STORE — Payment Page Logic
 * Handles loading order details and uploading proof of payment.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard: must be logged in
    if (!store.requireLogin()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (!orderId) {
        store.showToast('Order ID tidak ditemukan.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    const orderIdInput = document.getElementById('order-id-input');
    if (orderIdInput) orderIdInput.value = orderId;

    try {
        // 2. Load Order Data
        const order = await store.getOrderById(orderId);
        if (!order) {
            throw new Error('Pesanan tidak ditemukan atau Anda tidak memiliki akses.');
        }

        // Redirect if already paid/confirmed
        if (order.status !== 'pending') {
            store.showToast('Pesanan ini sudah dikonfirmasi atau diproses.', 'info');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        // 3. Render Order Info
        const infoContainer = document.getElementById('order-info');
        infoContainer.innerHTML = `
            <div class="flex justify-between text-sm">
                <span class="text-slate-500">Invoice</span>
                <span class="font-mono text-white">#${order.order_number}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-slate-500">Produk</span>
                <span class="text-white text-right font-medium">${order.product_name}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-slate-500">Jumlah</span>
                <span class="text-white">${order.qty} Item</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-slate-500">Metode Terpilih</span>
                <span class="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[10px] font-bold uppercase">${order.payment_method}</span>
            </div>
        `;

        document.getElementById('order-total').textContent = store.formatRupiah(order.total_price);

        // 4. Render Payment Instructions
        const methods = await store.getPaymentMethods();
        const methodInfo = document.getElementById('payment-method-info');
        
        // Find matching method info from DB
        const selectedMethod = methods.find(m => order.payment_method.toLowerCase().includes(m.name.toLowerCase()));
        
        if (selectedMethod) {
            let detailHtml = '';
            if (selectedMethod.type === 'qris' && selectedMethod.qris_image_url) {
                detailHtml = `
                    <div class="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl shadow-inner">
                        <img src="${selectedMethod.qris_image_url}" alt="QRIS" 
                             style="width: 100%; max-width: 350px; object-fit: contain; margin: 0 auto; padding: 0;"
                             onerror="this.onerror=null; this.src='https://placehold.co/350x350/ff7a00/ffffff?text=SCAN+QRIS';">
                        <p class="text-slate-900 text-xs font-black uppercase tracking-widest">Scanning Terminal Active</p>
                    </div>
                `;
            } else {
                detailHtml = `
                    <div class="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div class="flex items-center gap-3">
                            <img src="${selectedMethod.logo_url || 'https://via.placeholder.com/40'}" 
                                 class="w-10 h-10 rounded-lg object-contain bg-white"
                                 onerror="this.onerror=null; this.src='https://placehold.co/40x40/ff007f/ffffff?text=${selectedMethod.name.substring(0,2).toUpperCase()}';">
                            <div>
                                <p class="text-white font-bold">${selectedMethod.name}</p>
                                <p class="text-xs text-slate-400 font-mono">${selectedMethod.account_name}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                            <span class="text-lg font-mono font-bold text-white tracking-widest">${selectedMethod.account_number}</span>
                            <button onclick="store.copyToClipboard('${selectedMethod.account_number}')" class="text-orange-500 hover:text-orange-400 transition p-1">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                            </button>
                        </div>
                    </div>
                `;
            }
            methodInfo.innerHTML = detailHtml;
        } else {
            methodInfo.innerHTML = `<p class="text-slate-400 text-sm">Instruksi pembayaran akan dikirim via admin. Silakan upload bukti jika sudah bayar.</p>`;
        }

        // Show content
        document.getElementById('payment-loading').classList.add('hidden');
        document.getElementById('payment-content').classList.remove('hidden');

    } catch (err) {
        console.error('Payment Page Error:', err);
        store.showToast(err.message || 'Gagal memuat data pembayaran.', 'error');
        setTimeout(() => window.location.href = 'index.html', 3000);
    }

    // 5. Image Preview
    const fileInput = document.getElementById('payment_proof');
    const preview = document.getElementById('proof-preview');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-2xl">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 6. Form Submission
    const form = document.getElementById('form-confirm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-confirm');
        const formData = new FormData();
        formData.append('order_id', orderId);
        formData.append('payment_proof', fileInput.files[0]);

        try {
            store.setLoading(btn, true, 'Mengunggah...');
            const res = await store.confirmOrder(formData);
            
            if (res.success) {
                store.showToast(res.message, 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
            } else {
                store.showToast(res.message || 'Gagal mengunggah bukti.', 'error');
                store.setLoading(btn, false);
            }
        } catch (err) {
            console.error('Confirm Upload Error:', err);
            store.showToast('Gagal terhubung ke server.', 'error');
            store.setLoading(btn, false);
        }
    });
});
