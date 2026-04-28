document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        document.getElementById('loading-state').innerHTML = '<p class="text-red-500 font-bold uppercase tracking-widest text-sm">Error: ID Invoice tidak ditemukan.</p>';
        return;
    }

    try {
        const res = await appUtils.apiCall(`/invoice/${orderId}`);
        if (!res.success || !res.data) {
            throw new Error(res.message || 'Invoice tidak ditemukan.');
        }

        const order = res.data;
        
        document.getElementById('inv-number').textContent = order.order_number;
        document.getElementById('inv-customer-name').textContent = order.user_name;
        document.getElementById('inv-customer-email').textContent = order.user_email;
        document.getElementById('inv-customer-wa').textContent = order.user_whatsapp || '-';
        document.getElementById('inv-date').textContent = new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        document.getElementById('inv-method').textContent = order.payment_method;
        
        let statusColor = 'bg-yellow-100 text-yellow-600';
        if (order.status === 'success' || order.status === 'shipped') statusColor = 'bg-green-100 text-green-600';
        else if (order.status === 'failed' || order.status === 'cancelled') statusColor = 'bg-red-100 text-red-600';
        
        const badge = document.getElementById('inv-status-badge');
        badge.textContent = order.status;
        badge.className = `inline-block px-2 py-1 text-[10px] font-bold uppercase rounded ${statusColor}`;

        const itemsContainer = document.getElementById('inv-items');
        let parsedNotes = {};
        try { parsedNotes = JSON.parse(order.notes || '{}'); } catch(e){}
        
        const itemsList = parsedNotes.items || [{
            name: order.product_name,
            qty: order.qty,
            unit_price: order.unit_price || order.total_price / order.qty,
            total: order.total_price
        }];

        itemsContainer.innerHTML = itemsList.map(item => `
            <tr class="border-b border-gray-100">
                <td class="py-4 text-sm font-bold text-gray-800">${item.name}</td>
                <td class="py-4 text-sm text-gray-600 text-center">${item.qty}</td>
                <td class="py-4 text-sm text-gray-600 text-right">${appUtils.formatRupiah(item.unit_price || item.price)}</td>
                <td class="py-4 text-sm font-bold text-gray-800 text-right">${appUtils.formatRupiah(item.total || (item.qty * (item.unit_price || item.price)))}</td>
            </tr>
        `).join('');

        document.getElementById('inv-subtotal').textContent = appUtils.formatRupiah(order.total_price);
        document.getElementById('inv-total').textContent = appUtils.formatRupiah(order.total_price);

        // Generate QR
        const qrCanvas = document.getElementById('inv-qrcode');
        QRCode.toCanvas(qrCanvas, `https://rgs-store.my.id/invoice.html?id=${order.id}`, { width: 110, margin: 1 }, function (error) {
            if (error) console.error(error);
        });

        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('invoice-content').classList.remove('hidden');

    } catch (err) {
        console.error(err);
        document.getElementById('loading-state').innerHTML = `<p class="text-red-500 font-bold text-sm">${err.message}</p>`;
    }

    document.getElementById('btn-download-pdf').addEventListener('click', () => {
        const element = document.getElementById('invoice-content');
        const opt = {
            margin:       0.5,
            filename:     `Invoice-${document.getElementById('inv-number').textContent}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
});
