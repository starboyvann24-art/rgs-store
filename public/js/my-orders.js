/**
 * RGS STORE — My Orders Page Logic (V5 SULTAN)
 * Corporate Light Mode + Invoice PDF Download
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
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '20px';
        container.innerHTML = ''; // STRICT DOM CLEARING

        container.innerHTML = orders.map(order => {
            const status = order.status;
            const canDownloadInvoice = status === 'success' || status === 'shipped';
            
            // Credentials block (Light Mode)
            let detailsHtml = '';
            if ((status === 'shipped' || status === 'success') && order.credentials) {
                detailsHtml = `
                    <div style="margin-top:16px;padding:16px;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;">
                        <h4 style="color:#16a34a;font-weight:800;font-size:13px;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                            🔑 Detail Akun / Produk:
                        </h4>
                        <div style="background:#fff;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span style="color:#334155;font-family:monospace;font-size:13px;word-break:break-all;">${order.credentials}</span>
                            <button onclick="store.copyToClipboard(\`${order.credentials.replace(/`/g, '\\`').replace(/'/g, "\\'")}\`)" style="color:#f97316;border:none;background:none;cursor:pointer;font-size:18px;flex-shrink:0;" title="Salin">📋</button>
                        </div>
                    </div>
                `;
            } else if (status === 'pending') {
                detailsHtml = `
                    <div style="margin-top:16px;">
                        <a href="payment.html?order_id=${order.id}" style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:#f97316;color:#fff;font-weight:700;border-radius:10px;text-decoration:none;font-size:14px;transition:background 0.2s;" onmouseover="this.style.background='#ea580c'" onmouseout="this.style.background='#f97316'">
                            💳 Bayar Sekarang →
                        </a>
                    </div>
                `;
            }

            // Invoice download button
            const invoiceBtn = canDownloadInvoice ? `
                <a href="/api/orders/${order.id}/invoice" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#fff;color:#f97316;font-weight:700;border:2px solid #f97316;border-radius:8px;text-decoration:none;font-size:12px;transition:all 0.2s;" onmouseover="this.style.background='#f97316';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#f97316'">
                    📄 Download Invoice PDF
                </a>
            ` : '';

            return `
                <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;transition:box-shadow 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
                    <div style="padding:24px;">
                        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div style="width:44px;height:44px;background:#fff7ed;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">🛒</div>
                                <div>
                                    <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Order #${order.order_number}</p>
                                    <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0;">${order.product_name}</h3>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                ${store.statusBadge(status)}
                                <p style="font-size:10px;color:#94a3b8;margin-top:4px;">${store.formatDate(order.created_at)}</p>
                            </div>
                        </div>

                        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:16px;padding:16px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;">
                            <div>
                                <p style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Jumlah</p>
                                <p style="color:#0f172a;font-weight:700;">${order.qty} Item</p>
                            </div>
                            <div>
                                <p style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Harga Satuan</p>
                                <p style="color:#0f172a;font-weight:700;">${store.formatRupiah(order.unit_price)}</p>
                            </div>
                            <div>
                                <p style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Metode</p>
                                <p style="color:#0f172a;font-weight:700;">${order.payment_method}</p>
                            </div>
                            <div style="text-align:right;">
                                <p style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Total</p>
                                <p style="font-size:18px;font-weight:900;color:#f97316;">${store.formatRupiah(order.total_price)}</p>
                            </div>
                        </div>

                        ${detailsHtml}

                        <div style="margin-top:16px;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;">
                            ${invoiceBtn}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('My Orders Error:', err);
        store.showToast('Gagal memuat pesanan.', 'error');
        loading.innerHTML = `<p style="color:#ef4444;font-size:14px;font-weight:700;text-align:center;">Terjadi kesalahan koneksi.</p>`;
    }
});
