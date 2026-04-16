/**
 * RGS STORE — My Orders Page Logic (V10)
 * Dark Neon Theme + Correct Invoice Download + Anti-spam DOM clear
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    if (!store.requireLogin()) return;

    const container = document.getElementById('orders-container');
    const loading   = document.getElementById('orders-loading');
    const empty     = document.getElementById('orders-empty');

    // Inject dark neon base styles for this page
    document.body.style.background = '#060810';
    document.body.style.color = '#e2e8f0';

    try {
        const orders = await store.getMyOrders();
        if (loading) loading.style.display = 'none';

        if (!orders || orders.length === 0) {
            if (empty) { empty.classList.remove('hidden'); empty.style.display = 'flex'; }
            return;
        }

        if (container) {
            container.classList.remove('hidden');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '20px';
            container.innerHTML = ''; // STRICT DOM CLEAR — ANTI SPAM
        }

        orders.forEach(order => {
            const status = order.status;
            const canInvoice = (status === 'success' || status === 'shipped');

            // ── Credentials block ──────────────────────────────────────
            let credHtml = '';
            if ((status === 'shipped' || status === 'success') && order.credentials) {
                const safeCredentials = (order.credentials || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/'/g, "\\'");
                credHtml = `
                    <div style="margin-top:16px; padding:16px; border-radius:12px; background:rgba(0,255,136,0.06); border:1px solid rgba(0,255,136,0.2);">
                        <h4 style="color:#00ff88; font-weight:800; font-size:13px; margin-bottom:8px;">🔑 Detail Akun / Produk:</h4>
                        <div style="background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between; gap:8px;">
                            <span style="color:#e2e8f0; font-family:monospace; font-size:13px; word-break:break-all;">${order.credentials}</span>
                            <button onclick="store.copyToClipboard(\`${safeCredentials}\`)" style="color:#ff9d00; border:none; background:none; cursor:pointer; font-size:18px; flex-shrink:0;" title="Salin">📋</button>
                        </div>
                    </div>`;
            } else if (status === 'pending') {
                credHtml = `
                    <div style="margin-top:16px;">
                        <a href="payment.html?order_id=${order.id}" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; background:linear-gradient(135deg,#ff9d00,#ff6b00); color:#000; font-weight:800; border-radius:10px; text-decoration:none; font-size:14px; box-shadow:0 0 16px rgba(255,157,0,0.4);">
                            💳 Bayar Sekarang →
                        </a>
                    </div>`;
            } else if (status === 'waiting_confirmation' || status === 'processing') {
                credHtml = `
                    <div style="margin-top:16px; padding:12px 16px; background:rgba(255,157,0,0.08); border:1px solid rgba(255,157,0,0.2); border-radius:10px;">
                        <p style="color:#fbbf24; font-weight:700; font-size:13px; margin:0;">⏳ Pembayaran sedang dalam proses verifikasi. Produk akan dikirim segera.</p>
                    </div>`;
            }

            // ── Invoice download button (window.open with auth token) ──
            // Token is passed as a URL param so the server can verify ownership
            const token = store.getToken ? store.getToken() : localStorage.getItem('rgs_jwt');
            const invoiceBtn = canInvoice ? `
                <button onclick="downloadInvoice('${order.id}', '${token}')"
                    style="display:inline-flex; align-items:center; gap:6px; padding:9px 18px;
                           background:rgba(0,243,255,0.08); color:#00f3ff;
                           font-weight:700; border:1px solid rgba(0,243,255,0.3);
                           border-radius:8px; font-size:12px; cursor:pointer; letter-spacing:0.5px;
                           transition:all 0.2s;"
                    onmouseover="this.style.background='rgba(0,243,255,0.15)'; this.style.boxShadow='0 0 12px rgba(0,243,255,0.25)';"
                    onmouseout="this.style.background='rgba(0,243,255,0.08)'; this.style.boxShadow='none';">
                    📄 Download Invoice PDF
                </button>` : '';

            // ── Status badge ───────────────────────────────────────────
            const badgeMap = {
                pending:              'background:rgba(255,157,0,0.15); color:#ff9d00; border:1px solid rgba(255,157,0,0.3)',
                waiting_confirmation: 'background:rgba(251,191,36,0.15); color:#fbbf24; border:1px solid rgba(251,191,36,0.3)',
                processing:           'background:rgba(0,243,255,0.12); color:#00f3ff; border:1px solid rgba(0,243,255,0.2)',
                success:              'background:rgba(0,255,136,0.12); color:#00ff88; border:1px solid rgba(0,255,136,0.2)',
                failed:               'background:rgba(255,51,102,0.12); color:#ff3366; border:1px solid rgba(255,51,102,0.2)',
                cancelled:            'background:rgba(100,116,139,0.12); color:#64748b; border:1px solid rgba(100,116,139,0.2)',
            };
            const badgeText = { pending:'⏳ Pending', waiting_confirmation:'🔍 Menunggu Verif.', processing:'🔄 Proses', success:'✅ Selesai', failed:'❌ Gagal', cancelled:'🚫 Batal' };
            const badgeStyle = badgeMap[status] || 'background:rgba(255,255,255,0.08); color:#94a3b8;';
            const badgeLbl   = badgeText[status] || status;

            const card = document.createElement('div');
            card.style.cssText = 'background:#111827; border-radius:16px; border:1px solid rgba(255,157,0,0.12); overflow:hidden; transition:all 0.3s;';
            card.onmouseover = () => { card.style.borderColor='rgba(255,157,0,0.35)'; card.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)'; };
            card.onmouseout  = () => { card.style.borderColor='rgba(255,157,0,0.12)'; card.style.boxShadow='none'; };

            card.innerHTML = `
                <div style="padding:24px;">
                    <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:44px; height:44px; background:rgba(255,157,0,0.1); border:1px solid rgba(255,157,0,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px;">🛒</div>
                            <div>
                                <p style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px;">Order #${order.order_number}</p>
                                <h3 style="font-size:16px; font-weight:800; color:#fff; margin:0;">${order.product_name || '—'}</h3>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="display:inline-block; padding:4px 12px; border-radius:99px; font-size:11px; font-weight:800; letter-spacing:1px; ${badgeStyle}">${badgeLbl}</span>
                            <p style="font-size:10px; color:#475569; margin-top:6px;">${store.formatDate(order.created_at)}</p>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:16px; padding:16px 0; border-top:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div>
                            <p style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Jumlah</p>
                            <p style="color:#e2e8f0; font-weight:700;">${order.qty} Item</p>
                        </div>
                        <div>
                            <p style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Harga Satuan</p>
                            <p style="color:#e2e8f0; font-weight:700;">${store.formatRupiah(order.unit_price)}</p>
                        </div>
                        <div>
                            <p style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Metode</p>
                            <p style="color:#e2e8f0; font-weight:700;">${order.payment_method || '—'}</p>
                        </div>
                        <div style="text-align:right;">
                            <p style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Total</p>
                            <p style="font-size:18px; font-weight:900; color:#ff9d00;">${store.formatRupiah(order.total_price)}</p>
                        </div>
                    </div>

                    ${credHtml}

                    <div style="margin-top:16px; display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px;">
                        ${invoiceBtn}
                    </div>
                </div>`;

            if (container) container.appendChild(card);
        });

    } catch (err) {
        console.error('My Orders Error:', err);
        store.showToast('Gagal memuat pesanan. Periksa koneksi Anda.', 'error');
        if (loading) loading.innerHTML = `<p style="color:#ff3366; font-size:14px; font-weight:700; text-align:center;">Terjadi kesalahan koneksi ke server.</p>`;
    }
});

/**
 * Download invoice PDF — passes JWT token via header using fetch + blob URL
 * This is necessary because window.open won't send Authorization headers.
 */
window.downloadInvoice = async function(orderId, token) {
    try {
        Swal.fire({ title: 'Menyiapkan Invoice...', didOpen: () => Swal.showLoading(), background: '#0a0e17', color: '#e2e8f0' });
        const response = await fetch(`/api/orders/${orderId}/invoice`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || localStorage.getItem('rgs_jwt')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Server error' }));
            Swal.fire({ title: 'Gagal', text: errorData.message || 'Tidak dapat memuat invoice.', icon: 'error', background: '#0a0e17', color: '#e2e8f0' });
            return;
        }

        const blob = await response.blob();
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `Invoice-RGS-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.close();
        store.showToast('✅ Invoice berhasil didownload!', 'success');
    } catch (err) {
        console.error('Invoice download error:', err);
        Swal.fire({ title: 'Error', text: 'Gagal mendownload invoice: ' + err.message, icon: 'error', background: '#0a0e17', color: '#e2e8f0' });
    }
};
