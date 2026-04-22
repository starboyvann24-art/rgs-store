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
            <div class="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span class="text-gray-400">Order ID</span>
                <span class="text-black">#${order.order_number}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold">
                <span class="text-gray-400 uppercase text-[10px] tracking-widest">Produk</span>
                <span class="text-black text-right">${order.product_name}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold">
                <span class="text-gray-400 uppercase text-[10px] tracking-widest">Jumlah</span>
                <span class="text-black">${order.qty} Item</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Metode</span>
                <span class="px-2 py-1 bg-orange-50 text-orange-500 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-orange-100">${order.payment_method}</span>
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
                    <div class="flex flex-col items-center gap-5 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                             <img src="${selectedMethod.qris_image_url}" alt="QRIS" 
                                 class="w-full max-w-[280px] mx-auto object-contain"
                                 onerror="this.onerror=null; this.src='https://placehold.co/350x350/ffffff/ff7a00?text=SCAN+QRIS&font=Outfit';">
                        </div>
                        <p class="text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Terminal Aktif
                        </p>
                    </div>
                `;
            } else {
                detailHtml = `
                    <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 border border-gray-100">
                                <img src="${selectedMethod.logo_url || 'https://via.placeholder.com/40'}" 
                                     class="w-full h-full object-contain"
                                     onerror="this.onerror=null; this.src='https://placehold.co/80x80/ffffff/ff7a00?text=${selectedMethod.name.substring(0,2).toUpperCase()}&font=Outfit';">
                            </div>
                            <div>
                                <p class="text-black font-black text-sm uppercase tracking-tight">${selectedMethod.name}</p>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${selectedMethod.account_name}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                            <span class="text-xl font-black text-black tracking-widest">${selectedMethod.account_number}</span>
                            <button onclick="store.copyToClipboard('${selectedMethod.account_number}')" class="text-orange-500 hover:scale-110 transition p-2">
                                <i class="fa-solid fa-copy"></i>
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
