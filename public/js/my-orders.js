/**
 * RGS STORE — My Orders Page Logic
 * Renders user order history and product details.
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!store.requireLogin()) return;

    const container = document.getElementById('orders-container');
    const loading = document.getElementById('orders-loading');
    const empty = document.getElementById('orders-empty');

    try {
        const orders = await store.getMyOrders();
        loading.classList.add('hidden');

        if (!orders || orders.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        container.innerHTML = orders.map(order => {
            const status = order.status;
            const canReview = status === 'success' || status === 'shipped';
            
            // Logic for product details (credentials)
            let detailsHtml = '';
            if ((status === 'shipped' || status === 'success') && order.credentials) {
                detailsHtml = `
                    <div class="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 class="text-emerald-500 font-bold text-sm mb-2 flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                            Detail Akun / Produk:
                        </h4>
                        <div class="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                            <span class="text-slate-200 font-mono text-sm break-all">${order.credentials}</span>
                            <button onclick="store.copyToClipboard('${order.credentials}')" class="text-emerald-500 hover:text-emerald-400 p-2 transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                            </button>
                        </div>
                    </div>
                `;
            } else if (status === 'pending') {
                detailsHtml = `
                    <div class="mt-6">
                        <a href="payment.html?order_id=${order.id}" class="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20">
                            Bayar Sekarang
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </a>
                    </div>
                `;
            }

            return `
                <div class="glass-card rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 transition-all group">
                    <div class="p-6 md:p-8">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition">
                                    <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                </div>
                                <div>
                                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Order #${order.order_number}</p>
                                    <h3 class="text-xl font-black text-white">${order.product_name}</h3>
                                </div>
                            </div>
                            <div class="flex flex-col items-start md:items-end gap-1">
                                ${store.statusBadge(status)}
                                <span class="text-[10px] text-slate-500 font-medium">${store.formatDate(order.created_at)}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-white/5">
                            <div>
                                <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Jumlah</p>
                                <p class="text-white font-bold">${order.qty} Item</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Harga Satuan</p>
                                <p class="text-white font-bold">${store.formatRupiah(order.unit_price)}</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Metode</p>
                                <p class="text-white font-bold">${order.payment_method}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Total</p>
                                <p class="text-xl font-black text-orange-500">${store.formatRupiah(order.total_price)}</p>
                            </div>
                        </div>

                        ${detailsHtml}

                        ${canReview ? `
                        <div class="mt-6 flex justify-end">
                            <button onclick="window.location.href='product.html?id=${order.product_id}'" class="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition">
                                Beri Ulasan
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('My Orders Error:', err);
        store.showToast('Gagal memuat pesanan.', 'error');
        loading.innerHTML = `<p class="text-red-500 text-sm font-bold">Terjadi kesalahan koneksi.</p>`;
    }
});
